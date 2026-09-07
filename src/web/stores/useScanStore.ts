import { create } from 'zustand';
import { StandardUnit } from '@frigo/domain';

export interface ScanDraftItem {
  id: string;
  rawName: string;
  canonicalId?: string;
  estimatedQuantity: number;
  unit: StandardUnit;
  confidence: number;
  storage: 'fridge' | 'freezer' | 'pantry';
  expiryDate?: string;
}

interface ScanState {
  imagePreviewUrl: string | null;
  imageBase64: string | null;
  scanType: 'fridge' | 'food' | 'receipt';
  isProcessing: boolean;
  statusText: string;
  scanId: string | null;
  items: ScanDraftItem[];
  setImage: (url: string, base64?: string) => void;
  setScanType: (type: 'fridge' | 'food' | 'receipt') => void;
  setProcessing: (processing: boolean, status?: string) => void;
  setScanResults: (scanId: string, items: ScanDraftItem[]) => void;
  updateItem: (id: string, updates: Partial<ScanDraftItem>) => void;
  addItem: (item: Omit<ScanDraftItem, 'id' | 'confidence'>) => void;
  removeItem: (id: string) => void;
  reset: () => void;
}

export const useScanStore = create<ScanState>((set) => ({
  imagePreviewUrl: null,
  imageBase64: null,
  scanType: 'fridge',
  isProcessing: false,
  statusText: '',
  scanId: null,
  items: [],

  setImage: (url, base64) => set({ imagePreviewUrl: url, imageBase64: base64 || null }),
  setScanType: (type) => set({ scanType: type }),
  setProcessing: (isProcessing, statusText = '') => set({ isProcessing, statusText }),
  setScanResults: (scanId, items) => set({ scanId, items, isProcessing: false }),

  updateItem: (id, updates) => set((state) => ({
    items: state.items.map((item) => item.id === id ? { ...item, ...updates } : item),
  })),

  addItem: (item) => set((state) => ({
    items: [
      ...state.items,
      {
        ...item,
        id: `draft_${Date.now()}_${Math.random()}`,
        confidence: 1.0,
      },
    ],
  })),

  removeItem: (id) => set((state) => ({
    items: state.items.filter((item) => item.id !== id),
  })),

  reset: () => set({
    imagePreviewUrl: null,
    imageBase64: null,
    isProcessing: false,
    statusText: '',
    scanId: null,
    items: [],
  }),
}));
