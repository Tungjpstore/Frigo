import { AIConfig, AIProvider, VisionScanParams } from './types';
import { VisionScanResult, AIUsageLog } from './schemas';
import { MockAIProvider } from './providers/mock';
import { QwenProvider } from './providers/qwen';
import { GLMProvider } from './providers/glm';
import { DeepSeekProvider } from './providers/deepseek';
import { CloudflareAIProvider } from './providers/cloudflare';
import { GroqProvider, GROQ_DEFAULT_VISION_MODEL } from './providers/groq';
import { findCanonicalIngredient } from '@frigo/domain';
import { configuredPlanningPresentationProvider } from './planning-presentation';

export class AIRouter {
  private config: AIConfig;
  private primaryVisionProvider?: AIProvider;
  private visionProviders: AIProvider[] = [];
  private recipeRankProvider?: AIProvider;
  private mockProvider: MockAIProvider;
  private silentFallback: boolean;
  private onUsageLogged?: (log: AIUsageLog) => void;

  planningPresentationProvider() {
    return configuredPlanningPresentationProvider(this.config);
  }

  constructor(config: AIConfig, onUsageLogged?: (log: AIUsageLog) => void) {
    this.config = config;
    this.onUsageLogged = onUsageLogged;
    this.mockProvider = new MockAIProvider();
    this.silentFallback = config.silentFallback !== false; // default ON (fail loudly)

    if (!config.aiMockMode) {
      // Keep provider order explicit: paid/free external vision first, then
      // the native Workers AI binding, then configured compatible fallbacks.
      if (config.groqApiKey) {
        this.visionProviders.push(new GroqProvider(config.groqApiKey, config.groqBaseUrl, config.groqVisionModel));
      }
      if (config.aiBinding) this.visionProviders.push(new CloudflareAIProvider(config.aiBinding));
      if (config.qwenApiKey) this.visionProviders.push(new QwenProvider(config.qwenApiKey, config.qwenBaseUrl));
      if (config.zaiApiKey) this.visionProviders.push(new GLMProvider(config.zaiApiKey, config.zaiBaseUrl));
      this.primaryVisionProvider = this.visionProviders[0];
      if (config.deepseekApiKey) {
        this.recipeRankProvider = new DeepSeekProvider(config.deepseekApiKey, config.deepseekBaseUrl);
      }
    }
  }

  async vision(params: VisionScanParams): Promise<VisionScanResult> {
    const startTime = Date.now();

    // Mock data is allowed only when explicitly enabled. A missing provider in
    // production must fail closed instead of fabricating inventory items.
    if (this.config.aiMockMode) {
      const result = await this.mockProvider.vision(params);
      this.logUsage({
        task: 'fridge_scan',
        provider: 'mock',
        model: 'mock-vision',
        inputTokens: 0,
        outputTokens: 0,
        latencyMs: Date.now() - startTime,
        estimatedCost: 0,
        status: 'success',
        createdAt: new Date().toISOString()
      });
      return result;
    }

    if (this.visionProviders.length === 0) {
      if (!this.silentFallback) {
        const result = await this.mockProvider.vision(params);
        this.logUsage({
          task: 'fridge_scan',
          provider: 'mock-fallback',
          model: 'mock-vision',
          inputTokens: 0,
          outputTokens: 0,
          latencyMs: Date.now() - startTime,
          estimatedCost: 0,
          status: 'fallback',
          createdAt: new Date().toISOString()
        });
        return result;
      }
      throw new Error(
        'AI_SCAN_UNAVAILABLE: Không có nhà cung cấp AI phân tích ảnh được cấu hình.'
      );
    }

    // Try every configured provider in deterministic priority order.
    const providerErrors: string[] = [];
    for (let index = 0; index < this.visionProviders.length; index += 1) {
      const provider = this.visionProviders[index];
      try {
        const result = await provider.vision(params);
        this.logUsage({
          task: 'fridge_scan',
          provider: provider.name,
          model: this.modelFor(provider),
          inputTokens: 1000,
          outputTokens: 200,
          latencyMs: Date.now() - startTime,
          estimatedCost: 0.0015,
          status: index === 0 ? 'success' : 'fallback',
          createdAt: new Date().toISOString()
        });
        return result;
      } catch (providerErr) {
        const detail = providerErr instanceof Error ? providerErr.message.slice(0, 240) : String(providerErr).slice(0, 240);
        providerErrors.push(`${provider.name}/${this.modelFor(provider)}: ${detail}`);
        console.warn(`${provider.name} vision provider failed (${this.modelFor(provider)}): ${detail}`);
      }
    }

    // 4. Ultimate fallback: mock fixture ONLY when silentFallback is disabled
    // (dev/testing). In production we fail loudly — fabricated items must never
    // silently enter a real household inventory (B4).
    if (!this.silentFallback) {
      console.warn('All vision providers failed, falling back to mock fixture');
      const mockResult = await this.mockProvider.vision(params);
      this.logUsage({
        task: 'fridge_scan',
        provider: 'mock-fallback',
        model: 'mock-vision',
        inputTokens: 0,
        outputTokens: 0,
        latencyMs: Date.now() - startTime,
        estimatedCost: 0,
        status: 'fallback',
        createdAt: new Date().toISOString()
      });
      return mockResult;
    }

    throw new Error(`AI_SCAN_UNAVAILABLE: Không thể phân tích ảnh lúc này. Vui lòng thử lại hoặc nhập thủ công.${providerErrors.length ? ` (${providerErrors.join(' | ').slice(0, 700)})` : ''}`);
  }

  async receiptScan(params: VisionScanParams): Promise<import('./schemas').ReceiptScanResult> {
    const startTime = Date.now();

    if (this.config.aiMockMode) {
      const result = await this.mockProvider.receiptScan(params);
      this.logUsage({
        task: 'receipt_scan',
        provider: 'mock',
        model: 'mock-receipt',
        inputTokens: 0,
        outputTokens: 0,
        latencyMs: Date.now() - startTime,
        estimatedCost: 0,
        status: 'success',
        createdAt: new Date().toISOString()
      });
      return result;
    }

    const providerErrors: string[] = [];
    if (!this.config.aiMockMode) {
      for (let index = 0; index < this.visionProviders.length; index += 1) {
        const provider = this.visionProviders[index];
        if (!provider.receiptScan) continue;
        try {
          const result = await provider.receiptScan(params);
          this.logUsage({
            task: 'receipt_scan',
            provider: provider.name,
            model: this.modelFor(provider),
            inputTokens: 1500,
            outputTokens: 300,
            latencyMs: Date.now() - startTime,
            estimatedCost: 0.001,
            status: index === 0 ? 'success' : 'fallback',
            createdAt: new Date().toISOString()
          });
          return result;
        } catch (err) {
          const detail = err instanceof Error ? err.message.slice(0, 240) : String(err).slice(0, 240);
          providerErrors.push(`${provider.name}/${this.modelFor(provider)}: ${detail}`);
          console.warn(`${provider.name} receipt scan failed (${this.modelFor(provider)}), trying fallback: ${detail}`);
        }
      }
    }

    // B4: same fail-loudly policy as fridge scan in production
    if (this.silentFallback) {
      throw new Error(`AI_SCAN_UNAVAILABLE: Không thể đọc hóa đơn lúc này. Vui lòng thử lại hoặc nhập thủ công.${providerErrors.length ? ` (${providerErrors.join(' | ').slice(0, 700)})` : ''}`);
    }

    const result = await this.mockProvider.receiptScan(params);
    this.logUsage({
      task: 'receipt_scan',
      provider: 'mock',
      model: 'mock-receipt',
      inputTokens: 0,
      outputTokens: 0,
      latencyMs: Date.now() - startTime,
      estimatedCost: 0,
      status: 'fallback',
      createdAt: new Date().toISOString()
    });
    return result;
  }

  async normalizeIngredient(rawName: string): Promise<{ canonicalId: string | null; confidence: number }> {
    const deterministic = findCanonicalIngredient(rawName);
    if (deterministic) return { canonicalId: deterministic.id, confidence: 1 };
    if (this.config.aiMockMode) return this.mockProvider.normalizeIngredient(rawName);

    const providers = [this.primaryVisionProvider, this.recipeRankProvider].filter(
      (provider): provider is AIProvider => Boolean(provider)
    );
    for (const provider of providers) {
      try {
        return await provider.normalizeIngredient(rawName);
      } catch {
        // Never turn a failed provider call into a fabricated canonical id.
      }
    }
    throw new Error('AI_NORMALIZATION_UNAVAILABLE: Không thể chuẩn hóa nguyên liệu lúc này.');
  }

  async rankRecipes(recipeTitles: string[], userIngredients: string[]): Promise<string[]> {
    if (this.recipeRankProvider) {
      try {
        return await this.recipeRankProvider.rankRecipes(recipeTitles, userIngredients);
      } catch (err) {
        console.warn('Recipe rank provider failed, falling back to deterministic order:', err);
      }
    }
    return recipeTitles;
  }

  async chat(prompt: string, context?: Record<string, unknown>): Promise<string> {
    if (this.config.aiMockMode) return this.mockProvider.chat(prompt);
    if (!this.config.aiMockMode && this.primaryVisionProvider) {
      try {
        return await this.primaryVisionProvider.chat(prompt, context);
      } catch {
        // fallback
      }
    }
    if (this.recipeRankProvider) {
      try {
        return await this.recipeRankProvider.chat(prompt, context);
      } catch {
        // fallback
      }
    }
    throw new Error('AI_CHAT_UNAVAILABLE: Không có nhà cung cấp AI hội thoại được cấu hình.');
  }

  private logUsage(log: AIUsageLog) {
    if (this.onUsageLogged) {
      this.onUsageLogged(log);
    }
  }

  private modelFor(provider: AIProvider): string {
    switch (provider.name) {
      case 'groq': return this.config.groqVisionModel || GROQ_DEFAULT_VISION_MODEL;
      case 'cloudflare': return '@cf/meta/llama-3.2-11b-vision-instruct';
      case 'qwen': return 'qwen-vl-plus';
      case 'glm': return 'glm-4v';
      default: return 'unknown';
    }
  }
}
