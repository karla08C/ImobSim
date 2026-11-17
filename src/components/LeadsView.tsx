import React, {useMemo, useState} from 'react';
import {
  Calculator,
  Download,
  Edit3,
  ExternalLink,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import {LeadItem, LeadStage} from '../types';
import {downloadCsv, formatBRL, getWhatsAppHref} from '../utils/finance';

interface LeadsViewProps {
  leads: LeadItem[];
  onSaveLead: (lead: LeadItem) => void;
  onDeleteLead: (id: string) => void;
  onSimulateLead: (lead: LeadItem) => void;
}

const EMPTY_FORM: Omit<LeadItem, 'id' | 'createdAt'> = {
  name: '',
  phone: '',
  email: '',
  monthlyIncome: 10000,
  availableDownPayment: 70000,
  availableFgts: 20000,
  age: 32,
  interestProperty: '',
  stage: 'Novo',
  notes: '',
};

const STAGES: ('Todos' | LeadStage)[] = [
  'Todos',
  'Novo',
  'Em Simulação',
  'Análise de Crédito',
  'Proposta Enviada',
  'Fechado',
];

export const LeadsView: React.FC<LeadsViewProps> = ({
  leads,
  onSaveLead,
  onDeleteLead,
  onSimulateLead,
}) => {
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<'Todos' | LeadStage>('Todos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<LeadItem, 'id' | 'createdAt'>>(EMPTY_FORM);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return leads.filter((item) => {
      if (stageFilter !== 'Todos' && item.stage !== stageFilter) return false;
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.phone.toLowerCase().includes(q) ||
        item.interestProperty.toLowerCase().includes(q)
      );
    });
  }, [leads, search, stageFilter]);

  const openNew = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setIsModalOpen(true);
  };

  const openEdit = (item: LeadItem) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      phone: item.phone,
      email: item.email,
      monthlyIncome: item.monthlyIncome,
      availableDownPayment: item.availableDownPayment,
      availableFgts: item.availableFgts,
      age: item.age,
      interestProperty: item.interestProperty,
      stage: item.stage,
      notes: item.notes,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveLead({
      ...form,
      id: editingId || `lead-${Date.now()}`,
      createdAt: editingId
        ? leads.find((l) => l.id === editingId)?.createdAt || new Date().toISOString()
        : new Date().toISOString(),
    });
    setIsModalOpen(false);
  };

  const handleExportCsv = () => {
    const headers = [
      'Nome',
      'WhatsApp',
      'Email',
      'Renda_Mensal',
      'Entrada_Disponivel',
      'FGTS',
      'Idade',
      'Imovel_Interesse',
      'Etapa',
    ];
    const rows = filtered.map((l) => [
      l.name,
      l.phone,
      l.email,
      l.monthlyIncome,
      l.availableDownPayment,
      l.availableFgts,
      l.age,
      l.interestProperty,
      l.stage,
    ]);
    downloadCsv('leads-clientes.csv', headers, rows);
  };

  const stageTextColor = (stage: LeadStage) => {
    if (stage === 'Fechado') return 'text-emerald-700 font-semibold';
    if (stage === 'Proposta Enviada' || stage === 'Análise de Crédito')
      return 'text-teal-700 font-semibold';
    if (stage === 'Em Simulação') return 'text-amber-700 font-semibold';
    return 'text-slate-600 font-medium';
  };

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar lead por nome, telefone ou imóvel..."
              className="min-h-[42px] w-full rounded-xl border border-slate-200 pl-9 pr-3 text-sm text-[#0B1622] placeholder:text-slate-400 focus:border-[#089166] focus:outline-none focus:ring-2 focus:ring-[#089166]/20"
            />
          </div>

          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value as 'Todos' | LeadStage)}
            aria-label="Filtrar leads por etapa"
            className="min-h-[42px] rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-[#0B1622] focus:border-[#089166] focus:outline-none"
          >
            {STAGES.map((st) => (
              <option key={st} value={st}>
                Etapa: {st}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
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
            onClick={openNew}
            className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-[#0B1622] px-4 py-2 text-xs font-bold text-white whitespace-nowrap hover:bg-[#16273B]"
          >
            <Plus className="h-4 w-4" />
            Novo Lead
          </button>
        </div>
      </div>

      {/* Leads List / Table */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center">
          <p className="text-base font-bold text-[#0B1622]">Nenhum lead cadastrado</p>
          <p className="mt-1 text-sm text-slate-500">
            Adicione potenciais compradores com renda, FGTS e entrada disponível para simular rapidamente.
          </p>
          <button
            type="button"
            onClick={openNew}
            className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#089166] px-4 py-2 text-sm font-bold text-white hover:bg-[#077B50]"
          >
            <Plus className="h-4 w-4" />
            Cadastrar Primeiro Lead
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-[#F8FAFC] text-xs text-slate-500">
                  <th className="px-5 py-3 font-semibold">Cliente / Interesse</th>
                  <th className="px-3 py-3 font-semibold">Contato</th>
                  <th className="px-3 py-3 text-right font-semibold">Renda Mensal</th>
                  <th className="px-3 py-3 text-right font-semibold">Entrada + FGTS</th>
                  <th className="px-3 py-3 font-semibold">Etapa</th>
                  <th className="px-5 py-3 text-right font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 tabular-nums">
                {filtered.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/80">
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-[#0B1622]">{lead.name}</div>
                      <div className="mt-0.5 text-xs text-slate-500">
                        {lead.interestProperty || 'Interesse em aberto'} · {lead.age} anos
                      </div>
                    </td>
                    <td className="px-3 py-3.5 text-xs text-slate-700">
                      <div className="font-semibold">{lead.phone}</div>
                      {lead.email && <div className="text-slate-500">{lead.email}</div>}
                    </td>
                    <td className="px-3 py-3.5 text-right text-xs font-bold text-[#0B1622]">
                      {formatBRL(lead.monthlyIncome)}
                    </td>
                    <td className="px-3 py-3.5 text-right text-xs text-slate-700">
                      <div className="font-semibold text-[#089166]">
                        {formatBRL(lead.availableDownPayment + lead.availableFgts)}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        FGTS {formatBRL(lead.availableFgts)}
                      </div>
                    </td>
                    <td className="px-3 py-3.5 text-xs">
                      <span className={stageTextColor(lead.stage)}>{lead.stage}</span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        <a
                          href={getWhatsAppHref(
                            lead.phone,
                            `Olá ${lead.name}, tudo bem? Preparei sua simulação de financiamento imobiliário.`
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Abrir WhatsApp de ${lead.name}`}
                          className="flex min-h-[38px] min-w-[38px] items-center justify-center rounded-xl border border-slate-200 text-[#089166] hover:bg-emerald-50"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                        <button
                          type="button"
                          onClick={() => openEdit(lead)}
                          aria-label={`Editar ${lead.name}`}
                          className="flex min-h-[38px] min-w-[38px] items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-[#0B1622]"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteLead(lead.id)}
                          aria-label={`Excluir ${lead.name}`}
                          className="flex min-h-[38px] min-w-[38px] items-center justify-center rounded-xl text-slate-500 hover:bg-red-50 hover:text-[#EF4444]"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onSimulateLead(lead)}
                          className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl bg-[#089166] px-3 py-1.5 text-xs font-bold text-white whitespace-nowrap hover:bg-[#077B50]"
                        >
                          <Calculator className="h-3.5 w-3.5" />
                          Simular
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Lead Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white shadow-xl sm:rounded-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h2 className="text-base font-bold text-slate-900">
                {editingId ? 'Editar Lead' : 'Cadastrar Novo Lead'}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                aria-label="Fechar modal de lead"
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 p-5">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Nome Completo / Casal
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({...form, name: e.target.value})}
                  className="min-h-[42px] w-full rounded-lg border border-slate-300 px-3 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">WhatsApp</label>
                  <input
                    type="text"
                    required
                    placeholder="(11) 99999-9999"
                    value={form.phone}
                    onChange={(e) => setForm({...form, phone: e.target.value})}
                    className="min-h-[42px] w-full rounded-lg border border-slate-300 px-3 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">E-mail</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({...form, email: e.target.value})}
                    className="min-h-[42px] w-full rounded-lg border border-slate-300 px-3 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">
                    Renda Mensal (R$)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={500}
                    value={form.monthlyIncome}
                    onChange={(e) => setForm({...form, monthlyIncome: Number(e.target.value)})}
                    className="min-h-[42px] w-full rounded-lg border border-slate-300 px-3 font-mono text-sm tabular-nums"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">
                    Idade (MIP)
                  </label>
                  <input
                    type="number"
                    min={18}
                    max={80}
                    value={form.age}
                    onChange={(e) => setForm({...form, age: Number(e.target.value)})}
                    className="min-h-[42px] w-full rounded-lg border border-slate-300 px-3 font-mono text-sm tabular-nums"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">
                    Entrada em Espécie (R$)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={form.availableDownPayment}
                    onChange={(e) =>
                      setForm({...form, availableDownPayment: Number(e.target.value)})
                    }
                    className="min-h-[42px] w-full rounded-lg border border-slate-300 px-3 font-mono text-sm tabular-nums"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">
                    FGTS Disponível (R$)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={form.availableFgts}
                    onChange={(e) => setForm({...form, availableFgts: Number(e.target.value)})}
                    className="min-h-[42px] w-full rounded-lg border border-slate-300 px-3 font-mono text-sm tabular-nums"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">
                    Imóvel de Interesse
                  </label>
                  <input
                    type="text"
                    value={form.interestProperty}
                    onChange={(e) => setForm({...form, interestProperty: e.target.value})}
                    className="min-h-[42px] w-full rounded-lg border border-slate-300 px-3 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">Etapa</label>
                  <select
                    value={form.stage}
                    onChange={(e) => setForm({...form, stage: e.target.value as LeadStage})}
                    className="min-h-[42px] w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
                  >
                    <option value="Novo">Novo</option>
                    <option value="Em Simulação">Em Simulação</option>
                    <option value="Análise de Crédito">Análise de Crédito</option>
                    <option value="Proposta Enviada">Proposta Enviada</option>
                    <option value="Fechado">Fechado</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">Observações</label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({...form, notes: e.target.value})}
                  className="w-full rounded-lg border border-slate-300 p-3 text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="min-h-[44px] rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  {editingId ? 'Salvar Alterações' : 'Cadastrar Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
