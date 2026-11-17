export type AmortizationSystem = 'SAC' | 'PRICE';

export type AppTab = 'simulator' | 'properties' | 'leads' | 'history';

export interface BankConfig {
  id: string;
  name: string;
  shortName: string;
  modality: string;
  annualRate: number; // % a.a.
  adminFeeMonthly: number; // R$/mês
  maxLtvPercent: number; // e.g., 80%
  maxTermYears: number;
  propertyCeiling?: number; // e.g., 500000 for MCMV
  notes: string;
}

export interface SimulationInput {
  propertyValue: number;
  downPayment: number;
  fgtsAmount: number;
  termYears: number;
  annualRate: number;
  system: AmortizationSystem;
  buyerAge: number;
  clientIncome: number;
  itbiPercent: number;
  notaryPercent: number;
  firstPropertyDiscount: boolean;
  selectedBankId: string;
  propertyId?: string;
  propertyTitle?: string;
  leadId?: string;
  leadName?: string;
  leadPhone?: string;
}

export interface InstallmentRow {
  month: number;
  year: number;
  baseInstallment: number;
  amortization: number;
  interest: number;
  mipInsurance: number;
  dfiInsurance: number;
  adminFee: number;
  totalInstallment: number;
  remainingBalance: number;
}

export interface DocumentationEstimate {
  itbiValue: number;
  notaryValue: number;
  bankAppraisalFee: number;
  totalDocs: number;
  totalInitialCashNeeded: number; // downPayment + totalDocs (FGTS abatido)
}

export interface SimulationResult {
  financedAmount: number;
  totalEquityPercent: number; // (downPayment + fgts) / propertyValue
  monthlyEffectiveRate: number;
  firstInstallment: number;
  lastInstallment: number;
  averageInstallment: number;
  totalAmortized: number;
  totalInterest: number;
  totalInsuranceAndFees: number;
  totalPaid: number;
  firstMonthMip: number;
  firstMonthDfi: number;
  adminFeeMonthly: number;
  recommendedMinIncome: number;
  incomeCommitmentPercent: number | null;
  isBelowMinDownPayment: boolean;
  minDownPaymentShortfall: number;
  isIncomeSufficient: boolean | null;
  schedule: InstallmentRow[];
  documentation: DocumentationEstimate;
}

export interface BankComparisonItem {
  bank: BankConfig;
  eligible: boolean;
  ineligibleReason?: string;
  firstInstallment: number;
  lastInstallment: number;
  totalInterest: number;
  totalPaid: number;
  recommendedMinIncome: number;
  cetApproxAnnual: number;
  isLowestFirstInstallment: boolean;
  isLowestTotalCost: boolean;
}

export interface TermComparison {
  term20: {
    years: number;
    months: number;
    firstInstallment: number;
    lastInstallment: number;
    totalInterest: number;
    totalPaid: number;
    recommendedMinIncome: number;
  };
  term30: {
    years: number;
    months: number;
    firstInstallment: number;
    lastInstallment: number;
    totalInterest: number;
    totalPaid: number;
    recommendedMinIncome: number;
  };
  interestSavings20vs30: number;
  firstInstallmentDiff: number;
}

export type PropertyType = 'Apartamento' | 'Casa' | 'Cobertura' | 'Terreno' | 'Comercial';
export type PropertyStatus = 'Disponível' | 'Reservado' | 'Vendido';

export interface PropertyItem {
  id: string;
  code: string;
  title: string;
  type: PropertyType;
  neighborhood: string;
  city: string;
  price: number;
  areaSqm: number;
  bedrooms: number;
  parkingSpots: number;
  status: PropertyStatus;
  notes: string;
  createdAt: string;
}

export type LeadStage = 'Novo' | 'Em Simulação' | 'Análise de Crédito' | 'Proposta Enviada' | 'Fechado';

export interface LeadItem {
  id: string;
  name: string;
  phone: string;
  email: string;
  monthlyIncome: number;
  availableDownPayment: number;
  availableFgts: number;
  age: number;
  interestProperty: string;
  stage: LeadStage;
  notes: string;
  createdAt: string;
}

export interface SavedSimulation {
  id: string;
  createdAt: string;
  bankName: string;
  input: SimulationInput;
  firstInstallment: number;
  lastInstallment: number;
  financedAmount: number;
  totalPaid: number;
  totalInterest: number;
  recommendedMinIncome: number;
  totalDocs: number;
}

export interface BrokerProfile {
  name: string;
  creci: string;
  agency: string;
  phone: string;
  email: string;
}
