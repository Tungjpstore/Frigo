import { VisionScanResult, ReceiptScanResult } from './schemas';

export interface VisionScanParams {
  imageBase64OrUrl: string;
  mimeType?: string;
  promptOverride?: string;
}

export interface AIProvider {
  name: string;
  vision(params: VisionScanParams): Promise<VisionScanResult>;
  receiptScan?(params: VisionScanParams): Promise<ReceiptScanResult>;
  normalizeIngredient(rawName: string): Promise<{ canonicalId: string | null; confidence: number }>;
  rankRecipes(recipeTitles: string[], userIngredients: string[]): Promise<string[]>;
  chat(prompt: string, context?: Record<string, unknown>): Promise<string>;
}

export interface AIConfig {
  aiMockMode?: boolean;
  // B4: when true (production default), a failed AI call surfaces an error
  // instead of returning fabricated fixture items that would pollute real inventory.
  silentFallback?: boolean;
  qwenApiKey?: string;
  qwenBaseUrl?: string;
  zaiApiKey?: string;
  zaiBaseUrl?: string;
  deepseekApiKey?: string;
  deepseekBaseUrl?: string;
  groqApiKey?: string;
  groqBaseUrl?: string;
  groqVisionModel?: string;
  aiGatewayUrl?: string;
  aiBinding?: any;
}
