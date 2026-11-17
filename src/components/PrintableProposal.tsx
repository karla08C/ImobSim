import React from 'react';
import {BRAZILIAN_BANKS} from '../data/banks';
import {
  BrokerProfile,
  SimulationInput,
  SimulationResult,
} from '../types';
import {
  compareBanks,
  compareTerms20vs30,
  formatBRL,
  formatPercent,
} from '../utils/finance';

interface PrintableProposalProps {
  input: SimulationInput;
  result: SimulationResult;
  broker: BrokerProfile;
  isPreview?: boolean;
}

export const PrintableProposal: React.FC<PrintableProposalProps> = ({
  input,
  result,
  broker,
  isPreview = false,
}) => {
  const bank = BRAZILIAN_BANKS.find((b) => b.id === input.selectedBankId);
  const bankComparisons = compareBanks(input).filter((b) => b.eligible).slice(0, 5);
  const termComparison = compareTerms20vs30(input);
  const today = new Intl.DateTimeFormat('pt-BR', {dateStyle: 'long'}).format(new Date());

  const milestoneMonths = [1, 12, 60, 120, 180, 240, 300, 360, 420]
    .filter((m) => m <= result.schedule.length)
    .map((m) => result.schedule[m - 1])
    .filter(Boolean);
  const lastRow = result.schedule[result.schedule.length - 1];
  if (lastRow && !milestoneMonths.some((r) => r.month === lastRow.month)) {
    milestoneMonths.push(lastRow);
  }

  return (
    <div
      className={`bg-white text-slate-900 ${
        isPreview ? 'rounded-lg border border-slate-200 p-6 sm:p-8' : 'hidden print-only'
      }`}
    >
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <p className="text-xs font-bold text-[#089166]">Proposta de Financiamento Habitacional</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[#0B1622]">
            {broker.agency || 'ImobSim Pro'}
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Emitido em {today} · Sistema {input.system}
          </p>
        </div>
        <div className="text-right text-xs text-slate-600">
          <p className="font-bold text-[#0B1622]">{broker.name}</p>
          <p>{broker.creci}</p>
          <p>{broker.phone}</p>
          <p>{broker.email}</p>
        </div>
      </div>

      {/* Client & Property Context */}
      {(input.leadName || input.propertyTitle) && (
        <div className="mt-5 grid grid-cols-1 gap-4 border-b border-slate-200 pb-5 sm:grid-cols-2">
          <div>
            <p className="text-xs text-slate-500">Cliente / Proponente</p>
            <p className="mt-0.5 text-sm font-bold text-[#0B1622]">
              {input.leadName || 'Simulação Personalizada'}
            </p>
            {input.clientIncome > 0 && (
              <p className="mt-0.5 text-xs tabular-nums text-slate-600">
                Renda informada: {formatBRL(input.clientIncome)}
              </p>
            )}
          </div>
          <div>
            <p className="text-xs text-slate-500">Imóvel de Referência</p>
            <p className="mt-0.5 text-sm font-bold text-[#0B1622]">
              {input.propertyTitle || 'Imóvel Residencial'}
            </p>
            <p className="mt-0.5 text-xs text-slate-600">
              Banco base: {bank ? `${bank.shortName} (${bank.modality})` : 'Taxa Personalizada'}
            </p>
          </div>
        </div>
      )}

      {/* Primary KPIs */}
      <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="border-b border-slate-100 pb-3">
          <p className="text-xs text-slate-500">Valor do Imóvel</p>
          <p className="mt-1 text-base font-extrabold tabular-nums text-[#0B1622]">
            {formatBRL(input.propertyValue)}
          </p>
        </div>
        <div className="border-b border-slate-100 pb-3">
          <p className="text-xs text-slate-500">Entrada + FGTS</p>
          <p className="mt-1 text-base font-extrabold tabular-nums text-[#0B1622]">
            {formatBRL(input.downPayment + input.fgtsAmount)}
          </p>
          <p className="text-[11px] tabular-nums text-slate-500">
            {formatPercent(result.totalEquityPercent, 1)} do imóvel
          </p>
        </div>
        <div className="border-b border-slate-100 pb-3">
          <p className="text-xs text-slate-500">Valor Financiado</p>
          <p className="mt-1 text-base font-extrabold tabular-nums text-[#0B1622]">
            {formatBRL(result.financedAmount)}
          </p>
          <p className="text-[11px] tabular-nums text-slate-500">
            {input.termYears} anos ({input.termYears * 12}x)
          </p>
        </div>
        <div className="border-b border-slate-100 pb-3">
          <p className="text-xs text-slate-500">1ª Parcela Estimada</p>
          <p className="mt-1 text-base font-extrabold tabular-nums text-[#089166]">
            {formatBRL(result.firstInstallment)}
          </p>
          <p className="text-[11px] tabular-nums text-slate-500">
            Última: {formatBRL(result.lastInstallment)}
          </p>
        </div>
      </div>

      {/* Income & Documentation Summary */}
      <div className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-200 p-4">
          <h2 className="text-sm font-semibold text-slate-900">
            Análise de Capacidade e Taxas
          </h2>
          <dl className="mt-3 space-y-2 text-xs">
            <div className="flex justify-between">
              <dt className="text-slate-500">Taxa de Juros Nominal / Efetiva</dt>
              <dd className="font-mono font-medium tabular-nums text-slate-900">
                {formatPercent(input.annualRate, 2)} a.a. ({formatPercent(result.monthlyEffectiveRate, 2)} a.m.)
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Renda Mínima Recomendada (30%)</dt>
              <dd className="font-mono font-semibold tabular-nums text-slate-900">
                {formatBRL(result.recommendedMinIncome)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Seguros Iniciais (MIP + DFI)</dt>
              <dd className="font-mono tabular-nums text-slate-900">
                {formatBRL(result.firstMonthMip + result.firstMonthDfi)} / mês
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Total Estimado ao Final do Prazo</dt>
              <dd className="font-mono font-medium tabular-nums text-slate-900">
                {formatBRL(result.totalPaid)}
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-lg border border-slate-200 p-4">
          <h2 className="text-sm font-semibold text-slate-900">
            Documentação e Desembolso Inicial
          </h2>
          <dl className="mt-3 space-y-2 text-xs">
            <div className="flex justify-between">
              <dt className="text-slate-500">ITBI ({formatPercent(input.itbiPercent, 1)})</dt>
              <dd className="font-mono tabular-nums text-slate-900">
                {formatBRL(result.documentation.itbiValue)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">
                Cartório e Registro {input.firstPropertyDiscount ? '(desc. 50% 1º imóvel)' : ''}
              </dt>
              <dd className="font-mono tabular-nums text-slate-900">
                {formatBRL(result.documentation.notaryValue)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Vistoria / Avaliação Bancária</dt>
              <dd className="font-mono tabular-nums text-slate-900">
                {formatBRL(result.documentation.bankAppraisalFee)}
              </dd>
            </div>
            <div className="flex justify-between border-t border-slate-100 pt-2 font-semibold">
              <dt className="text-slate-700">Total Documentação + Entrada em Espécie</dt>
              <dd className="font-mono tabular-nums text-slate-900">
                {formatBRL(result.documentation.totalInitialCashNeeded)}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* 20 vs 30 Years */}
      <div className="mt-5 rounded-lg border border-slate-200 p-4">
        <h2 className="text-sm font-semibold text-slate-900">
          Comparativo de Prazo: 20 anos vs 30 anos
        </h2>
        <div className="mt-3 grid grid-cols-3 gap-4 text-xs">
          <div>
            <p className="text-slate-500">20 Anos (240 meses)</p>
            <p className="mt-1 font-mono font-semibold tabular-nums text-slate-900">
              1ª Parcela: {formatBRL(termComparison.term20.firstInstallment)}
            </p>
            <p className="font-mono tabular-nums text-slate-600">
              Total Juros: {formatBRL(termComparison.term20.totalInterest)}
            </p>
          </div>
          <div>
            <p className="text-slate-500">30 Anos (360 meses)</p>
            <p className="mt-1 font-mono font-semibold tabular-nums text-slate-900">
              1ª Parcela: {formatBRL(termComparison.term30.firstInstallment)}
            </p>
            <p className="font-mono tabular-nums text-slate-600">
              Total Juros: {formatBRL(termComparison.term30.totalInterest)}
            </p>
          </div>
          <div>
            <p className="text-slate-500">Economia em 20 anos</p>
            <p className="mt-1 font-mono font-bold tabular-nums text-teal-700">
              {formatBRL(termComparison.interestSavings20vs30)}
            </p>
            <p className="text-slate-600">em juros acumulados</p>
          </div>
        </div>
      </div>

      {/* Bank comparison snapshot */}
      {bankComparisons.length > 0 && (
        <div className="mt-5">
          <h2 className="mb-2 text-sm font-semibold text-slate-900">
            Comparativo entre Instituições Financeiras ({input.system})
          </h2>
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2 font-medium">Banco / Linha</th>
                <th className="py-2 text-right font-medium">Taxa a.a.</th>
                <th className="py-2 text-right font-medium">1ª Parcela</th>
                <th className="py-2 text-right font-medium">Última Parcela</th>
                <th className="py-2 text-right font-medium">Renda Mín.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bankComparisons.map((item) => (
                <tr key={item.bank.id}>
                  <td className="py-2 font-medium text-slate-900">
                    {item.bank.shortName} · <span className="font-normal text-slate-500">{item.bank.modality}</span>
                  </td>
                  <td className="py-2 text-right font-mono tabular-nums text-slate-700">
                    {formatPercent(item.bank.annualRate, 2)}
                  </td>
                  <td className="py-2 text-right font-mono font-semibold tabular-nums text-slate-900">
                    {formatBRL(item.firstInstallment)}
                  </td>
                  <td className="py-2 text-right font-mono tabular-nums text-slate-700">
                    {formatBRL(item.lastInstallment)}
                  </td>
                  <td className="py-2 text-right font-mono tabular-nums text-slate-700">
                    {formatBRL(item.recommendedMinIncome)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Milestones Table */}
      {milestoneMonths.length > 0 && (
        <div className="mt-5">
          <h2 className="mb-2 text-sm font-semibold text-slate-900">
            Evolução das Parcelas (Marcos do Contrato)
          </h2>
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-1.5 font-medium">Parcela</th>
                <th className="py-1.5 text-right font-medium">Amortização</th>
                <th className="py-1.5 text-right font-medium">Juros</th>
                <th className="py-1.5 text-right font-medium">Seguros + Taxa</th>
                <th className="py-1.5 text-right font-medium">Parcela Total</th>
                <th className="py-1.5 text-right font-medium">Saldo Devedor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {milestoneMonths.map((row) => (
                <tr key={row.month}>
                  <td className="py-1.5 font-mono tabular-nums text-slate-800">
                    #{row.month} (Ano {row.year})
                  </td>
                  <td className="py-1.5 text-right font-mono tabular-nums text-slate-700">
                    {formatBRL(row.amortization)}
                  </td>
                  <td className="py-1.5 text-right font-mono tabular-nums text-slate-700">
                    {formatBRL(row.interest)}
                  </td>
                  <td className="py-1.5 text-right font-mono tabular-nums text-slate-700">
                    {formatBRL(row.mipInsurance + row.dfiInsurance + row.adminFee)}
                  </td>
                  <td className="py-1.5 text-right font-mono font-semibold tabular-nums text-slate-900">
                    {formatBRL(row.totalInstallment)}
                  </td>
                  <td className="py-1.5 text-right font-mono tabular-nums text-slate-700">
                    {formatBRL(row.remainingBalance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-6 border-t border-slate-200 pt-3 text-[11px] leading-relaxed text-slate-500">
        Observação: Os valores apresentados constituem uma simulação referencial para fins comerciais, não configurando oferta vinculante de crédito. Taxas de juros, alíquotas de ITBI municipal, emolumentos cartorários e seguros MIP/DFI estão sujeitos à política vigente da instituição financeira escolhida e à análise cadastral do proponente.
      </p>
    </div>
  );
};
