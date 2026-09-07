import { AIProvider, VisionScanParams } from '../types';
import { VisionScanResult } from '../schemas';
import { findCanonicalIngredient } from '@frigo/domain';

export class DeepSeekProvider implements AIProvider {
  name = 'deepseek';
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl = 'https://api.deepseek.com/v1') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  async vision(_params: VisionScanParams): Promise<VisionScanResult> {
    throw new Error('DeepSeek is specialized for reasoning/text ranking, vision not supported');
  }

  async normalizeIngredient(rawName: string): Promise<{ canonicalId: string | null; confidence: number }> {
    const canonical = findCanonicalIngredient(rawName);
    return {
      canonicalId: canonical?.id || null,
      confidence: canonical ? 0.95 : 0,
    };
  }

  async rankRecipes(recipeTitles: string[], userIngredients: string[]): Promise<string[]> {
    const prompt = `Bạn là AI Chef của Frigo. Người dùng có các nguyên liệu sau: ${userIngredients.join(', ')}.
Danh sách các món ăn tiềm năng:
${recipeTitles.map((t, idx) => `${idx + 1}. ${t}`).join('\n')}

Hãy xếp hạng lại các món ăn này từ phù hợp nhất đến ít phù hợp nhất để tận dụng tối đa nguyên liệu và ngon miệng.
Trả về danh sách dưới dạng JSON array of strings chính xác tên món: ["Món 1", "Món 2", ...]`;

    try {
      const res = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.2
        })
      });

      if (!res.ok) return recipeTitles;
      const data: any = await res.json();
      let content = data.choices?.[0]?.message?.content || '';
      content = content.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(content);
      return Array.isArray(parsed) ? parsed : recipeTitles;
    } catch {
      return recipeTitles;
    }
  }

  async chat(prompt: string, context?: Record<string, unknown>): Promise<string> {
    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'Bạn là đầu bếp AI thông minh của ứng dụng Frigo Việt Nam. Luôn trả lời ngắn gọn, thân thiện, súc tích.'
          },
          {
            role: 'user',
            content: context ? `${JSON.stringify(context)}\n\n${prompt}` : prompt
          }
        ]
      })
    });
    const data: any = await res.json();
    return data.choices?.[0]?.message?.content || '';
  }
}
