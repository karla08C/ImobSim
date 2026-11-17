import React, {useState} from 'react';
import {X} from 'lucide-react';
import {BrokerProfile} from '../types';

interface BrokerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: BrokerProfile;
  onSave: (profile: BrokerProfile) => void;
}

export const BrokerProfileModal: React.FC<BrokerProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSave,
}) => {
  const [form, setForm] = useState<BrokerProfile>(profile);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
    onClose();
  };

  return (
    <div
      className="no-print fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="broker-modal-title"
    >
      <div className="w-full max-w-md rounded-t-2xl bg-white shadow-xl sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 id="broker-modal-title" className="text-base font-bold text-slate-900">
              Dados do Corretor
            </h2>
            <p className="text-xs text-slate-500">
              Exibidos automaticamente nas propostas em PDF e WhatsApp.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar configurações do corretor"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">
              Nome Completo
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({...form, name: e.target.value})}
              className="min-h-[44px] w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">CRECI</label>
              <input
                type="text"
                required
                value={form.creci}
                onChange={(e) => setForm({...form, creci: e.target.value})}
                className="min-h-[44px] w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Telefone / WhatsApp
              </label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm({...form, phone: e.target.value})}
                className="min-h-[44px] w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">
              Imobiliária / Marca
            </label>
            <input
              type="text"
              value={form.agency}
              onChange={(e) => setForm({...form, agency: e.target.value})}
              className="min-h-[44px] w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">E-mail</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({...form, email: e.target.value})}
              className="min-h-[44px] w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="min-h-[44px] rounded-xl bg-[#0B1622] px-4 py-2 text-sm font-bold text-white hover:bg-[#16273B]"
            >
              Salvar Dados
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
