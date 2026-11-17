import {BRAZILIAN_BANKS} from '../data/banks';
import {
  AmortizationSystem,
  BankComparisonItem,
  BankConfig,
  BrokerProfile,
  DocumentationEstimate,
  InstallmentRow,
  SimulationInput,
  SimulationResult,
  TermComparison,
} from '../types';

/**
 * Formatting helpers (PT-BR)
 */
export function formatBRL(value: number): string {
  if (!Number.isFinite(value)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatBRLCompact(value: number): string {
  if (!Number.isFinite(value)) return 'R$ 0';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPercent(value: number, decimals = 2): string {
  if (!Number.isFinite(value)) return '0,00%';
  return `${value.toFixed(decimals).replace('.', ',')}%`;
}

/**
 * Age-based MIP (Morte e Invalidez Permanente) monthly rate over outstanding debt balance
 */
export function getMipMonthlyRate(age: number): number {
  if (age <= 25) return 0.00014;
  if (age <= 35) return 0.00021;
  if (age <= 45) return 0.00034;
  if (age <= 55) return 0.00062;
  if (age <= 65) return 0.00105;
  return 0.00165;
}

/**
 * DFI (Danos Físicos ao Imóvel) monthly rate over property evaluation value
 */
export const DFI_MONTHLY_RATE = 0.000068;

/**
 * Effective monthly rate from annual effective rate (%)
 */
export function annualToMonthlyRate(annualRatePercent: number): number {
  if (annualRatePercent <= 0) return 0;
  return Math.pow(1 + annualRatePercent / 100, 1 / 12) - 1;
}

/**
 * Documentation costs estimate (ITBI + Cartório + Bank Appraisal)
 */
export function calculateDocumentation(input: SimulationInput): DocumentationEstimate {
  const {propertyValue, downPayment, itbiPercent, notaryPercent, firstPropertyDiscount} = input;
  const itbiValue = propertyValue * (itbiPercent / 100);
  // First SFH property often gets up to 50% discount on notary registration fee in Brazil
  const effectiveNotaryPercent = firstPropertyDiscount ? notaryPercent * 0.5 : notaryPercent;
  const notaryValue = propertyValue * (effectiveNotaryPercent / 100);
  const bankAppraisalFee = propertyValue > 0 ? 3100 : 0;
  const totalDocs = itbiValue + notaryValue + bankAppraisalFee;

  return {
    itbiValue,
    notaryValue,
    bankAppraisalFee,
    totalDocs,
    totalInitialCashNeeded: downPayment + totalDocs,
  };
}

/**
 * Core SAC / Tabela Price schedule calculator
 */
export function buildSchedule(params: {
  financedAmount: number;
  propertyValue: number;
  termMonths: number;
  annualRate: number;
  system: AmortizationSystem;
  buyerAge: number;
  adminFeeMonthly: number;
}): {
  schedule: InstallmentRow[];
  monthlyRate: number;
  totalInterest: number;
  totalInsuranceAndFees: number;
  totalPaid: number;
} {
  const {
    financedAmount,
    propertyValue,
    termMonths,
    annualRate,
    system,
    buyerAge,
    adminFeeMonthly,
  } = params;

  if (financedAmount <= 0 || termMonths <= 0) {
    return {
      schedule: [],
      monthlyRate: 0,
      totalInterest: 0,
      totalInsuranceAndFees: 0,
      totalPaid: 0,
    };
  }

  const monthlyRate = annualToMonthlyRate(annualRate);
  const mipRate = getMipMonthlyRate(buyerAge);
  const dfiFixed = propertyValue * DFI_MONTHLY_RATE;

  const schedule: InstallmentRow[] = [];
  let balance = financedAmount;
  let totalInterest = 0;
  let totalInsuranceAndFees = 0;
  let totalPaid = 0;

  const sacAmortization = financedAmount / termMonths;
  const priceBaseInstallment =
    monthlyRate === 0
      ? financedAmount / termMonths
      : (financedAmount * (monthlyRate * Math.pow(1 + monthlyRate, termMonths))) /
        (Math.pow(1 + monthlyRate, termMonths) - 1);

  for (let month = 1; month <= termMonths; month++) {
    const interest = balance * monthlyRate;
    let amortization = 0;
    let baseInstallment = 0;

    if (system === 'SAC') {
      amortization = month === termMonths ? balance : sacAmortization;
      baseInstallment = amortization + interest;
    } else {
      baseInstallment = priceBaseInstallment;
      amortization = month === termMonths ? balance : Math.max(0, baseInstallment - interest);
      if (month === termMonths) {
        baseInstallment = amortization + interest;
      }
    }

    const mipInsurance = balance * mipRate;
    const dfiInsurance = dfiFixed;
    const totalInstallment = baseInstallment + mipInsurance + dfiInsurance + adminFeeMonthly;

    balance = Math.max(0, balance - amortization);

    totalInterest += interest;
    totalInsuranceAndFees += mipInsurance + dfiInsurance + adminFeeMonthly;
    totalPaid += totalInstallment;

    schedule.push({
      month,
      year: Math.ceil(month / 12),
      baseInstallment,
      amortization,
      interest,
      mipInsurance,
      dfiInsurance,
      adminFee: adminFeeMonthly,
      totalInstallment,
      remainingBalance: balance,
    });
  }

  return {
    schedule,
    monthlyRate,
    totalInterest,
    totalInsuranceAndFees,
    totalPaid,
  };
}

export function calculateSimulation(input: SimulationInput, banks: BankConfig[] = BRAZILIAN_BANKS): SimulationResult {
  const selectedBank = banks.find((b) => b.id === input.selectedBankId);
  const adminFeeMonthly = selectedBank ? selectedBank.adminFeeMonthly : 25;

  const totalEquity = input.downPayment + input.fgtsAmount;
  const financedAmount = Math.max(0, input.propertyValue - totalEquity);
  const totalEquityPercent = input.propertyValue > 0 ? (totalEquity / input.propertyValue) * 100 : 0;
  const termMonths = Math.max(12, Math.round(input.termYears * 12));

  const {schedule, monthlyRate, totalInterest, totalInsuranceAndFees, totalPaid} = buildSchedule({
    financedAmount,
    propertyValue: input.propertyValue,
    termMonths,
    annualRate: input.annualRate,
    system: input.system,
    buyerAge: input.buyerAge,
    adminFeeMonthly,
  });

  const firstInstallment = schedule.length > 0 ? schedule[0].totalInstallment : 0;
  const lastInstallment = schedule.length > 0 ? schedule[schedule.length - 1].totalInstallment : 0;
  const averageInstallment = schedule.length > 0 ? totalPaid / schedule.length : 0;
  const firstMonthMip = schedule.length > 0 ? schedule[0].mipInsurance : 0;
  const firstMonthDfi = schedule.length > 0 ? schedule[0].dfiInsurance : 0;

  const recommendedMinIncome = firstInstallment > 0 ? firstInstallment / 0.3 : 0;
  const incomeCommitmentPercent =
    input.clientIncome > 0 ? (firstInstallment / input.clientIncome) * 100 : null;
  const isIncomeSufficient =
    input.clientIncome > 0 ? firstInstallment <= input.clientIncome * 0.3 : null;

  const minRequiredDown = input.propertyValue * 0.2;
  const isBelowMinDownPayment = totalEquity < minRequiredDown - 1;
  const minDownPaymentShortfall = Math.max(0, minRequiredDown - totalEquity);

  const documentation = calculateDocumentation(input);

  return {
    financedAmount,
    totalEquityPercent,
    monthlyEffectiveRate: monthlyRate * 100,
    firstInstallment,
    lastInstallment,
    averageInstallment,
    totalAmortized: financedAmount,
    totalInterest,
    totalInsuranceAndFees,
    totalPaid,
    firstMonthMip,
    firstMonthDfi,
    adminFeeMonthly,
    recommendedMinIncome,
    incomeCommitmentPercent,
    isBelowMinDownPayment,
    minDownPaymentShortfall,
    isIncomeSufficient,
    schedule,
    documentation,
  };
}

/**
 * Automatic comparison across Brazilian banks
 */
export function compareBanks(
  input: SimulationInput,
  banks: BankConfig[] = BRAZILIAN_BANKS
): BankComparisonItem[] {
  const totalEquity = input.downPayment + input.fgtsAmount;
  const financedAmount = Math.max(0, input.propertyValue - totalEquity);
  const termMonths = Math.max(12, Math.round(input.termYears * 12));
  const ltvPercent = input.propertyValue > 0 ? (financedAmount / input.propertyValue) * 100 : 0;

  const rawItems = banks.map((bank) => {
    let eligible = true;
    let ineligibleReason: string | undefined;

    if (bank.propertyCeiling && input.propertyValue > bank.propertyCeiling) {
      eligible = false;
      ineligibleReason = `Imóvel acima do teto (${formatBRLCompact(bank.propertyCeiling)})`;
    } else if (ltvPercent > bank.maxLtvPercent + 0.05) {
      eligible = false;
      ineligibleReason = `Financiamento acima de ${bank.maxLtvPercent}%`;
    } else if (input.termYears > bank.maxTermYears) {
      eligible = false;
      ineligibleReason = `Prazo máx. ${bank.maxTermYears} anos`;
    }

    const {schedule, totalInterest, totalPaid} = buildSchedule({
      financedAmount,
      propertyValue: input.propertyValue,
      termMonths,
      annualRate: bank.annualRate,
      system: input.system,
      buyerAge: input.buyerAge,
      adminFeeMonthly: bank.adminFeeMonthly,
    });

    const firstInstallment = schedule.length > 0 ? schedule[0].totalInstallment : 0;
    const lastInstallment = schedule.length > 0 ? schedule[schedule.length - 1].totalInstallment : 0;
    const recommendedMinIncome = firstInstallment / 0.3;

    // Approximate effective annual cost including insurance and admin fee
    const avgAnnualOverhead =
      financedAmount > 0
        ? (((schedule[0]?.mipInsurance ?? 0) + (schedule[0]?.dfiInsurance ?? 0) + bank.adminFeeMonthly) * 12) /
          financedAmount
        : 0;
    const cetApproxAnnual = bank.annualRate + avgAnnualOverhead * 100;

    return {
      bank,
      eligible,
      ineligibleReason,
      firstInstallment,
      lastInstallment,
      totalInterest,
      totalPaid,
      recommendedMinIncome,
      cetApproxAnnual,
      isLowestFirstInstallment: false,
      isLowestTotalCost: false,
    };
  });

  const eligibleItems = rawItems.filter((item) => item.eligible && item.firstInstallment > 0);
  if (eligibleItems.length > 0) {
    const minFirst = Math.min(...eligibleItems.map((i) => i.firstInstallment));
    const minTotal = Math.min(...eligibleItems.map((i) => i.totalPaid));
    rawItems.forEach((item) => {
      if (item.eligible && item.firstInstallment === minFirst) {
        item.isLowestFirstInstallment = true;
      }
      if (item.eligible && item.totalPaid === minTotal) {
        item.isLowestTotalCost = true;
      }
    });
  }

  return rawItems;
}

/**
 * Side-by-side 20 years vs 30 years comparison
 */
export function compareTerms20vs30(
  input: SimulationInput,
  banks: BankConfig[] = BRAZILIAN_BANKS
): TermComparison {
  const selectedBank = banks.find((b) => b.id === input.selectedBankId);
  const adminFeeMonthly = selectedBank ? selectedBank.adminFeeMonthly : 25;
  const financedAmount = Math.max(0, input.propertyValue - input.downPayment - input.fgtsAmount);

  const run20 = buildSchedule({
    financedAmount,
    propertyValue: input.propertyValue,
    termMonths: 240,
    annualRate: input.annualRate,
    system: input.system,
    buyerAge: input.buyerAge,
    adminFeeMonthly,
  });

  const run30 = buildSchedule({
    financedAmount,
    propertyValue: input.propertyValue,
    termMonths: 360,
    annualRate: input.annualRate,
    system: input.system,
    buyerAge: input.buyerAge,
    adminFeeMonthly,
  });

  const first20 = run20.schedule[0]?.totalInstallment ?? 0;
  const last20 = run20.schedule[run20.schedule.length - 1]?.totalInstallment ?? 0;
  const first30 = run30.schedule[0]?.totalInstallment ?? 0;
  const last30 = run30.schedule[run30.schedule.length - 1]?.totalInstallment ?? 0;

  return {
    term20: {
      years: 20,
      months: 240,
      firstInstallment: first20,
      lastInstallment: last20,
      totalInterest: run20.totalInterest,
      totalPaid: run20.totalPaid,
      recommendedMinIncome: first20 / 0.3,
    },
    term30: {
      years: 30,
      months: 360,
      firstInstallment: first30,
      lastInstallment: last30,
      totalInterest: run30.totalInterest,
      totalPaid: run30.totalPaid,
      recommendedMinIncome: first30 / 0.3,
    },
    interestSavings20vs30: Math.max(0, run30.totalInterest - run20.totalInterest),
    firstInstallmentDiff: first20 - first30,
  };
}

/**
 * WhatsApp proposal text generator
 */
export function buildWhatsAppProposalText(
  input: SimulationInput,
  result: SimulationResult,
  broker: BrokerProfile,
  bankName: string
): string {
  const lines = [
    `*PROPOSTA DE FINANCIAMENTO IMOBILIÁRIO*`,
    input.leadName ? `Cliente: ${input.leadName}` : null,
    input.propertyTitle ? `Imóvel: ${input.propertyTitle}` : null,
    ``,
    `*Resumo da Operação (${input.system})*`,
    `Banco referência: ${bankName}`,
    `Valor do Imóvel: ${formatBRL(input.propertyValue)}`,
    `Entrada + FGTS: ${formatBRL(input.downPayment + input.fgtsAmount)} (${formatPercent(result.totalEquityPercent, 1)})`,
    `Valor Financiado: ${formatBRL(result.financedAmount)}`,
    `Prazo: ${input.termYears} anos (${input.termYears * 12} meses)`,
    `Taxa de Juros: ${formatPercent(input.annualRate, 2)} a.a.`,
    ``,
    `*Parcelas e Renda*`,
    `1ª Parcela Estimada: ${formatBRL(result.firstInstallment)} (inclui MIP/DFI)`,
    `Última Parcela: ${formatBRL(result.lastInstallment)}`,
    `Renda Familiar Recomendada (30%): ${formatBRL(result.recommendedMinIncome)}`,
    ``,
    `*Estimativa de Documentação*`,
    `ITBI + Cartório + Avaliação: ${formatBRL(result.documentation.totalDocs)}`,
    `Desembolso Total Inicial (Entrada em espécie + Docs): ${formatBRL(result.documentation.totalInitialCashNeeded)}`,
    ``,
    `Simulação estimada sujeita à aprovação de crédito bancário.`,
    `${broker.name} — ${broker.creci}`,
    broker.agency ? `${broker.agency} · ${broker.phone}` : broker.phone,
  ];

  return lines.filter((line) => line !== null).join('\n');
}

export function getWhatsAppHref(phone: string | undefined, message: string): string {
  const digits = (phone || '').replace(/\D/g, '');
  const formattedPhone = digits.length >= 10 ? (digits.startsWith('55') ? digits : `55${digits}`) : '';
  const encoded = encodeURIComponent(message);
  return formattedPhone ? `https://wa.me/${formattedPhone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
}

/**
 * CSV Export Helpers
 */
export function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]): void {
  const escapeCell = (cell: string | number) => {
    const str = String(cell ?? '');
    if (str.includes(';') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const csvContent =
    '\uFEFF' +
    [headers.map(escapeCell).join(';'), ...rows.map((r) => r.map(escapeCell).join(';'))].join('\n');

  const blob = new Blob([csvContent], {type: 'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
