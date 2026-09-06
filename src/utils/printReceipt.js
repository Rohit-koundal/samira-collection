import logo from '../assets/samira-collection-logo.png';
import { buildReceiptDefinition } from './receiptDocument';
import { receiptView } from './receiptData';

let pdfRuntime;
let logoPromise;
async function loadPdfRuntime() {
  if (!pdfRuntime) pdfRuntime = Promise.all([import('pdfmake/build/pdfmake'), import('pdfmake/build/vfs_fonts')]).then(([module, fonts]) => {
    const pdfMake = module.default || module;
    pdfMake.addVirtualFileSystem(fonts.default || fonts);
    return pdfMake;
  }).catch((error) => { pdfRuntime = null; throw error; });
  return pdfRuntime;
}
function loadLogo() {
  if (!logoPromise) logoPromise = fetch(logo).then((response) => {
    if (!response.ok) throw new Error('Logo unavailable');
    return response.blob();
  }).then((blob) => new Promise((resolve, reject) => {
    const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(blob);
  })).catch(() => { logoPromise = null; return null; });
  return logoPromise;
}
export async function createReceiptPdf(receipt) {
  if (!receipt?.orderId || !Array.isArray(receipt.items) || !receipt.items.length || receipt.finalAmount == null || !Number.isFinite(Number(receipt.finalAmount))) throw new Error('Invoice details are incomplete. Refresh the order and try again.');
  const [pdfMake, logoData] = await Promise.all([loadPdfRuntime(), loadLogo()]);
  return pdfMake.createPdf(buildReceiptDefinition(receipt, logoData));
}
export async function downloadReceiptPdf(receipt) {
  const pdf = await createReceiptPdf(receipt);
  await pdf.download(receiptView(receipt).filename);
}
export async function printReceipt(receipt) {
  // Open during the click gesture, before the lazy PDF bundle loads.
  const target = window.open('', '_blank');
  if (!target) throw new Error('Your browser blocked the print window. Allow pop-ups for this site, or download the PDF instead.');
  target.document.title = 'Preparing invoice';
  target.document.body.textContent = 'Preparing your invoice...';
  try {
    const pdf = await createReceiptPdf(receipt);
    await pdf.print(target);
  } catch (error) {
    target.close(); throw error;
  }
}
