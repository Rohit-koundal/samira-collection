export default function ConfirmModal({ open, title, message, confirmLabel = 'Confirm', onConfirm, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] grid place-items-center bg-black/40 p-4">
      <div className="admin-card w-full max-w-md p-6">
        <h2>{title}</h2>
        <p className="admin-note">{message}</p>
        <div className="mt-5 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="admin-btn-ghost">Cancel</button>
          <button type="button" onClick={onConfirm} className="admin-btn">{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
