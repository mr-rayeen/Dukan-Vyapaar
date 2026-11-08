import jsPDF from 'jspdf';
import { Bill, ShopSettings } from '../types';

/**
 * GST State Code Map for standard Indian states
 */
const GST_STATE_MAP: Record<string, string> = {
  '01': 'Jammu & Kashmir (01)',
  '02': 'Himachal Pradesh (02)',
  '03': 'Punjab (03)',
  '04': 'Chandigarh (04)',
  '05': 'Uttarakhand (05)',
  '06': 'Haryana (06)',
  '07': 'Delhi (07)',
  '08': 'Rajasthan (08)',
  '09': 'Uttar Pradesh (09)',
  '10': 'Bihar (10)',
  '11': 'Sikkim (11)',
  '19': 'West Bengal (19)',
  '20': 'Jharkhand (20)',
  '21': 'Odisha (21)',
  '22': 'Chhattisgarh (22)',
  '23': 'Madhya Pradesh (23)',
  '24': 'Gujarat (24)',
  '27': 'Maharashtra (27)',
  '29': 'Karnataka (29)',
  '32': 'Kerala (32)',
  '33': 'Tamil Nadu (33)',
  '36': 'Telangana (36)',
  '37': 'Andhra Pradesh (37)',
};

/**
 * Helper to draw dashed lines safely across all jsPDF versions
 */
function drawDashedHLine(
  doc: jsPDF,
  startX: number,
  endX: number,
  y: number,
  dash: number = 2,
  gap: number = 1.5
): void {
  let curX = startX;
  while (curX < endX) {
    const nextX = Math.min(curX + dash, endX);
    doc.line(curX, y, nextX, y);
    curX = nextX + gap;
  }
}

/**
 * Determine Place of Supply based on GSTIN or address
 */
function getPlaceOfSupply(settings: ShopSettings): string {
  if (settings.gstNumber && settings.gstNumber.length >= 2) {
    const code = settings.gstNumber.substring(0, 2);
    if (GST_STATE_MAP[code]) {
      return GST_STATE_MAP[code];
    }
  }

  // Check state mentioned in address
  const addr = (settings.address || '').toLowerCase();
  if (addr.includes('uttar pradesh') || addr.includes('up') || addr.includes('farrukhabad')) {
    return 'Uttar Pradesh (09)';
  }
  if (addr.includes('delhi')) return 'Delhi (07)';
  if (addr.includes('bihar')) return 'Bihar (10)';
  if (addr.includes('madhya pradesh') || addr.includes('mp')) return 'Madhya Pradesh (23)';
  if (addr.includes('maharashtra')) return 'Maharashtra (27)';
  if (addr.includes('rajasthan')) return 'Rajasthan (08)';

  return 'Uttar Pradesh (09)';
}

/**
 * Render a complete invoice copy block (Header, Details, Items Table, Totals, Footer)
 */
function renderInvoiceBlock(
  doc: jsPDF,
  bill: Bill,
  settings: ShopSettings,
  copyLabel: string, // e.g. 'ORIGINAL / STORE COPY' or 'DUPLICATE / CUSTOMER COPY'
  startY: number,
  isHalfPage: boolean
): number {
  const leftX = 14;
  const rightX = 196;
  const centerX = 105;

  let y = startY;

  // 1. Top Tags: TAX INVOICE (Left) & COPY TYPE (Right)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(isHalfPage ? 6.5 : 7.5);
  doc.setTextColor(100, 116, 139); // Slate 500
  doc.text('TAX INVOICE', leftX, y);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59); // Slate 800
  doc.text(copyLabel, rightX, y, { align: 'right' });
  y += isHalfPage ? 4.5 : 6;

  // 2. Shop Header (Centered, bold emerald green title)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(isHalfPage ? 12 : 15);
  doc.setTextColor(4, 120, 87); // Emerald 700 (#047857)
  doc.text(settings.shopName || 'S S Point Namkeen & Confectionery', centerX, y, { align: 'center' });
  y += isHalfPage ? 4 : 5;

  // Tagline
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(isHalfPage ? 7.5 : 8.5);
  doc.setTextColor(71, 85, 105); // Slate 600
  doc.text(settings.tagline || 'Wholesale & Retail Groceries', centerX, y, { align: 'center' });
  y += isHalfPage ? 3.5 : 4.5;

  // Address & Phone
  const addrText = `${settings.address || 'Farrukhabad'} | Mob: ${settings.phone || ''}`;
  doc.text(addrText, centerX, y, { align: 'center' });

  // GSTIN
  if (settings.gstNumber) {
    y += isHalfPage ? 3.5 : 4.5;
    doc.text(`GSTIN: ${settings.gstNumber}`, centerX, y, { align: 'center' });
  }

  y += isHalfPage ? 2.5 : 4;

  // 3. Solid Green Line Separator
  doc.setDrawColor(4, 120, 87); // Emerald 700
  doc.setLineWidth(0.4);
  doc.line(leftX, y, rightX, y);
  y += isHalfPage ? 4 : 5.5;

  // 4. Invoice & Customer Metadata Grid
  doc.setFontSize(isHalfPage ? 7.5 : 8.5);

  // Left Column
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42); // Slate 900
  doc.text(`INVOICE: ${bill.billNumber}`, leftX, y);

  // Right Column: Date
  const dateObj = new Date(bill.createdAt);
  const formattedDate = `${dateObj.toLocaleDateString('en-US')} ${dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  doc.text(`Date: ${formattedDate}`, rightX, y, { align: 'right' });
  y += isHalfPage ? 3.8 : 4.8;

  // Customer Name & Place of Supply
  doc.text(`Customer: ${bill.customerName || 'Cash Customer'}`, leftX, y);
  const placeOfSupply = getPlaceOfSupply(settings);
  doc.text(`Place of Supply: ${placeOfSupply}`, rightX, y, { align: 'right' });
  y += isHalfPage ? 3.8 : 4.8;

  // Payment Status
  const isUdhar = bill.paymentMethod === 'udhar';
  const paid = bill.paidAmount || (bill.isUdharPaid ? bill.totalAmount : 0);
  const remaining = Math.max(0, bill.totalAmount - paid);
  const isFullyPaid = !isUdhar || bill.isUdharPaid || remaining === 0;

  let paymentText = 'Payment: CASH';
  if (bill.paymentMethod === 'upi') {
    paymentText = 'Payment: UPI ONLINE';
  } else if (isUdhar) {
    if (isFullyPaid) {
      paymentText = 'Payment: UDHAR (FULLY SETTLED)';
    } else if (paid > 0) {
      paymentText = `Payment: UDHAR (PART PAID: Rs. ${paid.toFixed(2)} | DUE: Rs. ${remaining.toFixed(2)})`;
    } else {
      paymentText = 'Payment: UDHAR (UNPAID)';
    }
  }

  if (isUdhar && !isFullyPaid) {
    doc.setTextColor(225, 29, 72); // Rose 600
  } else {
    doc.setTextColor(4, 120, 87); // Emerald 700
  }
  doc.text(paymentText, leftX, y);

  if (bill.customerPhone) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`Mob: ${bill.customerPhone}`, rightX, y, { align: 'right' });
  }

  y += isHalfPage ? 2.5 : 4;

  // Dashed separator below metadata
  doc.setDrawColor(203, 213, 225); // Slate 300
  doc.setLineWidth(0.2);
  drawDashedHLine(doc, leftX, rightX, y, 1.8, 1.2);
  y += isHalfPage ? 3.5 : 5;

  // 5. Table Header
  // Columns: # (14), Item Description (24), Pack Size (115), Quantity (148), Amount (196 right)
  const colIndex = 14;
  const colDesc = 24;
  const colPack = 118;
  const colQty = 150;
  const colAmt = 196;

  // Line above table header
  doc.setDrawColor(226, 232, 240); // Slate 200
  doc.line(leftX, y, rightX, y);
  y += isHalfPage ? 3.2 : 4.5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(isHalfPage ? 7 : 8);
  doc.setTextColor(51, 65, 85); // Slate 700
  doc.text('#', colIndex, y);
  doc.text('Item Description', colDesc, y);
  doc.text('Pack Size', colPack, y);
  doc.text('Quantity', colQty, y);
  doc.text('Amount', colAmt, y, { align: 'right' });
  y += isHalfPage ? 1.5 : 2;

  // Line below table header
  doc.setDrawColor(203, 213, 225);
  doc.line(leftX, y, rightX, y);
  y += isHalfPage ? 3.8 : 5;

  // 6. Items Table Rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(isHalfPage ? 7 : 8);
  doc.setTextColor(15, 23, 42);

  let totalQtySummaryLadi = 0;
  let totalBoxes = 0;

  bill.items.forEach((item, idx) => {
    // Column #
    doc.text(`${idx + 1}`, colIndex, y);

    // Item Description (uppercase, clipped if needed)
    const rawName = item.productName.toUpperCase();
    const maxChars = isHalfPage ? 46 : 56;
    const descText = rawName.length > maxChars ? `${rawName.substring(0, maxChars - 2)}..` : rawName;
    doc.text(descText, colDesc, y);

    // Pack Size
    const packSizeText = item.cartonQty > 0 ? `1 Box = ${item.packSize} Ladi` : '-';
    doc.text(packSizeText, colPack, y);

    // Quantity
    let qtyDisplay = '';
    if (item.cartonQty > 0 && item.pieceQty > 0) {
      qtyDisplay = `${item.cartonQty} Box + ${item.pieceQty} Ladi`;
      totalBoxes += item.cartonQty;
      totalQtySummaryLadi += (item.cartonQty * item.packSize) + item.pieceQty;
    } else if (item.cartonQty > 0) {
      qtyDisplay = `${item.cartonQty} Box`;
      totalBoxes += item.cartonQty;
      totalQtySummaryLadi += item.cartonQty * item.packSize;
    } else {
      qtyDisplay = `${item.pieceQty} Ladi`;
      totalQtySummaryLadi += item.pieceQty;
    }
    doc.text(qtyDisplay, colQty, y);

    // Amount
    doc.text(`Rs. ${item.totalAmount.toFixed(2)}`, colAmt, y, { align: 'right' });

    y += isHalfPage ? 4.2 : 5.5;
  });

  // Table bottom border
  y += isHalfPage ? 0.5 : 1.5;
  doc.setDrawColor(226, 232, 240);
  doc.line(leftX, y, rightX, y);
  y += isHalfPage ? 3.5 : 4.5;

  // 7. Summary & Totals
  // Left: Total items & Quantity breakdown
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(isHalfPage ? 6.5 : 7.5);
  doc.setTextColor(71, 85, 105);

  let qtyString = `${totalQtySummaryLadi} Ladi`;
  if (totalBoxes > 0) {
    qtyString = `${totalBoxes} Box (${totalQtySummaryLadi} Ladi)`;
  }
  doc.text(`Total Items: ${bill.items.length}  |  Total Qty: ${qtyString}`, leftX, y);

  // Right: Subtotal & Grand Total
  doc.setFontSize(isHalfPage ? 7.5 : 8.5);
  doc.setTextColor(51, 65, 85);
  doc.text('Subtotal:', 160, y, { align: 'right' });
  doc.setFont('helvetica', 'bold');
  doc.text(`Rs. ${bill.subtotal.toFixed(2)}`, colAmt, y, { align: 'right' });
  y += isHalfPage ? 3.8 : 4.8;

  if (bill.discount > 0) {
    doc.setFont('helvetica', 'normal');
    doc.text('Discount:', 160, y, { align: 'right' });
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(225, 29, 72);
    doc.text(`- Rs. ${bill.discount.toFixed(2)}`, colAmt, y, { align: 'right' });
    y += isHalfPage ? 3.8 : 4.8;
  }

  // Grand Total in Emerald Green
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(isHalfPage ? 8.5 : 10);
  doc.setTextColor(4, 120, 87); // Emerald 700
  doc.text('Grand Total:', 160, y, { align: 'right' });
  doc.text(`Rs. ${bill.totalAmount.toFixed(2)}`, colAmt, y, { align: 'right' });
  y += isHalfPage ? 3.5 : 4.5;

  // If Udhar: show paid and remaining balance
  if (isUdhar) {
    doc.setFontSize(isHalfPage ? 7 : 8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(13, 148, 136); // Teal 600
    doc.text('Paid Amount:', 160, y, { align: 'right' });
    doc.text(`Rs. ${paid.toFixed(2)}`, colAmt, y, { align: 'right' });
    y += isHalfPage ? 3.2 : 4;

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(remaining > 0 ? 225 : 4, remaining > 0 ? 29 : 120, remaining > 0 ? 72 : 87);
    doc.text('Balance Due:', 160, y, { align: 'right' });
    doc.text(`Rs. ${remaining.toFixed(2)}`, colAmt, y, { align: 'right' });
    y += isHalfPage ? 3.2 : 4;
  }

  // 8. Footer Notes (Centered)
  y += isHalfPage ? 1 : 2;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(isHalfPage ? 6 : 7);
  doc.setTextColor(100, 116, 139); // Slate 500
  doc.text('Goods once sold will not be taken back or exchanged.', centerX, y, { align: 'center' });
  y += isHalfPage ? 3 : 3.8;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(isHalfPage ? 6.5 : 7.5);
  doc.setTextColor(30, 41, 59);
  doc.text('Thank You for Shopping With Us!', centerX, y, { align: 'center' });

  // For full-page copies, add Authorized Signatory block at bottom right
  if (!isHalfPage) {
    y += 12;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`For ${settings.shopName || 'Retail Store'}:`, rightX, y, { align: 'right' });
    y += 10;
    doc.text('Authorized Signatory', rightX, y, { align: 'right' });
  }

  return y;
}

/**
 * Draw scissors and cutting dashed line in the middle of A4
 */
function drawCutDivider(doc: jsPDF, y: number): void {
  const leftX = 14;
  const rightX = 196;
  const centerX = 105;

  doc.setDrawColor(148, 163, 184); // Slate 400
  doc.setLineWidth(0.25);

  // Left dashed segment
  drawDashedHLine(doc, leftX, centerX - 35, y, 2.5, 1.8);

  // Center Cut Indicator
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('✂  CUT HERE / CUSTOMER COPY  ✂', centerX, y + 1, { align: 'center' });

  // Right dashed segment
  drawDashedHLine(doc, centerX + 35, rightX, y, 2.5, 1.8);
}

/**
 * Main PDF Generation Entry Point (A4 Size)
 *
 * Mode 1: <= 7 items: Both 'ORIGINAL / STORE COPY' and 'DUPLICATE / CUSTOMER COPY'
 *         fit on a single A4 page with a middle cutting dashed line (matching user screenshot!).
 *
 * Mode 2: > 7 items: Creates separate pages for 'ORIGINAL / STORE COPY' and
 *         'DUPLICATE / CUSTOMER COPY' so rows have plenty of breathing room.
 */
export function generateBillPDF(bill: Bill, settings: ShopSettings): void {
  const doc = new jsPDF({
    unit: 'mm',
    format: 'a4', // Standard A4 (210mm x 297mm)
    orientation: 'portrait',
  });

  const itemCount = bill.items.length;
  // If items <= 7, fit both copies on single A4 page with middle cut line
  const canFitBothOnSingleA4 = itemCount <= 7;

  if (canFitBothOnSingleA4) {
    // -------------------------------------------------------------
    // TOP HALF: ORIGINAL / STORE COPY
    // -------------------------------------------------------------
    renderInvoiceBlock(
      doc,
      bill,
      settings,
      'ORIGINAL / STORE COPY',
      10, // Top margin
      true // Half page mode
    );

    // -------------------------------------------------------------
    // MIDDLE: CUT LINE
    // -------------------------------------------------------------
    const midY = 148.5; // Exactly half of 297mm
    drawCutDivider(doc, midY);

    // -------------------------------------------------------------
    // BOTTOM HALF: DUPLICATE / CUSTOMER COPY
    // -------------------------------------------------------------
    renderInvoiceBlock(
      doc,
      bill,
      settings,
      'DUPLICATE / CUSTOMER COPY',
      midY + 4, // Starts at ~152.5mm
      true // Half page mode
    );
  } else {
    // -------------------------------------------------------------
    // MULTI-PAGE MODE: SEPARATE PAGES FOR ORIGINAL & DUPLICATE
    // -------------------------------------------------------------
    // Page 1: ORIGINAL / STORE COPY
    renderInvoiceBlock(
      doc,
      bill,
      settings,
      'ORIGINAL / STORE COPY',
      14,
      false // Full page mode
    );

    // Page 2: DUPLICATE / CUSTOMER COPY
    doc.addPage();
    renderInvoiceBlock(
      doc,
      bill,
      settings,
      'DUPLICATE / CUSTOMER COPY',
      14,
      false // Full page mode
    );
  }

  // Save PDF with clear semantic naming
  const cleanShopName = (settings.shopName || 'store')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .substring(0, 20);

  const fileName = `invoice_${cleanShopName}_${bill.billNumber}.pdf`;
  doc.save(fileName);
}
