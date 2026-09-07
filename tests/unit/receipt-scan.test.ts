import { describe, it, expect } from 'vitest';
import { ReceiptScanResultSchema, MockAIProvider, AIRouter } from '../../packages/ai/src/index';

describe('Receipt Scanner OCR & Schema Verification', () => {
  it('should validate structured receipt scan schema', () => {
    const validReceipt = {
      merchant_name: 'WinMart+ Landmark 81',
      invoice_number: 'HD-109283',
      purchase_date: '2026-09-05',
      total_amount_vnd: 198000,
      items: [
        {
          raw_name: 'Thịt ba chỉ CP 400g',
          estimated_quantity: 400,
          unit: 'g',
          unit_price_vnd: 68000,
          total_price_vnd: 68000,
          category: 'meat',
          storage: 'fridge',
          confidence: 0.98,
        },
        {
          raw_name: 'Trứng gà Ba Huân Hộp 10',
          estimated_quantity: 10,
          unit: 'piece',
          unit_price_vnd: 34000,
          total_price_vnd: 34000,
          category: 'egg',
          storage: 'fridge',
          confidence: 0.99,
        },
      ],
    };

    const parsed = ReceiptScanResultSchema.safeParse(validReceipt);
    expect(parsed.success).toBe(true);
  });

  it('should reject receipt with negative prices or invalid quantities', () => {
    const invalidReceipt = {
      merchant_name: 'Siêu thị ABC',
      items: [
        {
          raw_name: 'Sữa tươi',
          estimated_quantity: -5,
          unit: 'unknown_unit',
          unit_price_vnd: -1000,
          confidence: 2.0,
        },
      ],
    };

    const parsed = ReceiptScanResultSchema.safeParse(invalidReceipt);
    expect(parsed.success).toBe(false);
  });

  it('MockAIProvider should return realistic Vietnamese supermarket receipt', async () => {
    const mock = new MockAIProvider();
    const result = await mock.receiptScan({ imageBase64OrUrl: 'mock-receipt-data' });

    expect(result.merchant_name).toContain('WinMart');
    expect(result.items.length).toBeGreaterThanOrEqual(4);
    expect(result.total_amount_vnd).toBeGreaterThan(0);

    const names = result.items.map((i) => i.raw_name);
    expect(names.some((n) => n.includes('Thịt ba chỉ'))).toBe(true);
    expect(names.some((n) => n.includes('Trứng gà'))).toBe(true);
    expect(names.some((n) => n.includes('Cà chua'))).toBe(true);
  });

  it('AIRouter should support receiptScan method in mock mode', async () => {
    const router = new AIRouter({ aiMockMode: true });
    const result = await router.receiptScan({ imageBase64OrUrl: 'mock-receipt' });

    expect(result.merchant_name).toBeDefined();
    expect(result.items.length).toBeGreaterThan(0);
    expect(result.items[0].category).toBeDefined();
    expect(result.items[0].storage).toBeDefined();
  });
});
