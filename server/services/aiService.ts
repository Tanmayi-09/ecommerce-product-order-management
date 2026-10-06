import { GoogleGenAI } from '@google/genai';
import { db } from '../db/database.ts';
import { Product } from '../../shared/types.ts';

export interface AiMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AiAssistantResponse {
  message: string;
  recommendedProducts: Product[];
  suggestedQueries: string[];
}

export class AiService {
  private static getGeminiClient(): GoogleGenAI | null {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      return null;
    }
    return new GoogleGenAI({ apiKey });
  }

  public static async queryAssistant(
    userQuery: string,
    history: { role: string; content: string }[] = []
  ): Promise<AiAssistantResponse> {
    const allProducts = db.getProducts().filter((p) => p.status === 'ACTIVE');
    const catalogContext = allProducts.map((p) => ({
      id: p.productId,
      name: p.productName,
      category: p.category,
      price: `₹${p.price.toLocaleString('en-IN')}`,
      rawPrice: p.price,
      stock: p.stockQuantity,
      description: p.description,
    }));

    const client = this.getGeminiClient();

    if (client) {
      try {
        const prompt = `You are the smart AI Shopping Assistant for the "E-Commerce Product & Order Management System".
Help customers find the best tech and electronic products based on their questions, requirements, or budget.

RULES:
1. Only recommend and discuss products that ACTUALLY exist in the official store catalog provided below. DO NOT invent fake products, models, or stock numbers.
2. If the user asks for a price range, compare against rawPrice.
3. Keep the tone helpful, professional, and concise (2-4 sentences max per response).
4. Return a structured JSON response with exactly this format:
{
  "message": "Friendly response explaining the recommendations and why they match the user's needs.",
  "recommendedProductIds": ["PROD-101", ...],
  "suggestedQueries": ["Show laptops under ₹1,00,000", "What headphones have ANC?"]
}

OFFICIAL STORE CATALOG:
${JSON.stringify(catalogContext, null, 2)}

User Query:
${userQuery}

Recent Conversation History:
${history.slice(-4).map((h) => `${h.role}: ${h.content}`).join('\n')}
`;

        const response = await client.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });

        const text = response.text || '';
        const parsed = JSON.parse(text);

        const recommendedIds: string[] = Array.isArray(parsed.recommendedProductIds)
          ? parsed.recommendedProductIds
          : [];

        const recommendedProducts = allProducts.filter((p) =>
          recommendedIds.includes(p.productId)
        );

        return {
          message:
            parsed.message ||
            'Here are the products tailored to your preferences from our catalog.',
          recommendedProducts:
            recommendedProducts.length > 0 ? recommendedProducts : allProducts.slice(0, 3),
          suggestedQueries: Array.isArray(parsed.suggestedQueries)
            ? parsed.suggestedQueries
            : ['Best gaming accessories', 'Laptops for developers', 'Audio equipment'],
        };
      } catch (err) {
        console.warn('Gemini API call returned an error, falling back to catalog heuristics:', err);
      }
    }

    // Heuristic Fallback when GEMINI_API_KEY is not set or network is offline
    return this.fallbackHeuristic(userQuery, allProducts);
  }

  private static fallbackHeuristic(
    query: string,
    products: Product[]
  ): AiAssistantResponse {
    const q = query.toLowerCase();

    // Check for budget mentions
    const priceMatch = q.match(/(\d+[\d,]*)/);
    const budget = priceMatch ? parseInt(priceMatch[1].replace(/,/g, ''), 10) : null;

    let matched = products.filter((p) => {
      const nameMatch = p.productName.toLowerCase().includes(q) || q.includes(p.productName.toLowerCase());
      const catMatch = p.category.toLowerCase().includes(q) || q.includes(p.category.toLowerCase());
      const descMatch = p.description.toLowerCase().includes(q);

      // keywords
      const laptopKeywords = ['laptop', 'computer', 'mac', 'notebook', 'programming', 'code', 'dev'];
      const audioKeywords = ['headphone', 'audio', 'music', 'sound', 'anc', 'noise'];
      const monitorKeywords = ['monitor', 'screen', 'display', '4k', 'gaming'];
      const keyboardKeywords = ['keyboard', 'typing', 'mechanical', 'rgb'];
      const mouseKeywords = ['mouse', 'scroll', 'dpi'];
      const chargerKeywords = ['charger', 'charge', 'fast', 'gan', 'watt', '65w'];
      const watchKeywords = ['watch', 'smartwatch', 'fitness', 'health', 'heart'];

      const matchesKeyword =
        (laptopKeywords.some((k) => q.includes(k)) && p.category.includes('Laptops')) ||
        (audioKeywords.some((k) => q.includes(k)) && p.category.includes('Audio')) ||
        (monitorKeywords.some((k) => q.includes(k)) && p.category.includes('Monitors')) ||
        (keyboardKeywords.some((k) => q.includes(k)) && p.productName.toLowerCase().includes('keyboard')) ||
        (mouseKeywords.some((k) => q.includes(k)) && p.productName.toLowerCase().includes('mouse')) ||
        (chargerKeywords.some((k) => q.includes(k)) && p.category.includes('Chargers')) ||
        (watchKeywords.some((k) => q.includes(k)) && p.category.includes('Wearables'));

      return nameMatch || catMatch || descMatch || matchesKeyword;
    });

    if (budget && budget > 100) {
      matched = matched.filter((p) => p.price <= budget);
      if (matched.length === 0) {
        matched = products.filter((p) => p.price <= budget);
      }
    }

    if (matched.length === 0) {
      matched = products.slice(0, 3);
    }

    return {
      message: `I found ${matched.length} product(s) matching your request "${query}" in our real inventory. Available for direct multi-warehouse fulfillment.`,
      recommendedProducts: matched.slice(0, 4),
      suggestedQueries: [
        'Recommend laptops for coding',
        'Headphones under ₹15,000',
        'Show ergonomic accessories',
      ],
    };
  }
}
