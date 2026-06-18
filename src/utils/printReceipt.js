import { formatAddress } from './receiptMessage';

export function printReceipt() {
  window.print();
}

export function downloadReceiptHtml(receipt, elementId = 'samira-receipt') {
  if (!receipt) return;

  const element = document.getElementById(elementId);
  const html = buildReceiptDocument(receipt, element?.innerHTML || '');
  const blob = new Blob([html], { type: 'text/html' });
  const link = document.createElement('a');
  const objectUrl = URL.createObjectURL(blob);

  link.href = objectUrl;
  link.download = `Samira-Collection-Invoice-${String(receipt.orderId || '').slice(-8).toUpperCase() || 'ORDER'}.html`;
  link.click();

  URL.revokeObjectURL(objectUrl);
}

function buildReceiptDocument(receipt, fallbackMarkup) {
  const orderCode = `#${String(receipt.orderId || '').slice(-8).toUpperCase() || 'ORDER'}`;
  const orderDate = receipt.orderDate ? new Date(receipt.orderDate).toLocaleString('en-IN') : '-';
  const customerName = receipt.customer?.name || receipt.shippingAddress?.fullName || 'Customer';
  const customerEmail = receipt.customer?.email || receipt.shippingAddress?.email || '';
  const customerPhone = receipt.shippingAddress?.mobile || receipt.shippingAddress?.phone || receipt.customer?.phone || '';
  const address = formatAddress(receipt.shippingAddress || {});
  const items = Array.isArray(receipt.items) ? receipt.items : [];
  const totals = {
    totalMRP: currency(receipt.totalMRP),
    productDiscount: currency(receipt.productDiscount),
    couponDiscount: currency(receipt.couponDiscount),
    deliveryCharge: Number(receipt.deliveryCharge || 0) ? currency(receipt.deliveryCharge) : 'FREE',
    codCharge: currency(receipt.codCharge),
    finalAmount: currency(receipt.finalAmount),
  };

  const rows = items.map((item, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>
        <div class="item-name">${escapeHtml(item.name || 'Product')}</div>
        <div class="item-sub">Size: ${escapeHtml(item.size || '-')} &nbsp;•&nbsp; Color: ${escapeHtml(item.color || '-')}</div>
      </td>
      <td>${escapeHtml(String(item.quantity || 1))}</td>
      <td>${currency(item.price)}</td>
      <td class="amount">${currency(Number(item.price || 0) * Number(item.quantity || 1))}</td>
    </tr>
  `).join('');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Samira Collection Invoice ${escapeHtml(orderCode)}</title>
  <style>
    :root{
      --ink:#1f2a44;
      --muted:#6b7280;
      --line:#e7dfd7;
      --soft:#faf6f1;
      --soft-2:#fffdf9;
      --accent:#8a2746;
      --accent-2:#c54c71;
      --gold:#b88b4a;
    }
    *{box-sizing:border-box}
    html,body{margin:0;padding:0;background:#f3eee8;color:var(--ink);font-family:Georgia,"Times New Roman",serif}
    body{padding:32px}
    .page{
      max-width:920px;
      margin:0 auto;
      background:linear-gradient(180deg,#fff 0%,var(--soft-2) 100%);
      border:1px solid var(--line);
      border-radius:24px;
      overflow:hidden;
      box-shadow:0 24px 60px rgba(31,42,68,.10);
    }
    .topbar{
      height:6px;
      background:linear-gradient(90deg,var(--accent) 0%,var(--accent-2) 48%,var(--gold) 100%);
    }
    .content{padding:34px 36px 30px}
    .header{
      display:flex;
      justify-content:space-between;
      gap:24px;
      padding-bottom:24px;
      border-bottom:1px solid var(--line);
    }
    .brand-mark{
      display:inline-block;
      padding:7px 12px;
      border:1px solid rgba(184,139,74,.38);
      border-radius:999px;
      color:var(--gold);
      font-size:11px;
      letter-spacing:.28em;
      text-transform:uppercase;
      margin-bottom:14px;
    }
    .brand-title{
      margin:0;
      font-size:31px;
      font-weight:700;
      letter-spacing:.04em;
      text-transform:uppercase;
    }
    .brand-sub{
      margin:8px 0 0;
      color:var(--muted);
      font-family:Arial,sans-serif;
      font-size:13px;
      line-height:1.7;
    }
    .invoice-box{
      min-width:230px;
      background:var(--soft);
      border:1px solid var(--line);
      border-radius:20px;
      padding:18px 20px;
    }
    .invoice-label{
      color:var(--accent);
      font-size:11px;
      font-weight:700;
      letter-spacing:.26em;
      text-transform:uppercase;
      font-family:Arial,sans-serif;
    }
    .invoice-number{
      margin:10px 0 6px;
      font-size:26px;
      font-weight:700;
    }
    .invoice-date{
      margin:0;
      color:var(--muted);
      font-size:13px;
      font-family:Arial,sans-serif;
    }
    .grid{
      display:grid;
      grid-template-columns:repeat(2,minmax(0,1fr));
      gap:18px;
      margin-top:24px;
    }
    .panel{
      background:#fff;
      border:1px solid var(--line);
      border-radius:20px;
      padding:18px 20px;
      min-height:150px;
    }
    .panel-title{
      margin:0 0 10px;
      color:var(--accent);
      font-size:11px;
      font-family:Arial,sans-serif;
      font-weight:700;
      letter-spacing:.24em;
      text-transform:uppercase;
    }
    .panel-text{
      margin:0;
      color:var(--ink);
      font-size:15px;
      line-height:1.75;
    }
    .panel-muted{
      color:var(--muted);
      font-family:Arial,sans-serif;
      font-size:13px;
      line-height:1.7;
    }
    .table-wrap{
      margin-top:24px;
      border:1px solid var(--line);
      border-radius:22px;
      overflow:hidden;
      background:#fff;
    }
    table{
      width:100%;
      border-collapse:collapse;
      font-size:14px;
    }
    thead th{
      padding:16px 14px;
      background:linear-gradient(180deg,#fcf6ef 0%,#f8eee4 100%);
      color:var(--accent);
      font-size:11px;
      font-weight:700;
      letter-spacing:.18em;
      text-transform:uppercase;
      text-align:left;
      font-family:Arial,sans-serif;
    }
    tbody td{
      padding:16px 14px;
      border-top:1px solid #f0e8df;
      vertical-align:top;
      font-family:Arial,sans-serif;
      color:var(--ink);
    }
    .item-name{
      font-size:15px;
      font-weight:700;
      font-family:Georgia,"Times New Roman",serif;
    }
    .item-sub{
      margin-top:6px;
      color:var(--muted);
      font-size:12px;
    }
    .amount{font-weight:700}
    .summary{
      margin-left:auto;
      margin-top:24px;
      width:100%;
      max-width:350px;
      background:linear-gradient(180deg,#fff 0%,#fdfaf6 100%);
      border:1px solid var(--line);
      border-radius:22px;
      padding:20px 22px;
    }
    .summary-title{
      margin:0 0 14px;
      color:var(--accent);
      font-size:11px;
      font-family:Arial,sans-serif;
      font-weight:700;
      letter-spacing:.24em;
      text-transform:uppercase;
    }
    .summary-row{
      display:flex;
      justify-content:space-between;
      gap:18px;
      padding:8px 0;
      font-size:14px;
      font-family:Arial,sans-serif;
      color:var(--ink);
    }
    .summary-row.muted{color:var(--muted)}
    .summary-total{
      margin-top:8px;
      padding-top:14px;
      border-top:1px solid var(--line);
      display:flex;
      justify-content:space-between;
      gap:18px;
      font-size:19px;
      font-weight:700;
    }
    .meta{
      display:grid;
      grid-template-columns:repeat(3,minmax(0,1fr));
      gap:18px;
      margin-top:24px;
    }
    .meta-card{
      background:var(--soft);
      border:1px solid var(--line);
      border-radius:20px;
      padding:18px 20px;
    }
    .footer{
      margin-top:26px;
      padding-top:20px;
      border-top:1px solid var(--line);
      text-align:center;
    }
    .footer-main{
      margin:0;
      font-size:18px;
      color:var(--accent);
      font-weight:700;
    }
    .footer-sub{
      margin:8px 0 0;
      color:var(--muted);
      font-family:Arial,sans-serif;
      font-size:13px;
      line-height:1.7;
    }
    .fallback{display:none}
    @media print{
      body{background:#fff;padding:0}
      .page{box-shadow:none;border:none;border-radius:0;max-width:none}
    }
    @media (max-width: 760px){
      body{padding:12px}
      .content{padding:20px 18px}
      .header,.grid,.meta{grid-template-columns:1fr;display:grid}
      .header{gap:16px}
      .invoice-box{min-width:0}
      table{min-width:640px}
      .table-wrap{overflow:auto}
      .summary{max-width:none}
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="topbar"></div>
    <div class="content">
      <section class="header">
        <div>
          <div class="brand-mark">Samira Collection</div>
          <h1 class="brand-title">${escapeHtml(receipt.storeDetails?.storeName || 'Samira Collection')}</h1>
          <p class="brand-sub">
            ${escapeHtml(receipt.storeDetails?.address || 'Premium fashion invoice document')}<br/>
            ${escapeHtml(receipt.storeDetails?.contactEmail || '')}${receipt.storeDetails?.contactEmail && (receipt.storeDetails?.contactPhone || receipt.storeDetails?.whatsappNumber) ? ' • ' : ''}${escapeHtml(receipt.storeDetails?.contactPhone || receipt.storeDetails?.whatsappNumber || '')}
          </p>
        </div>
        <div class="invoice-box">
          <div class="invoice-label">Tax Invoice / Receipt</div>
          <div class="invoice-number">${escapeHtml(orderCode)}</div>
          <p class="invoice-date">Issued on ${escapeHtml(orderDate)}</p>
        </div>
      </section>

      <section class="grid">
        <div class="panel">
          <h2 class="panel-title">Billed To</h2>
          <p class="panel-text">${escapeHtml(customerName)}</p>
          ${customerEmail ? `<p class="panel-muted">${escapeHtml(customerEmail)}</p>` : ''}
          ${customerPhone ? `<p class="panel-muted">${escapeHtml(customerPhone)}</p>` : ''}
        </div>
        <div class="panel">
          <h2 class="panel-title">Delivery Address</h2>
          <p class="panel-text">${escapeHtml(address || 'Address not available')}</p>
        </div>
      </section>

      <section class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>S.No</th>
              <th>Item Description</th>
              <th>Qty</th>
              <th>Unit Price</th>
              <th>Line Total</th>
            </tr>
          </thead>
          <tbody>
            ${rows || '<tr><td colspan="5">No items available</td></tr>'}
          </tbody>
        </table>
      </section>

      <section class="summary">
        <h2 class="summary-title">Amount Summary</h2>
        <div class="summary-row"><span>Total MRP</span><span>${totals.totalMRP}</span></div>
        <div class="summary-row muted"><span>Product Discount</span><span>- ${totals.productDiscount}</span></div>
        <div class="summary-row muted"><span>Coupon Discount</span><span>- ${totals.couponDiscount}</span></div>
        <div class="summary-row"><span>Delivery Charge</span><span>${totals.deliveryCharge}</span></div>
        <div class="summary-row"><span>COD Charge</span><span>${totals.codCharge}</span></div>
        <div class="summary-total"><span>Final Amount</span><span>${totals.finalAmount}</span></div>
      </section>

      <section class="meta">
        <div class="meta-card">
          <h2 class="panel-title">Payment</h2>
          <p class="panel-text">${escapeHtml(receipt.paymentMethod || '-')}</p>
          <p class="panel-muted">${escapeHtml(receipt.paymentProvider || '')}</p>
          <p class="panel-muted">Status: ${escapeHtml(receipt.paymentStatus || '-')}</p>
        </div>
        <div class="meta-card">
          <h2 class="panel-title">Order Status</h2>
          <p class="panel-text">${escapeHtml(receipt.orderStatus || '-')}</p>
          <p class="panel-muted">${escapeHtml(orderDate)}</p>
        </div>
        <div class="meta-card">
          <h2 class="panel-title">Policy</h2>
          <p class="panel-muted">${escapeHtml(receipt.policies?.returnPolicy || 'Return/exchange as per store policy.')}</p>
        </div>
      </section>

      <section class="footer">
        <p class="footer-main">Thank you for shopping with Samira Collection.</p>
        <p class="footer-sub">This document is computer generated and designed for a refined, professional order record.</p>
      </section>

      ${fallbackMarkup ? `<div class="fallback">${fallbackMarkup}</div>` : ''}
    </div>
  </div>
</body>
</html>`;
}

function currency(value) {
  return `Rs. ${Number(value || 0).toFixed(2)}`;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
