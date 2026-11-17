import {DEFAULT_BROKER_PROFILE, SEED_LEADS, SEED_PROPERTIES} from '../data/banks';
import {BrokerProfile, LeadItem, PropertyItem, SavedSimulation} from '../types';

const KEYS = {
  PROPERTIES: 'imobsim_properties_v1',
  LEADS: 'imobsim_leads_v1',
  HISTORY: 'imobsim_history_v1',
  BROKER: 'imobsim_broker_v1',
};

function safeRead<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeWrite<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota errors safely
  }
}

export function loadProperties(): PropertyItem[] {
  const existing = safeRead<PropertyItem[] | null>(KEYS.PROPERTIES, null);
  if (existing === null) {
    safeWrite(KEYS.PROPERTIES, SEED_PROPERTIES);
    return SEED_PROPERTIES;
  }
  return existing;
}

export function saveProperties(items: PropertyItem[]): void {
  safeWrite(KEYS.PROPERTIES, items);
}

export function loadLeads(): LeadItem[] {
  const existing = safeRead<LeadItem[] | null>(KEYS.LEADS, null);
  if (existing === null) {
    safeWrite(KEYS.LEADS, SEED_LEADS);
    return SEED_LEADS;
  }
  return existing;
}

export function saveLeads(items: LeadItem[]): void {
  safeWrite(KEYS.LEADS, items);
}

export function loadHistory(): SavedSimulation[] {
  return safeRead<SavedSimulation[]>(KEYS.HISTORY, []);
}

export function saveHistory(items: SavedSimulation[]): void {
  safeWrite(KEYS.HISTORY, items);
}

export function loadBrokerProfile(): BrokerProfile {
  return safeRead<BrokerProfile>(KEYS.BROKER, DEFAULT_BROKER_PROFILE);
}

export function saveBrokerProfile(profile: BrokerProfile): void {
  safeWrite(KEYS.BROKER, profile);
}
