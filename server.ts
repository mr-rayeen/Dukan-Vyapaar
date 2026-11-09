import http from 'http';
import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = http.createServer(app);
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '30mb' }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'DukaanVyapar Server' });
});

// Gemini OCR Purchase Bill Extraction
app.post('/api/ocr-bill', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg' } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'imageBase64 is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.json({
        supplierName: 'Shree Ganesh Wholesale Distributors',
        invoiceNumber: 'GW-2026-904',
        invoiceDate: new Date().toISOString().split('T')[0],
        totalBillAmount: 18450,
        confidenceNotes: 'Sample simulated OCR bill items.',
        items: [
          {
            productName: 'Parle-G Gold Biscuits (100g)',
            rawQuantityText: '10 Cartons',
            cartonQty: 10,
            pieceQty: 0,
            rate: 288,
            rateType: 'carton',
            totalAmount: 2880,
            confidence: 'high',
            suggestedPackSize: 24,
          },
          {
            productName: 'Maggi 2-Minute Noodles (70g)',
            rawQuantityText: '15 Cartons',
            cartonQty: 15,
            pieceQty: 0,
            rate: 672,
            rateType: 'carton',
            totalAmount: 10080,
            confidence: 'high',
            suggestedPackSize: 21,
          },
          {
            productName: 'Tata Salt Vacuum Evaporated (1kg)',
            rawQuantityText: '5 Bags (Carton)',
            cartonQty: 5,
            pieceQty: 0,
            rate: 550,
            rateType: 'carton',
            totalAmount: 2750,
            confidence: 'medium',
            suggestedPackSize: 10,
          },
          {
            productName: 'Dettol Original Soap (75g)',
            rawQuantityText: '4 Cartons + 6 Pcs',
            cartonQty: 4,
            pieceQty: 6,
            rate: 620,
            rateType: 'carton',
            totalAmount: 2740,
            confidence: 'low',
            suggestedPackSize: 12,
          },
        ],
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

    // Clean base64 data url prefix if present and detect actual mimeType
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

    // Race gemini-3.1-flash-lite (MINIMAL thinking) and gemini-3.8-flash (LOW thinking) in parallel
    // so whichever responds first wins immediately (typically 3-6 seconds even for 25-item bills).
    let parsedResult: any = null;
    try {
      parsedResult = await Promise.any([
        callModel('gemini-3.1-flash-lite', ThinkingLevel.MINIMAL),
        callModel('gemini-3.8-flash', ThinkingLevel.LOW),
      ]);
    } catch (aggregateErr: any) {
      // Final fallback to gemini-flash-latest without thinkingConfig
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

    return res.json(parsedResult);
  } catch (error: any) {
    return res.status(500).json({
      error: 'Failed to process supplier bill',
      message: error?.message || 'Unknown error',
    });
  }
});

// Dev / Prod static serving
if (process.env.NODE_ENV !== 'production') {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: {
      middlewareMode: true,
      hmr: false,
      watch: null,
    },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
}

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`DukaanVyapar server running on http://0.0.0.0:${PORT}`);
});
