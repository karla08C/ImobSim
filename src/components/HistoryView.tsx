import React, {useMemo, useState} from 'react';
import {
  Calculator,
  Download,
  FileText,
  Search,
  Trash2,
} from 'lucide-react';
import {SavedSimulation} from '../types';
import {downloadCsv, formatBRL, formatPercent} from '../utils/finance';

interface HistoryViewProps {
  history: SavedSimulation[];
  onLoadSimulation: (item: SavedSimulation, openProposalAfter?: boolean) => void;
  onDeleteSimulation: (id: string) => void;
  onClearHistory: () => void;
  onGoToSimulator: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  history,
  onLoadSimulation,
  onDeleteSimulation,
  onClearHistory,
  onGoToSimulator,
}) => {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return history;
    return history.filter((item) => {
      return (
        item.bankName.toLowerCase().includes(q) ||
        (item.input.leadName || '').toLowerCase().includes(q) ||
        (item.input.propertyTitle || '').toLowerCase().includes(q) ||
        item.input.system.toLowerCase().includes(q)
      );
    });
  }, [history, search]);

  const handleExportCsv = () => {
    const headers = [
      'Data',
      'Cliente',
      'Imovel',
      'Banco',
      'Sistema',
      'Valor_Imovel',
      'Financiado',
      'Prazo_Anos',
      'Taxa_AA',
      'Primeira_Parcela',
      'Renda_Minima',
    ];
    const rows = filtered.map((h) => [
      new Date(h.createdAt).toLocaleString('pt-BR'),
      h.input.leadName || 'Avulso',
      h.input.propertyTitle || 'Avulso',
      h.bankName,
      h.input.system,
      h.input.propertyValue,
      h.financedAmount,
      h.input.termYears,
      h.input.annualRate,
      h.firstInstallment.toFixed(2).replace('.', ','),
      h.recommendedMinIncome.toFixed(2).replace('.', ','),
    ]);
    downloadCsv('historico-simulacoes.csv', headers, rows);
  };

  const formatDate = (iso: string) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar no histórico por cliente, banco ou imóvel..."
            className="min-h-[42px] w-full rounded-xl border border-slate-200 pl-9 pr-3 text-sm text-[#0B1622] placeholder:text-slate-400 focus:border-[#089166] focus:outline-none focus:ring-2 focus:ring-[#089166]/20"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {history.length > 0 && (
            <>
              <button
                type="button"
                onClick={handleExportCsv}
                className="inline-flex min-h-[42px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-[#0B1622] whitespace-nowrap hover:bg-slate-50"
              >
                <Download className="h-4 w-4" />
                Exportar CSV
              </button>
              <button
                type="button"
                onClick={onClearHistory}
                className="inline-flex min-h-[42px] items-center gap-2 rounded-xl border border-red-200 bg-white px-3.5 py-2 text-xs font-bold text-[#EF4444] whitespace-nowrap hover:bg-red-50"
              >
                Limpar Tudo
              </button>
            </>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center">
          <p className="text-base font-bold text-[#0B1622]">
            {history.length === 0
              ? 'Nenhuma simulação salva no histórico'
              : 'Nenhum registro encontrado para sua busca'}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Configure um cenário no simulador e clique em "Salvar Simulação" para registrar propostas aqui.
          </p>
          <button
            type="button"
            onClick={onGoToSimulator}
            className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#089166] px-4 py-2 text-sm font-bold text-white hover:bg-[#077B50]"
          >
            <Calculator className="h-4 w-4" />
            Ir para o Simulador
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <article
              key={item.id}
              className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center"
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="tabular-nums">{formatDate(item.createdAt)}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-bold text-[#0B1622]">{item.bankName}</span>
                  <span aria-hidden="true">·</span>
                  <span>
                    {item.input.system} ({item.input.termYears} anos)
                  </span>
                </div>

                <h3 className="text-base font-bold text-[#0B1622]">
                  {item.input.leadName || 'Simulação Avulsa'}
                  {item.input.propertyTitle ? ` — ${item.input.propertyTitle}` : ''}
                </h3>

                <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-600 tabular-nums">
                  <span>
                    Imóvel:{' '}
                    <strong className="text-[#0B1622]">
                      {formatBRL(item.input.propertyValue)}
                    </strong>
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    Financiado:{' '}
                    <strong className="text-[#0B1622]">
                      {formatBRL(item.financedAmount)}
                    </strong>
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    Taxa:{' '}
                    <strong className="text-[#0B1622]">
                      {formatPercent(item.input.annualRate, 2)} a.a.
                    </strong>
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    1ª Parcela:{' '}
                    <strong className="text-[#089166]">
                      {formatBRL(item.firstInstallment)}
                    </strong>
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => onDeleteSimulation(item.id)}
                  aria-label="Excluir registro do histórico"
                  className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl text-slate-500 hover:bg-red-50 hover:text-[#EF4444]"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onLoadSimulation(item, false)}
                  className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-[#0B1622] whitespace-nowrap hover:bg-slate-50"
                >
                  <Calculator className="h-3.5 w-3.5" />
                  Reabrir
                </button>
                <button
                  type="button"
                  onClick={() => onLoadSimulation(item, true)}
                  className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-[#089166] px-3.5 py-2 text-xs font-bold text-white whitespace-nowrap hover:bg-[#077B50]"
                >
                  <FileText className="h-3.5 w-3.5" />
                  Proposta
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
