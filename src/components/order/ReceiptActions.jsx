import { useState } from 'react';
import { buildReceiptMessage } from '../../utils/receiptMessage';
import { downloadReceiptHtml, printReceipt } from '../../utils/printReceipt';
import WhatsAppReceiptModal from './WhatsAppReceiptModal';

export default function ReceiptActions({ receipt }) {
  const [openWhatsApp, setOpenWhatsApp] = useState(false);
  const copy = async () => navigator.clipboard?.writeText(buildReceiptMessage(receipt));
  return (
    <div className="no-print flex flex-col gap-3 sm:flex-row sm:flex-wrap">
      <button onClick={printReceipt} className="rounded-xl bg-charcoal px-5 py-3 text-sm font-black text-white">Print Receipt</button>
      <button onClick={() => downloadReceiptHtml(receipt)} className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-black">Download Receipt</button>
      <button onClick={() => setOpenWhatsApp(true)} className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-black text-white">Send to WhatsApp</button>
      <button onClick={copy} className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-black">Copy Message</button>
      <WhatsAppReceiptModal open={openWhatsApp} receipt={receipt} onClose={() => setOpenWhatsApp(false)} />
    </div>
  );
}
