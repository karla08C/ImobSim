import React, {useState} from 'react';
import {Check, Copy, Download, ExternalLink, Printer, X} from 'lucide-react';
import {BRAZILIAN_BANKS} from '../data/banks';
import {BrokerProfile, SimulationInput, SimulationResult} from '../types';
import {
  buildWhatsAppProposalText,
  downloadCsv,
  getWhatsAppHref,
} from '../utils/finance';
import {PrintableProposal} from './PrintableProposal';

interface ProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  input: SimulationInput;
  result: SimulationResult;
  broker: BrokerProfile;
}

export const ProposalModal: React.FC<ProposalModalProps> = ({
  isOpen,
  onClose,
  input,
  result,
  broker,
}) => {
  const [activeTab, setActiveTab] = useState<'whatsapp' | 'pdf'>('whatsapp');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const bank = BRAZILIAN_BANKS.find((b) => b.id === input.selectedBankId);
  const bankName = bank ? `${bank.shortName} (${bank.modality})` : 'Taxa Personalizada';
  const whatsappText = buildWhatsAppProposalText(input, result, broker, bankName);
  const whatsappUrl = getWhatsAppHref(input.leadPhone, whatsappText);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(whatsappText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard fallback ignored
    }
  };

  const handleExportCsv = () => {
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
    downloadCsv(`simulacao-${input.system.toLowerCase()}-${input.termYears}anos.csv`, headers, rows);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="no-print fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="proposal-modal-title"
    >
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl sm:rounded-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 id="proposal-modal-title" className="text-lg font-bold text-slate-900">
              Enviar ou Exportar Proposta
            </h2>
            <p className="text-xs text-slate-500">
              Compartilhe pelo WhatsApp, imprima em PDF A4 ou baixe a planilha completa em CSV.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar janela de proposta"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Mode Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-[#F8FAFC] px-5 py-3">
          <div className="inline-flex items-center gap-1 rounded-xl bg-slate-200/70 p-1">
            <button
              type="button"
              onClick={() => setActiveTab('whatsapp')}
              className={`min-h-[38px] rounded-lg px-3.5 py-1.5 text-xs font-bold whitespace-nowrap shrink-0 transition-colors ${
                activeTab === 'whatsapp'
                  ? 'bg-[#0B1622] text-white'
                  : 'text-slate-600 hover:text-[#0B1622]'
              }`}
            >
              Mensagem WhatsApp
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('pdf')}
              className={`min-h-[38px] rounded-lg px-3.5 py-1.5 text-xs font-bold whitespace-nowrap shrink-0 transition-colors ${
                activeTab === 'pdf'
                  ? 'bg-[#0B1622] text-white'
                  : 'text-slate-600 hover:text-[#0B1622]'
              }`}
            >
              Pré-visualizar PDF / Impressão
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex min-h-[40px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-[#0B1622] whitespace-nowrap shrink-0 transition-colors hover:bg-slate-50"
            >
              <Download className="h-4 w-4" />
              Exportar CSV
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex min-h-[40px] items-center gap-2 rounded-xl bg-[#0B1622] px-4 py-2 text-xs font-bold text-white whitespace-nowrap shrink-0 transition-colors hover:bg-[#16273B]"
            >
              <Printer className="h-4 w-4" />
              Imprimir / Salvar PDF
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === 'whatsapp' ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-[#F8FAFC] p-4">
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-[#0B1622]">
                  {whatsappText}
                </pre>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-slate-500">
                  {input.leadPhone
                    ? `Destinatário selecionado: ${input.leadName || 'Lead'} (${input.leadPhone})`
                    : 'Dica: selecione um Lead no simulador para preencher automaticamente o número de WhatsApp.'}
                </p>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-[#0B1622] whitespace-nowrap shrink-0 transition-colors hover:bg-slate-50"
                  >
                    {copied ? <Check className="h-4 w-4 text-[#089166]" /> : <Copy className="h-4 w-4" />}
                    {copied ? 'Texto Copiado' : 'Copiar Mensagem'}
                  </button>
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#089166] px-4 py-2 text-sm font-bold text-white whitespace-nowrap shrink-0 transition-colors hover:bg-[#077B50]"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Abrir no WhatsApp
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <PrintableProposal input={input} result={result} broker={broker} isPreview />
          )}
        </div>
      </div>
    </div>
  );
};
