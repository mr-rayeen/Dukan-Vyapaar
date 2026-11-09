import { GoogleGenAI, ThinkingLevel } from '@google/genai';

export const config = {
  maxDuration: 60,
  api: {
    bodyParser: {
      sizeLimit: '30mb',
    },
  },
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const { imageBase64, mimeType = 'image/jpeg' } = body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'imageBase64 is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: 'Missing GEMINI_API_KEY',
        message: 'Please add GEMINI_API_KEY in Vercel/Netlify Environment Variables.',
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      apiVersion: 'v1beta',
      httpOptions: {
        apiVersion: 'v1beta',
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    let effectiveMimeType = mimeType;
    let cleanBase64 = imageBase64;
    if (imageBase64.includes(',')) {
      const [header, dataPart] = imageBase64.split(',');
      cleanBase64 = dataPart;
      const mimeMatch = header.match(/data:([^;]+);/);
      if (mimeMatch && mimeMatch[1]) {
        effectiveMimeType = mimeMatch[1];
      }
    }

    const promptText = `Extract all line items from this wholesale/retail purchase bill or estimate into a JSON object.
Return ONLY valid JSON with this exact structure:
{
  "supplierName": "Billed to / Supplier / Party name on bill",
  "invoiceNumber": "Bill or Estimate number if present, else EST-001",
  "invoiceDate": "YYYY-MM-DD",
  "totalBillAmount": 0,
  "items": [
    {
      "productName": "Exact item description from bill",
      "cartonQty": 10,
      "pieceQty": 0,
      "rate": 820,
      "rateType": "carton",
      "totalAmount": 8200,
      "suggestedPackSize": 21,
      "category": "Namkeen",
      "confidence": "high"
    }
  ]
}
Rules:
- Extract EVERY row in the table in exact order.
- QTY column is cartonQty (boxes/bags/peti), pieceQty is 0 unless loose pieces are specified.
- Price column is rate (rateType: "carton"), Amount column is totalAmount.
- For category, pick one of: "Namkeen", "Snacks & Chips", "Kurkure & Fryums", "Biscuit", "Confectionery", "Spices & Masala", "General".
- For suggestedPackSize, use 21 for Namkeen/Mixture/Peanut/Bhujia/Chips/Snacks unless another pack size is clear.`;

    const contentsPayload = {
      parts: [
        {
          inlineData: {
            mimeType: effectiveMimeType,
            data: cleanBase64,
          },
        },
        {
          text: promptText,
        },
      ],
    };

    const callModel = async (modelName: string, thinkingLevel: ThinkingLevel) => {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: contentsPayload,
        config: {
          responseMimeType: 'application/json',
          thinkingConfig: { thinkingLevel },
        },
      });
      const text = response?.text?.trim();
      if (!text) {
        throw new Error(`Empty response from ${modelName}`);
      }
      const cleaned = text
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
      const parsed = JSON.parse(cleaned);
      if (!parsed || !Array.isArray(parsed.items)) {
        throw new Error(`Invalid JSON structure from ${modelName}`);
      }
      return parsed;
    };

    let parsedResult: any = null;
    try {
      parsedResult = await Promise.any([
        callModel('gemini-3.1-flash-lite', ThinkingLevel.MINIMAL),
        callModel('gemini-3.8-flash', ThinkingLevel.LOW),
      ]);
    } catch {
      const fallbackRes = await ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: contentsPayload,
        config: {
          responseMimeType: 'application/json',
        },
      });
      const cleaned = (fallbackRes?.text || '{}')
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
      parsedResult = JSON.parse(cleaned);
    }

    return res.status(200).json(parsedResult);
  } catch (error: any) {
    return res.status(500).json({
      error: 'Failed to process supplier bill',
      message: error?.message || 'Unknown error',
    });
  }
}
