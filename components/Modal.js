'use client';

export default function Modal({ open, title, message, onClose, onConfirm, confirmLabel = 'Confirm', confirmVariant = 'primary', children }) {
  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        {title && <h3 style={{ marginBottom: '0.5rem' }}>{title}</h3>}
        {message && <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.6 }}>{message}</p>}
        {children}
        <div className="modal-actions">
          {onConfirm ? (
            <>
              <button className="btn btn-secondary btn-sm" onClick={onClose}>Cancel</button>
              <button className={`btn btn-${confirmVariant} btn-sm`} onClick={onConfirm}>{confirmLabel}</button>
            </>
          ) : (
            <button className="btn btn-primary btn-sm" onClick={onClose}>OK</button>
          )}
        </div>
      </div>
    </div>
  );
}
