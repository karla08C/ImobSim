import React, {useMemo, useState} from 'react';
import {
  Calculator,
  Download,
  Edit3,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import {PropertyItem, PropertyStatus, PropertyType} from '../types';
import {downloadCsv, formatBRL} from '../utils/finance';

interface PropertiesViewProps {
  properties: PropertyItem[];
  onSaveProperty: (item: PropertyItem) => void;
  onDeleteProperty: (id: string) => void;
  onSimulateProperty: (item: PropertyItem) => void;
}

const EMPTY_FORM: Omit<PropertyItem, 'id' | 'createdAt'> = {
  code: '',
  title: '',
  type: 'Apartamento',
  neighborhood: '',
  city: 'São Paulo, SP',
  price: 450000,
  areaSqm: 65,
  bedrooms: 2,
  parkingSpots: 1,
  status: 'Disponível',
  notes: '',
};

export const PropertiesView: React.FC<PropertiesViewProps> = ({
  properties,
  onSaveProperty,
  onDeleteProperty,
  onSimulateProperty,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Todos' | PropertyStatus>('Todos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<PropertyItem, 'id' | 'createdAt'>>(EMPTY_FORM);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return properties.filter((item) => {
      if (statusFilter !== 'Todos' && item.status !== statusFilter) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q) ||
        item.neighborhood.toLowerCase().includes(q) ||
        item.city.toLowerCase().includes(q)
      );
    });
  }, [properties, search, statusFilter]);

  const openNew = () => {
    setEditingId(null);
    setForm({
      ...EMPTY_FORM,
      code: `IM-${Math.floor(1000 + Math.random() * 9000)}`,
    });
    setIsModalOpen(true);
  };

  const openEdit = (item: PropertyItem) => {
    setEditingId(item.id);
    setForm({
      code: item.code,
      title: item.title,
      type: item.type,
      neighborhood: item.neighborhood,
      city: item.city,
      price: item.price,
      areaSqm: item.areaSqm,
      bedrooms: item.bedrooms,
      parkingSpots: item.parkingSpots,
      status: item.status,
      notes: item.notes,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProperty({
      ...form,
      id: editingId || `prop-${Date.now()}`,
      createdAt: editingId
        ? properties.find((p) => p.id === editingId)?.createdAt || new Date().toISOString()
        : new Date().toISOString(),
    });
    setIsModalOpen(false);
  };

  const handleExportCsv = () => {
    const headers = [
      'Codigo',
      'Titulo',
      'Tipo',
      'Bairro',
      'Cidade',
      'Valor',
      'Area_m2',
      'Quartos',
      'Vagas',
      'Status',
    ];
    const rows = filtered.map((p) => [
      p.code,
      p.title,
      p.type,
      p.neighborhood,
      p.city,
      p.price,
      p.areaSqm,
      p.bedrooms,
      p.parkingSpots,
      p.status,
    ]);
    downloadCsv('carteira-imoveis.csv', headers, rows);
  };

  const statusTextColor = (status: PropertyStatus) => {
    if (status === 'Disponível') return 'text-emerald-700 font-semibold';
    if (status === 'Reservado') return 'text-amber-700 font-semibold';
    return 'text-slate-500 font-medium';
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
              placeholder="Buscar por código, título ou bairro..."
              className="min-h-[42px] w-full rounded-xl border border-slate-200 pl-9 pr-3 text-sm text-[#0B1622] placeholder:text-slate-400 focus:border-[#089166] focus:outline-none focus:ring-2 focus:ring-[#089166]/20"
            />
          </div>

          <div className="inline-flex items-center gap-1 rounded-xl bg-slate-100 p-1">
            {(['Todos', 'Disponível', 'Reservado', 'Vendido'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`min-h-[36px] rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
                  statusFilter === st
                    ? 'bg-[#0B1622] text-white'
                    : 'text-slate-600 hover:text-[#0B1622]'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
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
            Cadastrar Imóvel
          </button>
        </div>
      </div>

      {/* Empty State */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center">
          <p className="text-base font-bold text-[#0B1622]">
            Nenhum imóvel encontrado
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Cadastre imóveis da sua carteira para iniciar simulações com 1 clique.
          </p>
          <button
            type="button"
            onClick={openNew}
            className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#089166] px-4 py-2 text-sm font-bold text-white hover:bg-[#077B50]"
          >
            <Plus className="h-4 w-4" />
            Adicionar Primeiro Imóvel
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item) => (
            <article
              key={item.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 transition-colors hover:border-slate-300"
            >
              <div>
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-slate-500 tabular-nums">
                    {item.code} · {item.type}
                  </span>
                  <span className={statusTextColor(item.status)}>{item.status}</span>
                </div>

                <h3 className="mt-2 text-base font-bold text-[#0B1622]">{item.title}</h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  {item.neighborhood}, {item.city}
                </p>

                <p className="mt-3 text-xl font-extrabold tabular-nums text-[#089166]">
                  {formatBRL(item.price)}
                </p>

                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                  <span className="font-semibold tabular-nums">{item.areaSqm} m²</span>
                  <span aria-hidden="true">·</span>
                  <span>{item.bedrooms} dorms</span>
                  <span aria-hidden="true">·</span>
                  <span>{item.parkingSpots} vagas</span>
                </div>

                {item.notes && (
                  <p className="mt-3 line-clamp-2 border-t border-slate-100 pt-3 text-xs leading-relaxed text-slate-600">
                    {item.notes}
                  </p>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openEdit(item)}
                    aria-label={`Editar ${item.title}`}
                    className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-[#0B1622]"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteProperty(item.id)}
                    aria-label={`Excluir ${item.title}`}
                    className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl text-slate-500 hover:bg-red-50 hover:text-[#EF4444]"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => onSimulateProperty(item)}
                  className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-[#089166] px-3.5 py-2 text-xs font-bold text-white whitespace-nowrap hover:bg-[#077B50]"
                >
                  <Calculator className="h-3.5 w-3.5" />
                  Simular Imóvel
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Add / Edit Property Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white shadow-xl sm:rounded-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h2 className="text-base font-bold text-slate-900">
                {editingId ? 'Editar Imóvel' : 'Novo Imóvel na Carteira'}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                aria-label="Fechar modal de imóvel"
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 p-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">Código</label>
                  <input
                    type="text"
                    required
                    value={form.code}
                    onChange={(e) => setForm({...form, code: e.target.value})}
                    className="min-h-[42px] w-full rounded-lg border border-slate-300 px-3 font-mono text-sm"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-medium text-slate-700">Título do Imóvel</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex.: Apartamento Jardins 2 Dorms"
                    value={form.title}
                    onChange={(e) => setForm({...form, title: e.target.value})}
                    className="min-h-[42px] w-full rounded-lg border border-slate-300 px-3 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">Tipo</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({...form, type: e.target.value as PropertyType})}
                    className="min-h-[42px] w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
                  >
                    <option value="Apartamento">Apartamento</option>
                    <option value="Casa">Casa</option>
                    <option value="Cobertura">Cobertura</option>
                    <option value="Terreno">Terreno</option>
                    <option value="Comercial">Comercial</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({...form, status: e.target.value as PropertyStatus})}
                    className="min-h-[42px] w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
                  >
                    <option value="Disponível">Disponível</option>
                    <option value="Reservado">Reservado</option>
                    <option value="Vendido">Vendido</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">Bairro</label>
                  <input
                    type="text"
                    required
                    value={form.neighborhood}
                    onChange={(e) => setForm({...form, neighborhood: e.target.value})}
                    className="min-h-[42px] w-full rounded-lg border border-slate-300 px-3 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">Cidade / UF</label>
                  <input
                    type="text"
                    required
                    value={form.city}
                    onChange={(e) => setForm({...form, city: e.target.value})}
                    className="min-h-[42px] w-full rounded-lg border border-slate-300 px-3 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="col-span-2">
                  <label className="mb-1 block text-xs font-medium text-slate-700">Valor (R$)</label>
                  <input
                    type="number"
                    required
                    min={10000}
                    step={1000}
                    value={form.price}
                    onChange={(e) => setForm({...form, price: Number(e.target.value)})}
                    className="min-h-[42px] w-full rounded-lg border border-slate-300 px-3 font-mono text-sm tabular-nums"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">Área (m²)</label>
                  <input
                    type="number"
                    min={10}
                    value={form.areaSqm}
                    onChange={(e) => setForm({...form, areaSqm: Number(e.target.value)})}
                    className="min-h-[42px] w-full rounded-lg border border-slate-300 px-3 font-mono text-sm tabular-nums"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">Dorms</label>
                  <input
                    type="number"
                    min={0}
                    value={form.bedrooms}
                    onChange={(e) => setForm({...form, bedrooms: Number(e.target.value)})}
                    className="min-h-[42px] w-full rounded-lg border border-slate-300 px-3 font-mono text-sm tabular-nums"
                  />
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
                  {editingId ? 'Salvar Alterações' : 'Cadastrar Imóvel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
