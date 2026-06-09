export function printReceipt() {
  window.print();
}

export function downloadReceiptHtml(receipt, elementId = 'samira-receipt') {
  const element = document.getElementById(elementId);
  if (!element) return;
  const html = `<!doctype html><html><head><title>Samira Receipt</title><style>body{font-family:Arial,sans-serif;color:#111;padding:24px}table{width:100%;border-collapse:collapse}td,th{border-bottom:1px solid #ddd;padding:8px;text-align:left}</style></head><body>${element.innerHTML}</body></html>`;
  const blob = new Blob([html], { type: 'text/html' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `Samira-Collection-Receipt-${String(receipt.orderId).slice(-8).toUpperCase()}.html`;
  link.click();
  URL.revokeObjectURL(link.href);
}
