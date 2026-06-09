export default function ConfirmModal({ open, title, message, confirmLabel = 'Confirm', onConfirm, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] grid place-items-center bg-black/45 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
        <h2 className="text-xl font-black text-charcoal">{title}</h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{message}</p>
        <div className="mt-5 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-black">Cancel</button>
          <button type="button" onClick={onConfirm} className="rounded-xl bg-wine px-4 py-2 text-sm font-black text-white">{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
