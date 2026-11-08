import { Bill, ShopSettings } from '../types';

/**
 * Format thermal receipt text (ESC/POS style for 58mm/80mm printers)
 */
export function formatThermalReceiptText(bill: Bill, settings: ShopSettings): string {
  const line = '--------------------------------';
  const doubleLine = '================================';

  let receipt = '';
  receipt += `${settings.shopName.toUpperCase()}\n`;
  receipt += `${settings.tagline}\n`;
  receipt += `Mob: ${settings.phone}\n`;
  if (settings.gstNumber) receipt += `GST: ${settings.gstNumber}\n`;
  receipt += `${doubleLine}\n`;
  receipt += `Bill: ${bill.billNumber}\n`;
  receipt += `Date: ${new Date(bill.createdAt).toLocaleDateString()} ${new Date(bill.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}\n`;
  receipt += `Cust: ${bill.customerName || 'Cash'}\n`;
  if (bill.customerPhone) receipt += `Tel:  ${bill.customerPhone}\n`;
  receipt += `${line}\n`;
  receipt += `ITEM              QTY     AMOUNT\n`;
  receipt += `${line}\n`;

  bill.items.forEach((item) => {
    const itemName = item.productName.substring(0, 16).padEnd(16, ' ');
    let qtyStr = '';
    if (item.cartonQty > 0 && item.pieceQty > 0) {
      qtyStr = `${item.cartonQty}B+${item.pieceQty}L`;
    } else if (item.cartonQty > 0) {
      qtyStr = `${item.cartonQty} Box`;
    } else {
      qtyStr = `${item.pieceQty} Ladi`;
    }
    const amtStr = `Rs.${item.totalAmount.toFixed(0)}`.padStart(9, ' ');
    receipt += `${itemName}\n                  ${qtyStr.padEnd(7, ' ')} ${amtStr}\n`;
    if (item.cartonQty > 0) {
      receipt += `  (Pack: 1Box=${item.packSize}Ladi)\n`;
    }
  });

  receipt += `${line}\n`;
  receipt += `SUBTOTAL:          Rs.${bill.subtotal.toFixed(2)}\n`;
  if (bill.discount > 0) {
    receipt += `DISCOUNT:         -Rs.${bill.discount.toFixed(2)}\n`;
  }
  receipt += `TOTAL AMOUNT:      Rs.${bill.totalAmount.toFixed(2)}\n`;

  const isUdhar = bill.paymentMethod === 'udhar';
  const paid = bill.paidAmount || (bill.isUdharPaid ? bill.totalAmount : 0);
  const remaining = Math.max(0, bill.totalAmount - paid);
  const isFullyPaid = !isUdhar || bill.isUdharPaid || remaining === 0;
  const isPartPaid = isUdhar && paid > 0 && remaining > 0;

  if (isUdhar) {
    if (isFullyPaid) {
      receipt += `PAYMENT:           UDHAR (FULLY SETTLED)\n`;
      receipt += `PAID AMOUNT:       Rs.${bill.totalAmount.toFixed(2)}\n`;
      receipt += `BALANCE DUE:       Rs.0.00\n`;
    } else if (isPartPaid) {
      receipt += `PAYMENT:           UDHAR (PART PAID)\n`;
      receipt += `PAID SO FAR:       Rs.${paid.toFixed(2)}\n`;
      receipt += `BALANCE DUE:       Rs.${remaining.toFixed(2)}\n`;
    } else {
      receipt += `PAYMENT:           UDHAR (PENDING)\n`;
      receipt += `BALANCE DUE:       Rs.${bill.totalAmount.toFixed(2)}\n`;
    }

    if (bill.payments && bill.payments.length > 0) {
      receipt += `PART PAYMENTS:\n`;
      bill.payments.forEach((p, idx) => {
        const pDate = new Date(p.date || p.createdAt).toLocaleDateString();
        receipt += ` ${idx + 1}. Rs.${p.amount.toFixed(0)} (${p.paymentMethod}) ${pDate}\n`;
      });
    }
  } else {
    receipt += `PAYMENT:           ${bill.paymentMethod.toUpperCase()} (PAID)\n`;
  }

  receipt += `${doubleLine}\n`;
  receipt += `    THANK YOU VISIT AGAIN!      \n`;
  receipt += `   धन्यवाद! फिर पधारें!    \n\n\n`;

  return receipt;
}

/**
 * Trigger print preview formatted for 58mm thermal rolls
 */
export function printReceiptViaBrowser(receiptText: string): void {
  const printWindow = window.open('', '_blank', 'width=350,height=600');
  if (!printWindow) {
    alert('Please allow popups to print receipt');
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Receipt Print</title>
        <style>
          @page {
            size: 58mm auto;
            margin: 0;
          }
          body {
            font-family: 'Courier New', monospace;
            font-size: 11px;
            font-weight: 600;
            line-height: 1.25;
            margin: 0;
            padding: 8px;
            color: #000;
            background: #fff;
            width: 58mm;
          }
          pre {
            margin: 0;
            white-space: pre-wrap;
            word-break: break-all;
          }
        </style>
      </head>
      <body>
        <pre>${receiptText}</pre>
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 1500);
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

/**
 * Format invoice for WhatsApp sharing
 */
export function formatWhatsAppBillMessage(bill: Bill, settings: ShopSettings): string {
  let msg = `*🧾 ${settings.shopName.toUpperCase()}*\n`;
  msg += `📍 ${settings.address}\n`;
  msg += `📞 ${settings.phone}\n`;
  msg += `--------------------------------\n`;
  msg += `*Invoice No:* ${bill.billNumber}\n`;
  msg += `*Date:* ${new Date(bill.createdAt).toLocaleDateString()} ${new Date(bill.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}\n`;
  msg += `*Customer:* ${bill.customerName || 'Cash'}\n`;
  if (bill.customerPhone) msg += `*Phone:* ${bill.customerPhone}\n`;
  msg += `--------------------------------\n`;
  msg += `*ITEMS (सामान):*\n`;

  bill.items.forEach((item, idx) => {
    msg += `${idx + 1}. *${item.productName}*\n`;
    if (item.cartonQty > 0 && item.pieceQty > 0) {
      msg += `   📦 Qty: *${item.cartonQty} Box + ${item.pieceQty} Ladi* (1 Box = ${item.packSize} Ladi)\n`;
    } else if (item.cartonQty > 0) {
      msg += `   📦 Qty: *${item.cartonQty} Box* (1 Box = ${item.packSize} Ladi)\n`;
    } else {
      msg += `   📦 Qty: *${item.pieceQty} Ladi*\n`;
    }
    msg += `   💰 Amount: ₹${item.totalAmount}\n`;
  });

  msg += `--------------------------------\n`;
  msg += `*Subtotal:* ₹${bill.subtotal}\n`;
  if (bill.discount > 0) msg += `*Discount:* -₹${bill.discount}\n`;
  msg += `*TOTAL AMOUNT:* *₹${bill.totalAmount}*\n`;

  const isUdhar = bill.paymentMethod === 'udhar';
  const paid = bill.paidAmount || (bill.isUdharPaid ? bill.totalAmount : 0);
  const remaining = Math.max(0, bill.totalAmount - paid);
  const isFullyPaid = !isUdhar || bill.isUdharPaid || remaining === 0;
  const isPartPaid = isUdhar && paid > 0 && remaining > 0;

  if (isUdhar) {
    if (isFullyPaid) {
      msg += `*Payment:* ✅ *UDHAR FULLY SETTLED (उधार चुकता)*\n`;
      msg += `*Paid Amount:* ₹${bill.totalAmount}\n`;
      msg += `*Balance Due:* ₹0\n`;
    } else if (isPartPaid) {
      msg += `*Payment:* ⚠️ *PART PAID (आंशिक भुगतान जमा)*\n`;
      msg += `*Amount Paid So Far:* ₹${paid}\n`;
      msg += `*CURRENT BALANCE DUE:* *₹${remaining} (बाकी बकाया)*\n`;
    } else {
      msg += `*Payment:* ⚠️ *UDHAR / KHATA (उधार बकाया)*\n`;
      msg += `*CURRENT BALANCE DUE:* *₹${bill.totalAmount}*\n`;
    }

    if (bill.payments && bill.payments.length > 0) {
      msg += `\n*Payments Received (जमा किश्तें):*\n`;
      bill.payments.forEach((p, idx) => {
        const pDate = new Date(p.date || p.createdAt).toLocaleDateString();
        msg += `${idx + 1}. +₹${p.amount} via ${p.paymentMethod.toUpperCase()} on ${pDate}\n`;
      });
    }
  } else {
    const paymentStatus =
      bill.paymentMethod === 'cash' ? '✅ Paid via CASH (नकद)' : '✅ Paid via UPI Online';
    msg += `*Payment:* ${paymentStatus}\n`;
  }

  if (settings.upiId && bill.paymentMethod === 'udhar') {
    msg += `\n💳 Pay via UPI: \`${settings.upiId}\`\n`;
  }

  msg += `\n🙏 धन्यवाद! फिर पधारें | Thank You!`;
  return msg;
}

/**
 * Open WhatsApp directly with the invoice message
 */
export function shareViaWhatsApp(bill: Bill, settings: ShopSettings): void {
  const text = formatWhatsAppBillMessage(bill, settings);
  const encodedText = encodeURIComponent(text);
  const cleanPhone = (bill.customerPhone || '').replace(/\D/g, '');
  
  let url = '';
  if (cleanPhone.length >= 10) {
    // If Indian phone without country code
    const fullPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    url = `https://api.whatsapp.com/send?phone=${fullPhone}&text=${encodedText}`;
  } else {
    url = `https://api.whatsapp.com/send?text=${encodedText}`;
  }

  window.open(url, '_blank');
}
