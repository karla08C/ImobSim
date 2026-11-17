import React, {useEffect, useMemo, useState} from 'react';
import {
  Building2,
  Calculator,
  History,
  Settings,
  Users,
} from 'lucide-react';
import {BrokerProfileModal} from './components/BrokerProfileModal';
import {HistoryView} from './components/HistoryView';
import {LeadsView} from './components/LeadsView';
import {PrintableProposal} from './components/PrintableProposal';
import {PropertiesView} from './components/PropertiesView';
import {ProposalModal} from './components/ProposalModal';
import {SimulatorView} from './components/SimulatorView';
import {BRAZILIAN_BANKS} from './data/banks';
import {
  AppTab,
  BrokerProfile,
  LeadItem,
  PropertyItem,
  SavedSimulation,
  SimulationInput,
} from './types';
import {calculateSimulation} from './utils/finance';
import {
  loadBrokerProfile,
  loadHistory,
  loadLeads,
  loadProperties,
  saveBrokerProfile,
  saveHistory,
  saveLeads,
  saveProperties,
} from './utils/storage';

const INITIAL_SIMULATION: SimulationInput = {
  propertyValue: 480000,
  downPayment: 96000,
  fgtsAmount: 0,
  termYears: 30,
  annualRate: 10.49,
  system: 'SAC',
  buyerAge: 32,
  clientIncome: 13800,
  itbiPercent: 2.5,
  notaryPercent: 2.0,
  firstPropertyDiscount: false,
  selectedBankId: 'caixa-sbpe',
};

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('simulator');
  const [simInput, setSimInput] = useState<SimulationInput>(INITIAL_SIMULATION);

  const [properties, setProperties] = useState<PropertyItem[]>(() => loadProperties());
  const [leads, setLeads] = useState<LeadItem[]>(() => loadLeads());
  const [history, setHistory] = useState<SavedSimulation[]>(() => loadHistory());
  const [brokerProfile, setBrokerProfile] = useState<BrokerProfile>(() => loadBrokerProfile());

  const [isProposalOpen, setIsProposalOpen] = useState(false);
  const [isBrokerModalOpen, setIsBrokerModalOpen] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    saveProperties(properties);
  }, [properties]);

  useEffect(() => {
    saveLeads(leads);
  }, [leads]);

  useEffect(() => {
    saveHistory(history);
  }, [history]);

  useEffect(() => {
    saveBrokerProfile(brokerProfile);
  }, [brokerProfile]);

  const simResult = useMemo(() => calculateSimulation(simInput), [simInput]);

  const handleSaveToHistory = () => {
    const bank = BRAZILIAN_BANKS.find((b) => b.id === simInput.selectedBankId);
    const entry: SavedSimulation = {
      id: `sim-${Date.now()}`,
      createdAt: new Date().toISOString(),
      bankName: bank ? `${bank.shortName} (${bank.modality})` : 'Taxa Personalizada',
      input: {...simInput},
      firstInstallment: simResult.firstInstallment,
      lastInstallment: simResult.lastInstallment,
      financedAmount: simResult.financedAmount,
      totalPaid: simResult.totalPaid,
      totalInterest: simResult.totalInterest,
      recommendedMinIncome: simResult.recommendedMinIncome,
      totalDocs: simResult.documentation.totalDocs,
    };
    setHistory((prev) => [entry, ...prev]);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2200);
  };

  const handleSaveProperty = (item: PropertyItem) => {
    setProperties((prev) => {
      const exists = prev.some((p) => p.id === item.id);
      return exists ? prev.map((p) => (p.id === item.id ? item : p)) : [item, ...prev];
    });
  };

  const handleDeleteProperty = (id: string) => {
    setProperties((prev) => prev.filter((p) => p.id !== id));
  };

  const handleSimulateProperty = (item: PropertyItem) => {
    const recommendedBank =
      item.price <= 500000
        ? BRAZILIAN_BANKS.find((b) => b.id === 'caixa-mcmv')
        : BRAZILIAN_BANKS.find((b) => b.id === 'caixa-sbpe');

    setSimInput((prev) => ({
      ...prev,
      propertyId: item.id,
      propertyTitle: `${item.title} (${item.neighborhood})`,
      propertyValue: item.price,
      downPayment: Math.round(item.price * 0.2),
      selectedBankId: recommendedBank ? recommendedBank.id : prev.selectedBankId,
      annualRate: recommendedBank ? recommendedBank.annualRate : prev.annualRate,
    }));
    setActiveTab('simulator');
  };

  const handleSaveLead = (item: LeadItem) => {
    setLeads((prev) => {
      const exists = prev.some((l) => l.id === item.id);
      return exists ? prev.map((l) => (l.id === item.id ? item : l)) : [item, ...prev];
    });
  };

  const handleDeleteLead = (id: string) => {
    setLeads((prev) => prev.filter((l) => l.id !== id));
  };

  const handleSimulateLead = (lead: LeadItem) => {
    setSimInput((prev) => ({
      ...prev,
      leadId: lead.id,
      leadName: lead.name,
      leadPhone: lead.phone,
      clientIncome: lead.monthlyIncome,
      downPayment: lead.availableDownPayment,
      fgtsAmount: lead.availableFgts,
      buyerAge: lead.age,
    }));
    setActiveTab('simulator');
  };

  const handleLoadSimulation = (saved: SavedSimulation, openProposalAfter = false) => {
    setSimInput(saved.input);
    setActiveTab('simulator');
    if (openProposalAfter) {
      setIsProposalOpen(true);
    }
  };

  const handleDeleteSimulation = (id: string) => {
    setHistory((prev) => prev.filter((h) => h.id !== id));
  };

  const handleClearHistory = () => {
    setHistory([]);
  };

  const navItems: {
    id: AppTab;
    label: string;
    shortLabel: string;
    count?: number;
    icon: React.ComponentType<{className?: string}>;
  }[] = [
    {id: 'simulator', label: 'Simulador', shortLabel: 'Simulador', icon: Calculator},
    {
      id: 'properties',
      label: 'Imóveis',
      shortLabel: 'Imóveis',
      count: properties.length,
      icon: Building2,
    },
    {
      id: 'leads',
      label: 'Leads',
      shortLabel: 'Leads',
      count: leads.length,
      icon: Users,
    },
    {
      id: 'history',
      label: 'Salvos',
      shortLabel: 'Salvos',
      count: history.length,
      icon: History,
    },
  ];

  return (
    <>
      <div className="no-print flex min-h-screen flex-col bg-[#F1F5F8] text-[#0B1622] pb-20 lg:pb-0">
        {/* TOP DARK NAVY NAVIGATION BAR (matching reference model) */}
        <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-[#0B1622] text-white">
          <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
            {/* Brand Zone */}
            <button
              type="button"
              onClick={() => setActiveTab('simulator')}
              className="flex items-center gap-3 text-left whitespace-nowrap shrink-0"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#10B981] text-sm font-extrabold text-[#0B1622]">
                IS
              </span>
              <span className="font-display text-lg font-bold tracking-tight text-white">
                ImobSim <span className="text-[#10B981]">Pro</span>
              </span>
            </button>

            {/* Desktop Navigation Tabs */}
            <nav
              aria-label="Navegação principal"
              className="hidden items-center gap-2 lg:flex"
            >
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    className={`min-h-[40px] rounded-lg px-4 py-2 text-sm font-semibold whitespace-nowrap shrink-0 transition-colors ${
                      isActive
                        ? 'bg-[#10B981] text-[#0B1622]'
                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {item.label}
                    {typeof item.count === 'number' ? ` (${item.count})` : ''}
                  </button>
                );
              })}
            </nav>

            {/* Primary Action / Broker Profile */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsBrokerModalOpen(true)}
                aria-label="Dados do corretor"
                className="inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-slate-700 bg-white/5 px-3 py-2 text-xs font-medium text-slate-200 whitespace-nowrap transition-colors hover:bg-white/10 hover:text-white"
              >
                <Settings className="h-4 w-4 text-[#10B981]" />
                <span className="hidden sm:inline">{brokerProfile.name}</span>
              </button>
            </div>
          </div>
        </header>

        {/* WORKSPACE CONTENT */}
        <main className="mx-auto w-full max-w-[1280px] flex-1 p-4 sm:p-6 lg:p-8">
          {activeTab === 'simulator' && (
            <SimulatorView
              input={simInput}
              onChange={setSimInput}
              result={simResult}
              properties={properties}
              leads={leads}
              broker={brokerProfile}
              onSaveToHistory={handleSaveToHistory}
              onOpenProposal={() => setIsProposalOpen(true)}
              justSaved={justSaved}
            />
          )}

          {activeTab === 'properties' && (
            <PropertiesView
              properties={properties}
              onSaveProperty={handleSaveProperty}
              onDeleteProperty={handleDeleteProperty}
              onSimulateProperty={handleSimulateProperty}
            />
          )}

          {activeTab === 'leads' && (
            <LeadsView
              leads={leads}
              onSaveLead={handleSaveLead}
              onDeleteLead={handleDeleteLead}
              onSimulateLead={handleSimulateLead}
            />
          )}

          {activeTab === 'history' && (
            <HistoryView
              history={history}
              onLoadSimulation={handleLoadSimulation}
              onDeleteSimulation={handleDeleteSimulation}
              onClearHistory={handleClearHistory}
              onGoToSimulator={() => setActiveTab('simulator')}
            />
          )}
        </main>

        {/* MOBILE BOTTOM TAB BAR */}
        <nav
          aria-label="Navegação inferior"
          className="fixed bottom-0 left-0 right-0 z-40 grid h-16 grid-cols-4 border-t border-slate-200 bg-white/95 backdrop-blur-md lg:hidden"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`flex min-h-[44px] flex-col items-center justify-center gap-0.5 text-[11px] font-semibold transition-colors ${
                  isActive ? 'text-[#089166]' : 'text-slate-500 hover:text-[#0B1622]'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="truncate">
                  {item.shortLabel}
                  {typeof item.count === 'number' ? ` (${item.count})` : ''}
                </span>
              </button>
            );
          })}
        </nav>

        {/* MODALS */}
        <ProposalModal
          isOpen={isProposalOpen}
          onClose={() => setIsProposalOpen(false)}
          input={simInput}
          result={simResult}
          broker={brokerProfile}
        />

        <BrokerProfileModal
          isOpen={isBrokerModalOpen}
          onClose={() => setIsBrokerModalOpen(false)}
          profile={brokerProfile}
          onSave={setBrokerProfile}
        />
      </div>

      {/* PRINT-ONLY A4 PROPOSAL */}
      <PrintableProposal input={simInput} result={simResult} broker={brokerProfile} />
    </>
  );
}
