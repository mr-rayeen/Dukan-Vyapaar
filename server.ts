import http from 'http';
import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

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
      console.warn('GEMINI_API_KEY not configured, using smart OCR simulation response');
      return res.json({
        supplierName: 'Shree Ganesh Wholesale Distributors',
        invoiceNumber: 'GW-2026-904',
        invoiceDate: new Date().toISOString().split('T')[0],
        totalBillAmount: 18450,
        confidenceNotes: 'Sample simulated OCR bill items (Configure GEMINI_API_KEY in Secrets for live photo extraction).',
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
            suggestedPackSize: 48,
          },
          {
            productName: 'Tata Salt Vaccum Evaporated (1kg)',
            rawQuantityText: '5 Bags (Carton)',
            cartonQty: 5,
            pieceQty: 0,
            rate: 550,
            rateType: 'carton',
            totalAmount: 2750,
            confidence: 'medium',
            suggestedPackSize: 25,
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
            suggestedPackSize: 16,
          },
        ],
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    // Clean base64 data url prefix if present
    const cleanBase64 = imageBase64.includes(',')
      ? imageBase64.split(',')[1]
      : imageBase64;

    const promptText = `
You are an expert AI for Indian small shopkeepers, FMCG distributors, and wholesale traders.
Analyze this supplier invoice / purchase bill photo (it could be printed, handwritten, kaccha parchi, tax invoice, or challan).

Extract all line items accurately.
For each item:
1. Product Name: Clean standard product brand and name (e.g., 'Parle-G Biscuits', 'Fortune Mustard Oil 1L').
2. Carton Quantity: Number of Cartons / Boxes / Cases / Peti / Bags. If the bill specifies cartons/cases, extract the carton number. If it specifies pieces/units only, set cartonQty to 0 and put quantity in pieceQty.
3. Piece Quantity: Any loose pieces or single units (e.g. if '2 ctn 6 pcs', cartonQty is 2, pieceQty is 6).
4. Rate: The purchase rate as billed.
5. Rate Type: 'carton' or 'piece'.
6. Total Amount for that line item.
7. Suggested Pack Size: If the packaging indicates pieces per carton (e.g., '24x100g', '1x48', '12s', 'Case of 24'), detect the pack size number (like 12, 24, 48). Otherwise null.
8. Confidence: 'high', 'medium', or 'low' (set to 'low' if handwritten or blurry text).

Also extract supplierName, invoiceNumber, invoiceDate (YYYY-MM-DD format if possible), and totalBillAmount.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          inlineData: {
            mimeType,
            data: cleanBase64,
          },
        },
        {
          text: promptText,
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            supplierName: { type: Type.STRING },
            invoiceNumber: { type: Type.STRING },
            invoiceDate: { type: Type.STRING },
            totalBillAmount: { type: Type.NUMBER },
            confidenceNotes: { type: Type.STRING },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  productName: { type: Type.STRING },
                  rawQuantityText: { type: Type.STRING },
                  cartonQty: { type: Type.NUMBER },
                  pieceQty: { type: Type.NUMBER },
                  rate: { type: Type.NUMBER },
                  rateType: { type: Type.STRING },
                  totalAmount: { type: Type.NUMBER },
                  confidence: { type: Type.STRING },
                  suggestedPackSize: { type: Type.NUMBER },
                },
                required: ['productName', 'cartonQty', 'pieceQty', 'rate'],
              },
            },
          },
          required: ['supplierName', 'items'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error processing OCR bill:', error);
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
