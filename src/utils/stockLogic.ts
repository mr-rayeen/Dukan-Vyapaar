/**
 * Core Stock & Pack Size Conversion Logic
 * Stored internally as TOTAL LADI (units) for 100% mathematical accuracy.
 * Displayed everywhere as Boxes + Loose Ladi (बॉक्स + लड़ी).
 */

export interface CartonPieceSplit {
  cartons: number; // alias for boxes
  loosePieces: number; // alias for loose ladi
  boxes?: number;
  looseLadi?: number;
}

/**
 * Decompose total ladi into Boxes and Loose Ladi based on packSize (1 Box = X Ladi)
 */
export function decomposePieces(totalPieces: number, packSize: number): CartonPieceSplit {
  if (!packSize || packSize <= 0) packSize = 1;
  const safePieces = Math.max(0, Math.floor(totalPieces));
  const cartons = Math.floor(safePieces / packSize);
  const loosePieces = safePieces % packSize;
  return {
    cartons,
    loosePieces,
    boxes: cartons,
    looseLadi: loosePieces,
  };
}

/**
 * Combine Boxes and Loose Ladi into total ladi
 */
export function composePieces(cartons: number, loosePieces: number, packSize: number): number {
  if (!packSize || packSize <= 0) packSize = 1;
  const c = Math.max(0, Number(cartons) || 0);
  const p = Math.max(0, Number(loosePieces) || 0);
  return (c * packSize) + p;
}

/**
 * Format total ladi into shopkeeper readable string
 * e.g., "95 Box + 10 Ladi" or "1 Box + 0 Ladi"
 */
export function formatStock(totalPieces: number, packSize: number, lang: 'hi' | 'en' = 'en'): string {
  const { cartons, loosePieces } = decomposePieces(totalPieces, packSize);
  
  if (lang === 'hi') {
    if (cartons === 0 && loosePieces === 0) return 'स्टॉक खत्म (0 लड़ी)';
    return `${cartons} बॉक्स + ${loosePieces} लड़ी`;
  }
  
  if (totalPieces <= 0) return 'Out of Stock (0 Ladi)';
  return `${cartons} Box + ${loosePieces} Ladi`;
}

/**
 * Check if a product is below its low stock threshold
 */
export function isLowStock(totalPieces: number, lowStockThresholdPieces: number): boolean {
  return totalPieces <= (lowStockThresholdPieces || 0);
}

/**
 * Calculate line item total in billing
 */
export function calculateItemTotal(
  cartonQty: number, // boxQty
  pieceQty: number,  // ladiQty
  cartonPrice: number, // boxPrice
  piecePrice: number   // ladiPrice
): number {
  const cQty = Math.max(0, Number(cartonQty) || 0);
  const pQty = Math.max(0, Number(pieceQty) || 0);
  const cPrice = Math.max(0, Number(cartonPrice) || 0);
  const pPrice = Math.max(0, Number(piecePrice) || 0);
  return Math.round(((cQty * cPrice) + (pQty * pPrice)) * 100) / 100;
}

/**
 * Standard pack sizes (Ladi per Box) for quick one-tap selection
 */
export const STANDARD_PACK_SIZES = [6, 12, 24, 36, 48, 60, 100];

/**
 * Format item quantity for display and receipts:
 * - If no box (c === 0), only show Ladi (e.g., "5 Ladi"), no Box text.
 * - If no loose ladi (p === 0), only show Box (e.g., "2 Box").
 * - If both (c > 0 && p > 0), show "X Box + Y Ladi".
 */
export function formatItemQty(cartonQty: number, pieceQty: number): string {
  const c = Math.max(0, Number(cartonQty) || 0);
  const p = Math.max(0, Number(pieceQty) || 0);

  if (c > 0 && p > 0) {
    return `${c} Box + ${p} Ladi`;
  }
  if (c > 0 && p === 0) {
    return `${c} Box`;
  }
  if (c === 0 && p > 0) {
    return `${p} Ladi`;
  }
  return '0 Ladi';
}

export function formatItemQtyHindi(cartonQty: number, pieceQty: number): string {
  const c = Math.max(0, Number(cartonQty) || 0);
  const p = Math.max(0, Number(pieceQty) || 0);

  if (c > 0 && p > 0) {
    return `${c} बॉक्स + ${p} लड़ी`;
  }
  if (c > 0 && p === 0) {
    return `${c} बॉक्स`;
  }
  if (c === 0 && p > 0) {
    return `${p} लड़ी`;
  }
  return '0 लड़ी';
}
