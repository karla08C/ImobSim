import React, {useMemo, useState} from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
  ExternalLink,
  Landmark,
  Printer,
  UserCheck,
} from 'lucide-react';
import {BRAZILIAN_BANKS} from '../data/banks';
import {
  AmortizationSystem,
  BrokerProfile,
  LeadItem,
  PropertyItem,
  SimulationInput,
  SimulationResult,
} from '../types';
import {
  buildSchedule,
  buildWhatsAppProposalText,
  compareBanks,
  compareTerms20vs30,
  downloadCsv,
  formatBRL,
  formatBRLCompact,
  formatPercent,
  getWhatsAppHref,
} from '../utils/finance';
import {AmortizationChart} from './AmortizationChart';

interface SimulatorViewProps {
  input: SimulationInput;
  onChange: (next: SimulationInput) => void;
  result: SimulationResult;
  properties: PropertyItem[];
  leads: LeadItem[];
  broker: BrokerProfile;
  onSaveToHistory: () => void;
  onOpenProposal: () => void;
  justSaved: boolean;
}

export const SimulatorView: React.FC<SimulatorViewProps> = ({
  input,
  onChange,
  result,
  properties,
  leads,
  broker,
  onSaveToHistory,
  onOpenProposal,
  justSaved,
}) => {
  const [showAdvancedDocs, setShowAdvancedDocs] = useState(false);
  const [scheduleFilter, setScheduleFilter] = useState<'annual' | 'first12' | 'all'>('annual');
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);

  const bankComparisons = useMemo(() => compareBanks(input), [input]);
  const termComparison = useMemo(() => compareTerms20vs30(input), [input]);

  // Side-by-side SAC vs PRICE comparison for the current inputs
  const sacVsPrice = useMemo(() => {
    const selectedBank = BRAZILIAN_BANKS.find((b) => b.id === input.selectedBankId);
    const adminFeeMonthly = selectedBank ? selectedBank.adminFeeMonthly : 25;
    const financedAmount = Math.max(0, input.propertyValue - input.downPayment - input.fgtsAmount);
    const termMonths = Math.max(12, Math.round(input.termYears * 12));

    const sac = buildSchedule({
      financedAmount,
      propertyValue: input.propertyValue,
      termMonths,
      annualRate: input.annualRate,
      system: 'SAC',
      buyerAge: input.buyerAge,
      adminFeeMonthly,
    });
    const price = buildSchedule({
      financedAmount,
      propertyValue: input.propertyValue,
      termMonths,
      annualRate: input.annualRate,
      system: 'PRICE',
      buyerAge: input.buyerAge,
      adminFeeMonthly,
    });

    return {
      sacFirst: sac.schedule[0]?.totalInstallment ?? 0,
      sacLast: sac.schedule[sac.schedule.length - 1]?.totalInstallment ?? 0,
      sacInterest: sac.totalInterest,
      sacTotal: sac.totalPaid,
      priceFirst: price.schedule[0]?.totalInstallment ?? 0,
      priceLast: price.schedule[price.schedule.length - 1]?.totalInstallment ?? 0,
      priceInterest: price.totalInterest,
      priceTotal: price.totalPaid,
    };
  }, [input]);

  const downPaymentPercent =
    input.propertyValue > 0 ? (input.downPayment / input.propertyValue) * 100 : 0;

  const selectedBank = BRAZILIAN_BANKS.find((b) => b.id === input.selectedBankId);
  const bankName = selectedBank
    ? `${selectedBank.shortName} (${selectedBank.modality})`
    : 'Taxa Personalizada';

  const whatsappText = useMemo(
    () => buildWhatsAppProposalText(input, result, broker, bankName),
    [input, result, broker, bankName]
  );
  const whatsappUrl = getWhatsAppHref(input.leadPhone, whatsappText);

  const handleCopyWhatsApp = async () => {
    try {
      await navigator.clipboard.writeText(whatsappText);
      setCopiedWhatsApp(true);
      setTimeout(() => setCopiedWhatsApp(false), 2000);
    } catch {
      // Ignore clipboard failures
    }
  };

  const handlePropertySelect = (propertyId: string) => {
    if (!propertyId) {
      onChange({...input, propertyId: undefined, propertyTitle: undefined});
      return;
    }
    const prop = properties.find((p) => p.id === propertyId);
    if (!prop) return;
    const targetDown = Math.round(prop.price * 0.2);
    onChange({
      ...input,
      propertyId: prop.id,
      propertyTitle: `${prop.title} (${prop.neighborhood})`,
      propertyValue: prop.price,
      downPayment: targetDown,
    });
  };

  const handleLeadSelect = (leadId: string) => {
    if (!leadId) {
      onChange({...input, leadId: undefined, leadName: undefined, leadPhone: undefined});
      return;
    }
    const lead = leads.find((l) => l.id === leadId);
    if (!lead) return;
    onChange({
      ...input,
      leadId: lead.id,
      leadName: lead.name,
      leadPhone: lead.phone,
      clientIncome: lead.monthlyIncome,
      downPayment: lead.availableDownPayment,
      fgtsAmount: lead.availableFgts,
      buyerAge: lead.age,
    });
  };

  const handleSelectBank = (bankId: string) => {
    const bank = BRAZILIAN_BANKS.find((b) => b.id === bankId);
    if (!bank) return;
    onChange({
      ...input,
      selectedBankId: bank.id,
      annualRate: bank.annualRate,
    });
  };

  const handleSetDownPercent = (pct: number) => {
    const targetTotalEquity = Math.round((input.propertyValue * pct) / 100);
    const nextCashDown = Math.max(0, targetTotalEquity - input.fgtsAmount);
    onChange({...input, downPayment: nextCashDown});
  };

  const displayedSchedule = useMemo(() => {
    if (scheduleFilter === 'first12') {
      return result.schedule.slice(0, 12);
    }
    if (scheduleFilter === 'annual') {
      return result.schedule.filter(
        (r) => r.month === 1 || r.month % 12 === 0 || r.month === result.schedule.length
      );
    }
    return result.schedule;
  }, [result.schedule, scheduleFilter]);

  const handleDownloadScheduleCsv = () => {
    const headers = [
      'Parcela',
      'Ano',
      'Sistema',
      'Amortizacao',
      'Juros',
      'Seguro MIP',
      'Seguro DFI',
      'Taxa Adm',
      'Parcela Total',
      'Saldo Devedor',
    ];
    const rows = result.schedule.map((row) => [
      row.month,
      row.year,
      input.system,
      row.amortization.toFixed(2).replace('.', ','),
      row.interest.toFixed(2).replace('.', ','),
      row.mipInsurance.toFixed(2).replace('.', ','),
      row.dfiInsurance.toFixed(2).replace('.', ','),
      row.adminFee.toFixed(2).replace('.', ','),
      row.totalInstallment.toFixed(2).replace('.', ','),
      row.remainingBalance.toFixed(2).replace('.', ','),
    ]);
    downloadCsv(`cronograma-${input.system.toLowerCase()}-${input.termYears}anos.csv`, headers, rows);
  };

  return (
    <div className="space-y-6">
      {/* HERO EMERALD SUMMARY BANNER (matching reference model) */}
      <section className="rounded-2xl bg-gradient-to-r from-[#0A8F5E] to-[#077B50] p-5 text-white shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-wide text-emerald-100">
              1ª PARCELA ({input.system})
            </p>
            <p className="mt-1 text-3xl font-extrabold tracking-tight tabular-nums sm:text-4xl">
              {formatBRL(result.firstInstallment)}
            </p>
            <p className="mt-1 text-xs font-medium tabular-nums text-emerald-100">
              Última: {formatBRL(result.lastInstallment)} · Renda mín. recomendada:{' '}
              {formatBRL(result.recommendedMinIncome)}
            </p>
          </div>

          <div className="text-left sm:text-right">
            <p className="text-xs font-medium text-emerald-100">Valor Financiado</p>
            <p className="mt-0.5 text-xl font-bold tabular-nums sm:text-2xl">
              {formatBRL(result.financedAmount)}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2 sm:justify-end">
              {result.incomeCommitmentPercent !== null ? (
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold tabular-nums ${
                    result.isIncomeSufficient
                      ? 'bg-[#0B1622]/75 text-emerald-100'
                      : 'bg-[#EF4444] text-white'
                  }`}
                >
                  {!result.isIncomeSufficient && <AlertTriangle className="h-3.5 w-3.5" />}
                  Renda: {Math.round(result.incomeCommitmentPercent)}%
                </span>
              ) : (
                <span className="text-xs text-emerald-100">
                  Entrada + FGTS: {formatPercent(result.totalEquityPercent, 1)}
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ALERTS: 20% Minimum Down Payment & 30% Income Rule */}
      {(result.isBelowMinDownPayment || result.isIncomeSufficient === false) && (
        <div className="space-y-3">
          {result.isBelowMinDownPayment && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                <div>
                  <p className="font-bold">Entrada abaixo do mínimo recomendado de 20%</p>
                  <p className="mt-0.5 text-xs text-amber-900">
                    Faltam{' '}
                    <strong className="tabular-nums">
                      {formatBRL(result.minDownPaymentShortfall)}
                    </strong>{' '}
                    para atingir 20% ({formatBRL(input.propertyValue * 0.2)}).
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleSetDownPercent(20)}
                className="min-h-[38px] rounded-xl border border-amber-400 bg-white px-3.5 py-1.5 text-xs font-bold text-amber-950 whitespace-nowrap hover:bg-amber-100"
              >
                Ajustar para 20%
              </button>
            </div>
          )}

          {result.isIncomeSufficient === false && result.incomeCommitmentPercent !== null && (
            <div className="flex items-start gap-2.5 rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-950">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#EF4444]" />
              <div>
                <p className="font-bold">
                  Comprometimento de {formatPercent(result.incomeCommitmentPercent, 1)} excede o teto de 30%
                </p>
                <p className="mt-0.5 text-xs text-red-900">
                  Para aprovar com renda de {formatBRL(input.clientIncome)}, considere aumentar a entrada, usar FGTS ou simular na Tabela Price / 35 anos.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2-COLUMN WORKSPACE (Inputs left, Actions & Comparison right) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.12fr_0.88fr] lg:items-start">
        {/* LEFT COLUMN */}
        <div className="space-y-4">
          {/* SAC vs PRICE Segmented Toggle */}
          <div className="grid grid-cols-2 gap-1.5 rounded-2xl border border-slate-200 bg-white p-1.5">
            {(['SAC', 'PRICE'] as AmortizationSystem[]).map((sys) => (
              <button
                key={sys}
                type="button"
                onClick={() => onChange({...input, system: sys})}
                className={`min-h-[44px] rounded-xl px-4 py-2 text-sm font-bold whitespace-nowrap transition-colors ${
                  input.system === sys
                    ? 'bg-[#0B1622] text-white'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-[#0B1622]'
                }`}
              >
                {sys === 'SAC' ? 'SAC (Decrescente)' : 'PRICE (Fixa)'}
              </button>
            ))}
          </div>

          {/* Main Input Card */}
          <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5">
            {/* CRM Context Links */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                  <Building2 className="h-3.5 w-3.5 text-slate-400" />
                  Imóvel da Carteira
                </label>
                <select
                  value={input.propertyId || ''}
                  onChange={(e) => handlePropertySelect(e.target.value)}
                  className="min-h-[42px] w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 text-xs font-medium text-[#0B1622] focus:border-[#089166] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#089166]/20"
                >
                  <option value="">Valor manual</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code} · {p.title} ({formatBRLCompact(p.price)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                  <UserCheck className="h-3.5 w-3.5 text-slate-400" />
                  Lead / Cliente
                </label>
                <select
                  value={input.leadId || ''}
                  onChange={(e) => handleLeadSelect(e.target.value)}
                  className="min-h-[42px] w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 text-xs font-medium text-[#0B1622] focus:border-[#089166] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#089166]/20"
                >
                  <option value="">Simulação avulsa</option>
                  {leads.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} ({formatBRLCompact(l.monthlyIncome)})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Property Value */}
            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="prop-value" className="text-xs font-bold tracking-wide text-slate-600">
                  VALOR DO IMÓVEL
                </label>
                <span className="text-base font-extrabold tabular-nums text-[#089166]">
                  {formatBRL(input.propertyValue)}
                </span>
              </div>
              <input
                id="prop-value"
                type="number"
                min={50000}
                max={10000000}
                step={5000}
                value={input.propertyValue || ''}
                onChange={(e) =>
                  onChange({...input, propertyValue: Math.max(0, Number(e.target.value))})
                }
                className="mt-2 min-h-[44px] w-full rounded-xl border border-slate-200 px-3.5 text-sm font-bold tabular-nums text-[#0B1622] focus:border-[#089166] focus:outline-none focus:ring-2 focus:ring-[#089166]/20"
              />
              <input
                type="range"
                min={150000}
                max={2500000}
                step={10000}
                aria-label="Controle deslizante de valor do imóvel"
                value={Math.min(2500000, Math.max(150000, input.propertyValue))}
                onChange={(e) => onChange({...input, propertyValue: Number(e.target.value)})}
                className="mt-3 w-full"
              />
            </div>

            {/* Down Payment */}
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label htmlFor="down-payment" className="text-xs font-bold tracking-wide text-slate-600">
                  ENTRADA ({formatPercent(downPaymentPercent, 0)})
                </label>
                <div className="flex items-center gap-1.5">
                  {[10, 20, 30].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => handleSetDownPercent(pct)}
                      className={`min-h-[32px] rounded-lg px-2.5 text-xs font-bold tabular-nums transition-colors ${
                        Math.abs(downPaymentPercent - pct) < 1
                          ? 'bg-[#0B1622] text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>
              <input
                id="down-payment"
                type="number"
                min={0}
                max={input.propertyValue}
                step={1000}
                value={input.downPayment}
                onChange={(e) =>
                  onChange({
                    ...input,
                    downPayment: Math.max(0, Math.min(input.propertyValue, Number(e.target.value))),
                  })
                }
                className="mt-2 min-h-[44px] w-full rounded-xl border border-slate-200 px-3.5 text-sm font-bold tabular-nums text-[#0B1622] focus:border-[#089166] focus:outline-none focus:ring-2 focus:ring-[#089166]/20"
              />
            </div>

            {/* FGTS + Income */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="fgts-amount" className="mb-1.5 block text-xs font-semibold text-slate-600">
                  FGTS (R$)
                </label>
                <input
                  id="fgts-amount"
                  type="number"
                  min={0}
                  max={input.propertyValue}
                  step={1000}
                  value={input.fgtsAmount}
                  onChange={(e) =>
                    onChange({...input, fgtsAmount: Math.max(0, Number(e.target.value))})
                  }
                  className="min-h-[44px] w-full rounded-xl border border-slate-200 px-3.5 text-sm font-bold tabular-nums text-[#0B1622] focus:border-[#089166] focus:outline-none focus:ring-2 focus:ring-[#089166]/20"
                />
              </div>

              <div>
                <label htmlFor="client-income" className="mb-1.5 block text-xs font-semibold text-slate-600">
                  Renda Familiar (R$)
                </label>
                <input
                  id="client-income"
                  type="number"
                  min={0}
                  step={500}
                  placeholder="Ex.: 12000"
                  value={input.clientIncome || ''}
                  onChange={(e) =>
                    onChange({...input, clientIncome: Math.max(0, Number(e.target.value))})
                  }
                  className="min-h-[44px] w-full rounded-xl border border-slate-200 px-3.5 text-sm font-bold tabular-nums text-[#0B1622] placeholder:font-normal placeholder:text-slate-400 focus:border-[#089166] focus:outline-none focus:ring-2 focus:ring-[#089166]/20"
                />
              </div>
            </div>

            {/* Term Years + Interest Rate */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label htmlFor="term-years" className="text-xs font-semibold text-slate-600">
                    Prazo (anos)
                  </label>
                  <span className="text-xs font-bold tabular-nums text-slate-500">
                    {input.termYears * 12} meses
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {[15, 20, 25, 30, 35].map((yr) => (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => onChange({...input, termYears: yr})}
                      className={`min-h-[40px] flex-1 rounded-xl border text-xs font-bold tabular-nums transition-colors ${
                        input.termYears === yr
                          ? 'border-[#0B1622] bg-[#0B1622] text-white'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {yr}a
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label htmlFor="annual-rate" className="text-xs font-semibold text-slate-600">
                    Taxa de Juros (% a.a.)
                  </label>
                  <span className="text-xs font-medium tabular-nums text-slate-500">
                    {formatPercent(result.monthlyEffectiveRate, 2)} a.m.
                  </span>
                </div>
                <input
                  id="annual-rate"
                  type="number"
                  min={1}
                  max={25}
                  step={0.05}
                  value={input.annualRate}
                  onChange={(e) =>
                    onChange({...input, annualRate: Math.max(0, Number(e.target.value))})
                  }
                  className="min-h-[42px] w-full rounded-xl border border-slate-200 px-3.5 text-sm font-bold tabular-nums text-[#0B1622] focus:border-[#089166] focus:outline-none focus:ring-2 focus:ring-[#089166]/20"
                />
              </div>
            </div>

            {/* Collapsible Age & Documentation Settings */}
            <div className="border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setShowAdvancedDocs((prev) => !prev)}
                className="flex min-h-[38px] w-full items-center justify-between text-left text-xs font-semibold text-slate-600 hover:text-[#0B1622]"
              >
                <span>Idade (MIP) e Alíquotas de Documentação (ITBI / Cartório)</span>
                {showAdvancedDocs ? (
                  <ChevronUp className="h-4 w-4 text-slate-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                )}
              </button>

              {showAdvancedDocs && (
                <div className="mt-3 space-y-3 border-t border-slate-100 pt-3">
                  <div className="grid grid-cols-3 gap-2.5">
                    <div>
                      <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                        Idade (anos)
                      </label>
                      <input
                        type="number"
                        min={18}
                        max={80}
                        value={input.buyerAge}
                        onChange={(e) =>
                          onChange({
                            ...input,
                            buyerAge: Math.min(80, Math.max(18, Number(e.target.value))),
                          })
                        }
                        className="min-h-[40px] w-full rounded-xl border border-slate-200 px-3 text-xs font-bold tabular-nums"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                        ITBI (%)
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={6}
                        step={0.1}
                        value={input.itbiPercent}
                        onChange={(e) =>
                          onChange({...input, itbiPercent: Math.max(0, Number(e.target.value))})
                        }
                        className="min-h-[40px] w-full rounded-xl border border-slate-200 px-3 text-xs font-bold tabular-nums"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                        Cartório (%)
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={5}
                        step={0.1}
                        value={input.notaryPercent}
                        onChange={(e) =>
                          onChange({...input, notaryPercent: Math.max(0, Number(e.target.value))})
                        }
                        className="min-h-[40px] w-full rounded-xl border border-slate-200 px-3 text-xs font-bold tabular-nums"
                      />
                    </div>
                  </div>
                  <label className="flex min-h-[38px] cursor-pointer items-center gap-2 text-xs text-slate-700">
                    <input
                      type="checkbox"
                      checked={input.firstPropertyDiscount}
                      onChange={(e) => onChange({...input, firstPropertyDiscount: e.target.checked})}
                      className="h-4 w-4 rounded border-slate-300 text-[#089166] focus:ring-[#089166]"
                    />
                    <span>Desconto de 50% no registro em cartório (1º imóvel SFH)</span>
                  </label>
                </div>
              )}
            </div>
          </section>

          {/* Bank Reference Pills Strip (matching reference model) */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-bold tracking-wide text-slate-600">
              BANCO / TAXA REFERÊNCIA
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {BRAZILIAN_BANKS.map((bank) => {
                const isSelected = input.selectedBankId === bank.id;
                return (
                  <button
                    key={bank.id}
                    type="button"
                    onClick={() => handleSelectBank(bank.id)}
                    className={`min-h-[40px] rounded-full border px-3.5 py-2 text-xs font-bold whitespace-nowrap transition-colors ${
                      isSelected
                        ? 'border-[#089166] bg-[#089166] text-white'
                        : 'border-slate-200 bg-white text-[#0B1622] hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {bank.shortName} ({formatPercent(bank.annualRate, 2)})
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-4">
          {/* Primary Action Stack (matching reference model) */}
          <div className="space-y-2.5">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[#089166] px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-[#077B50]"
            >
              <ExternalLink className="h-4 w-4" />
              Enviar Proposta no WhatsApp
            </a>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={onSaveToHistory}
                className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#0B1622] px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#16273B]"
              >
                {justSaved ? (
                  <>
                    <Check className="h-4 w-4 text-[#10B981]" />
                    Salvo!
                  </>
                ) : (
                  'Salvar Simulação'
                )}
              </button>

              <button
                type="button"
                onClick={handleCopyWhatsApp}
                className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-[#0B1622] transition-colors hover:bg-slate-50"
              >
                {copiedWhatsApp ? (
                  <>
                    <Check className="h-4 w-4 text-[#089166]" />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 text-slate-500" />
                    Copiar Texto
                  </>
                )}
              </button>
            </div>

            <button
              type="button"
              onClick={onOpenProposal}
              className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-[#0B1622] transition-colors hover:bg-slate-50"
            >
              <Printer className="h-4 w-4 text-slate-500" />
              Imprimir / Gerar PDF
            </button>
          </div>

          {/* Documentation & Initial Cash Card (matching reference model) */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-slate-500">Docs Est. (ITBI + Cartório)</p>
                <p className="mt-1 text-lg font-extrabold tabular-nums text-[#0B1622]">
                  {formatBRL(result.documentation.totalDocs)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-medium text-slate-500">Reserva Inicial Total</p>
                <p className="mt-1 text-lg font-extrabold tabular-nums text-[#089166]">
                  {formatBRL(result.documentation.totalInitialCashNeeded)}
                </p>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
              <span>Seguros na 1ª parcela (MIP + DFI + Adm)</span>
              <span className="font-bold tabular-nums text-[#0B1622]">
                {formatBRL(result.firstMonthMip + result.firstMonthDfi + result.adminFeeMonthly)}/mês
              </span>
            </div>
          </section>

          {/* COMPARATIVO SAC X PRICE (matching reference model) */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="text-xs font-bold tracking-wide text-slate-600">
              COMPARATIVO SAC X PRICE
            </h3>

            <table className="mt-3 w-full border-collapse text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs text-slate-400">
                  <th className="py-2 font-semibold">Indicador</th>
                  <th className="py-2 font-semibold">SAC</th>
                  <th className="py-2 text-right font-semibold">PRICE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 tabular-nums">
                <tr>
                  <td className="py-2.5 text-slate-600">1ª Parcela</td>
                  <td className="py-2.5 font-bold text-[#0B1622]">
                    {formatBRL(sacVsPrice.sacFirst)}
                  </td>
                  <td className="py-2.5 text-right font-bold text-[#0B1622]">
                    {formatBRL(sacVsPrice.priceFirst)}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 text-slate-600">Última Parcela</td>
                  <td className="py-2.5 font-bold text-[#089166]">
                    {formatBRL(sacVsPrice.sacLast)}
                  </td>
                  <td className="py-2.5 text-right font-semibold text-slate-700">
                    {formatBRL(sacVsPrice.priceLast)}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 text-slate-600">Total Juros</td>
                  <td className="py-2.5 font-semibold text-slate-700">
                    {formatBRL(sacVsPrice.sacInterest)}
                  </td>
                  <td className="py-2.5 text-right font-semibold text-slate-700">
                    {formatBRL(sacVsPrice.priceInterest)}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 text-slate-600">Total Geral</td>
                  <td className="py-2.5 font-bold text-[#0B1622]">
                    {formatBRL(sacVsPrice.sacTotal)}
                  </td>
                  <td className="py-2.5 text-right font-bold text-[#0B1622]">
                    {formatBRL(sacVsPrice.priceTotal)}
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* 20 vs 30 Years Comparison Card */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold tracking-wide text-slate-600">
                COMPARATIVO DE PRAZO: 20 ANOS VS 30 ANOS
              </h3>
              <span className="text-xs font-bold text-[#089166]">
                Economia {formatBRLCompact(termComparison.interestSavings20vs30)}
              </span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-4 border-t border-slate-100 pt-3">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">20 Anos (240x)</span>
                  <button
                    type="button"
                    onClick={() => onChange({...input, termYears: 20})}
                    className="text-xs font-bold text-[#089166] hover:underline"
                  >
                    Aplicar
                  </button>
                </div>
                <p className="mt-1 text-base font-extrabold tabular-nums text-[#0B1622]">
                  {formatBRL(termComparison.term20.firstInstallment)}
                </p>
                <p className="text-[11px] tabular-nums text-slate-500">
                  Juros: {formatBRLCompact(termComparison.term20.totalInterest)}
                </p>
              </div>

              <div className="border-l border-slate-100 pl-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">30 Anos (360x)</span>
                  <button
                    type="button"
                    onClick={() => onChange({...input, termYears: 30})}
                    className="text-xs font-bold text-[#089166] hover:underline"
                  >
                    Aplicar
                  </button>
                </div>
                <p className="mt-1 text-base font-extrabold tabular-nums text-[#0B1622]">
                  {formatBRL(termComparison.term30.firstInstallment)}
                </p>
                <p className="text-[11px] tabular-nums text-slate-500">
                  Juros: {formatBRLCompact(termComparison.term30.totalInterest)}
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* AUTOMATIC BANK COMPARATOR */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <Landmark className="h-4 w-4 text-[#089166]" />
            <div>
              <h3 className="text-sm font-bold text-[#0B1622]">
                Comparador Automático entre Bancos ({input.system})
              </h3>
              <p className="text-xs text-slate-500">
                Todas as linhas calculadas para {input.termYears} anos e entrada de{' '}
                {formatPercent(result.totalEquityPercent, 1)}
              </p>
            </div>
          </div>
          {result.isIncomeSufficient === true && result.incomeCommitmentPercent !== null && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#089166]">
              <CheckCircle2 className="h-4 w-4" />
              Enquadramento de renda compatível ({formatPercent(result.incomeCommitmentPercent, 1)})
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-[#F8FAFC] text-xs text-slate-500">
                <th className="px-5 py-3 font-semibold">Instituição / Linha</th>
                <th className="px-3 py-3 text-right font-semibold">Taxa a.a.</th>
                <th className="px-3 py-3 text-right font-semibold">1ª Parcela</th>
                <th className="px-3 py-3 text-right font-semibold">Última Parcela</th>
                <th className="px-3 py-3 text-right font-semibold">Total Pago</th>
                <th className="px-3 py-3 text-right font-semibold">Renda Mín.</th>
                <th className="px-5 py-3 text-right font-semibold">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 tabular-nums">
              {bankComparisons.map((item) => {
                const isSelected = input.selectedBankId === item.bank.id;
                return (
                  <tr
                    key={item.bank.id}
                    className={`transition-colors ${
                      isSelected ? 'bg-emerald-50/50' : 'hover:bg-slate-50/80'
                    }`}
                  >
                    <td className="px-5 py-3">
                      <div className="font-bold text-[#0B1622]">{item.bank.shortName}</div>
                      <div className="text-xs text-slate-500">
                        {item.bank.modality}
                        {item.isLowestFirstInstallment && item.eligible && (
                          <>
                            {' '}
                            <span aria-hidden="true">·</span>{' '}
                            <span className="font-bold text-[#089166]">Menor parcela</span>
                          </>
                        )}
                        {!item.eligible && item.ineligibleReason && (
                          <>
                            {' '}
                            <span aria-hidden="true">·</span>{' '}
                            <span className="font-semibold text-amber-700">
                              {item.ineligibleReason}
                            </span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right text-xs font-semibold text-slate-700">
                      {formatPercent(item.bank.annualRate, 2)}
                    </td>
                    <td className="px-3 py-3 text-right font-bold text-[#0B1622]">
                      {item.eligible ? formatBRL(item.firstInstallment) : '—'}
                    </td>
                    <td className="px-3 py-3 text-right text-xs text-slate-600">
                      {item.eligible ? formatBRL(item.lastInstallment) : '—'}
                    </td>
                    <td className="px-3 py-3 text-right text-xs text-slate-700">
                      {item.eligible ? formatBRL(item.totalPaid) : '—'}
                    </td>
                    <td className="px-3 py-3 text-right text-xs text-slate-700">
                      {item.eligible ? formatBRL(item.recommendedMinIncome) : '—'}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        type="button"
                        disabled={!item.eligible}
                        onClick={() => handleSelectBank(item.bank.id)}
                        className={`min-h-[36px] rounded-lg px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-colors ${
                          !item.eligible
                            ? 'cursor-not-allowed text-slate-300'
                            : isSelected
                              ? 'bg-[#089166] text-white'
                              : 'border border-slate-200 bg-white text-[#0B1622] hover:bg-slate-50'
                        }`}
                      >
                        {isSelected ? 'Selecionado' : 'Aplicar'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* CHART & INSTALLMENT SCHEDULE */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <AmortizationChart input={input} />
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
            <div>
              <h3 className="text-sm font-bold text-[#0B1622]">
                TABELA DE PARCELAS ({input.system})
              </h3>
              <p className="text-xs text-slate-500">
                Amortização, juros, MIP/DFI e saldo devedor
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-1 rounded-xl bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => setScheduleFilter('annual')}
                  className={`min-h-[32px] rounded-lg px-2.5 py-1 text-xs font-semibold whitespace-nowrap transition-colors ${
                    scheduleFilter === 'annual'
                      ? 'bg-[#0B1622] text-white'
                      : 'text-slate-600 hover:text-[#0B1622]'
                  }`}
                >
                  Anual
                </button>
                <button
                  type="button"
                  onClick={() => setScheduleFilter('first12')}
                  className={`min-h-[32px] rounded-lg px-2.5 py-1 text-xs font-semibold whitespace-nowrap transition-colors ${
                    scheduleFilter === 'first12'
                      ? 'bg-[#0B1622] text-white'
                      : 'text-slate-600 hover:text-[#0B1622]'
                  }`}
                >
                  1º Ano
                </button>
                <button
                  type="button"
                  onClick={() => setScheduleFilter('all')}
                  className={`min-h-[32px] rounded-lg px-2.5 py-1 text-xs font-semibold whitespace-nowrap transition-colors ${
                    scheduleFilter === 'all'
                      ? 'bg-[#0B1622] text-white'
                      : 'text-slate-600 hover:text-[#0B1622]'
                  }`}
                >
                  Todas
                </button>
              </div>

              <button
                type="button"
                onClick={handleDownloadScheduleCsv}
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-extrabold text-[#089166] whitespace-nowrap hover:bg-emerald-50"
              >
                <Download className="h-3.5 w-3.5" />
                BAIXAR CSV
              </button>
            </div>
          </div>

          <div className="max-h-[320px] overflow-auto">
            <table className="w-full min-w-[540px] border-collapse text-left text-xs">
              <thead className="sticky top-0 bg-[#F8FAFC] text-slate-500">
                <tr className="border-b border-slate-200">
                  <th className="px-4 py-2.5 font-semibold">Parcela</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Amortização</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Juros</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Parcela Total</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Saldo Devedor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 tabular-nums">
                {displayedSchedule.map((row) => (
                  <tr key={row.month} className="hover:bg-slate-50/80">
                    <td className="px-4 py-2.5 font-semibold text-[#0B1622]">
                      #{row.month}{' '}
                      <span className="font-normal text-slate-400">· Ano {row.year}</span>
                    </td>
                    <td className="px-3 py-2.5 text-right text-slate-700">
                      {formatBRL(row.amortization)}
                    </td>
                    <td className="px-3 py-2.5 text-right text-slate-700">
                      {formatBRL(row.interest)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-bold text-[#089166]">
                      {formatBRL(row.totalInstallment)}
                    </td>
                    <td className="px-4 py-2.5 text-right text-slate-700">
                      {formatBRL(row.remainingBalance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};
