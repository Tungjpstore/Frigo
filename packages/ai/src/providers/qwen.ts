import { AIProvider, VisionScanParams } from '../types';
import { VisionScanResult, VisionScanResultSchema } from '../schemas';
import { findCanonicalIngredient } from '@frigo/domain';

export class QwenProvider implements AIProvider {
  name = 'qwen';
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl = 'https://dashscope.aliyuncs.com/compatible-mode/v1') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  async vision(params: VisionScanParams): Promise<VisionScanResult> {
    const prompt = params.promptOverride || `Bạn là chuyên gia nhận diện nguyên liệu thực phẩm trong tủ lạnh cho ứng dụng Frigo tại Việt Nam.
Hãy phân tích bức ảnh và trả về DUY NHẤT một JSON object hợp lệ theo định dạng:
{
  "items": [
    {
      "raw_name": "Tên tiếng Việt của nguyên liệu (ví dụ: Thịt ba chỉ, Trứng gà, Cà chua, Rau muống)",
      "estimated_quantity": 400,
      "unit": "g" hoặc "kg" hoặc "piece" hoặc "bunch" hoặc "pack" hoặc "ml" hoặc "l" hoặc "slice",
      "confidence": 0.95
    }
  ]
}
Chỉ trả về JSON thuần, không thêm markdown code block thừa.`;

    const imageUrl = params.imageBase64OrUrl.startsWith('http') || params.imageBase64OrUrl.startsWith('data:')
      ? params.imageBase64OrUrl
      : `data:${params.mimeType || 'image/jpeg'};base64,${params.imageBase64OrUrl}`;

    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: 'qwen-vl-plus',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: imageUrl } }
            ]
          }
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' }
      })
    });

    if (!res.ok) {
      throw new Error(`Qwen API error: ${res.status} ${await res.text()}`);
    }

    const data: any = await res.json();
    const rawContent = data.choices?.[0]?.message?.content;
    if (!rawContent) {
      throw new Error('Qwen returned empty response');
    }

    const parsed = JSON.parse(rawContent);
    const validated = VisionScanResultSchema.parse(parsed);

    // Annotate canonical IDs
    validated.items = validated.items.map(item => {
      const canonical = findCanonicalIngredient(item.raw_name);
      return {
        ...item,
        canonical_id: canonical?.id,
        category: canonical?.category || 'other',
        storage: 'fridge'
      };
    });

    return validated;
  }

  async normalizeIngredient(rawName: string): Promise<{ canonicalId: string | null; confidence: number }> {
    const canonical = findCanonicalIngredient(rawName);
    return {
      canonicalId: canonical?.id || null,
      confidence: canonical ? 0.95 : 0,
    };
  }

  async rankRecipes(recipeTitles: string[]): Promise<string[]> {
    return recipeTitles;
  }

  async chat(prompt: string): Promise<string> {
    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: 'qwen-plus',
        messages: [{ role: 'user', content: prompt }]
      })
    });
    const data: any = await res.json();
    return data.choices?.[0]?.message?.content || '';
  }
}
