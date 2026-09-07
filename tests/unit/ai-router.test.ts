import { describe, it, expect } from 'vitest';
import { VisionScanResultSchema, AIRouter, MockAIProvider } from '../../packages/ai/src/index';

describe('AI Router & Schema Verification', () => {
  it('should validate structured vision scan schema', () => {
    const validData = {
      items: [
        { raw_name: 'Thịt ba chỉ', estimated_quantity: 400, unit: 'g', confidence: 0.95 },
        { raw_name: 'Trứng gà', estimated_quantity: 6, unit: 'piece', confidence: 0.99 },
      ],
    };

    const parsed = VisionScanResultSchema.safeParse(validData);
    expect(parsed.success).toBe(true);
  });

  it('should reject invalid vision items', () => {
    const invalidData = {
      items: [
        { raw_name: '', estimated_quantity: -10, unit: 'unknown_unit', confidence: 2.5 },
      ],
    };

    const parsed = VisionScanResultSchema.safeParse(invalidData);
    expect(parsed.success).toBe(false);
  });

  it('MockAIProvider should return structured items matching required demo fixture', async () => {
    const mock = new MockAIProvider();
    const result = await mock.vision({ imageBase64OrUrl: 'mock-url' });
    expect(result.items.length).toBeGreaterThanOrEqual(5);

    const names = result.items.map(i => i.raw_name);
    expect(names).toContain('Thịt ba chỉ');
    expect(names).toContain('Trứng gà');
    expect(names).toContain('Cà chua');
    expect(names).toContain('Rau muống');
    expect(names).toContain('Đậu phụ');
  });

  it('AIRouter should fallback seamlessly in mock mode', async () => {
    const router = new AIRouter({ aiMockMode: true });
    const result = await router.vision({ imageBase64OrUrl: 'mock-image' });
    expect(result.items.length).toBe(5);
  });

  it('AIRouter should fail closed when production has no vision provider', async () => {
    const router = new AIRouter({ aiMockMode: false, silentFallback: true });
    await expect(router.vision({ imageBase64OrUrl: 'real-image' })).rejects.toThrow(
      'AI_SCAN_UNAVAILABLE'
    );
    await expect(router.receiptScan({ imageBase64OrUrl: 'real-receipt' })).rejects.toThrow(
      'AI_SCAN_UNAVAILABLE'
    );
    await expect(router.normalizeIngredient('Nguyên liệu không có trong danh mục')).rejects.toThrow(
      'AI_NORMALIZATION_UNAVAILABLE'
    );
    await expect(router.chat('Xin chào')).rejects.toThrow('AI_CHAT_UNAVAILABLE');
  });

  it('does not emit the invalid OTHER foreign-key sentinel for unknown ingredients', async () => {
    const mock = new MockAIProvider();
    await expect(mock.normalizeIngredient('Tên nguyên liệu lạ')).resolves.toEqual({
      canonicalId: null,
      confidence: 0,
    });
  });

  it('CloudflareAIProvider should parse real vision model JSON output', async () => {
    const { CloudflareAIProvider } = await import('../../packages/ai/src/providers/cloudflare');

    const fakeAiBinding = {
      run: async (model: string, _input: any) => {
        if (model.includes('vision')) {
          return {
            response: JSON.stringify({
              items: [
                { raw_name: 'Trứng gà', estimated_quantity: 10, unit: 'piece', confidence: 0.98, category: 'egg', storage: 'fridge' },
                { raw_name: 'Cá hồi Na Uy', estimated_quantity: 300, unit: 'g', confidence: 0.92, category: 'seafood', storage: 'freezer' },
              ]
            })
          };
        }
        return { response: 'Frigo tư vấn món ăn ngon' };
      }
    };

    const provider = new CloudflareAIProvider(fakeAiBinding);
    // 1x1 transparent GIF base64
    const testBase64 = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

    const scan = await provider.vision({ imageBase64OrUrl: testBase64 });
    expect(scan.items).toHaveLength(2);
    expect(scan.items[0].raw_name).toBe('Trứng gà');
    expect(scan.items[0].canonical_id).toBe('CHICKEN_EGG');
    expect(scan.items[1].raw_name).toBe('Cá hồi Na Uy');
    expect(scan.items[1].storage).toBe('freezer');
  });

  it('CloudflareAIProvider should parse real receipt model JSON output', async () => {
    const { CloudflareAIProvider } = await import('../../packages/ai/src/providers/cloudflare');

    const fakeAiBinding = {
      run: async (_model: string, _input: any) => ({
        response: JSON.stringify({
          merchant_name: 'Co.opmart Cống Quỳnh',
          invoice_number: 'COOP-88992',
          purchase_date: '2026-09-05',
          total_amount_vnd: 250000,
          items: [
            { raw_name: 'Thịt bò phi lê', estimated_quantity: 500, unit: 'g', unit_price_vnd: 180000, total_price_vnd: 180000, category: 'meat', storage: 'fridge' },
            { raw_name: 'Sữa tươi Dalat Milk', estimated_quantity: 1, unit: 'l', unit_price_vnd: 70000, total_price_vnd: 70000, category: 'dairy', storage: 'fridge' },
          ]
        })
      })
    };

    const provider = new CloudflareAIProvider(fakeAiBinding);
    const testBase64 = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

    const receipt = await provider.receiptScan({ imageBase64OrUrl: testBase64 });
    expect(receipt.merchant_name).toBe('Co.opmart Cống Quỳnh');
    expect(receipt.total_amount_vnd).toBe(250000);
    expect(receipt.items).toHaveLength(2);
    expect(receipt.items[0].raw_name).toBe('Thịt bò phi lê');
    expect(receipt.items[0].canonical_id).toBe('BEEF_SIRLOIN');
  });
});
