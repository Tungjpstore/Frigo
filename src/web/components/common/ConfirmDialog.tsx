import React, { useEffect, useRef } from 'react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Accessible replacement for window.confirm: focus-trapped, Escape closes. */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  description,
  confirmText = 'Đồng ý',
  cancelText = 'Hủy',
  destructive = false,
  onConfirm,
  onCancel,
}) => {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    confirmRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={onCancel}
      role="presentation"
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby={description ? 'confirm-dialog-desc' : undefined}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-elevated w-full max-w-sm p-5 space-y-3"
      >
        <h2 id="confirm-dialog-title" className="font-heading font-bold text-base text-slate-900">
          {title}
        </h2>
        {description && (
          <p id="confirm-dialog-desc" className="text-sm text-slate-600 leading-relaxed">
            {description}
          </p>
        )}
        <div className="flex gap-2.5 pt-1">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-heading font-bold text-sm hover:bg-slate-200 active:scale-95 transition-all tap-target"
          >
            {cancelText}
          </button>
          <button
            ref={confirmRef}
            onClick={onConfirm}
            className={`flex-1 py-2.5 rounded-xl font-heading font-bold text-sm text-white active:scale-95 transition-all tap-target ${
              destructive ? 'bg-rose-600 hover:bg-rose-700' : 'bg-[#22C55E] hover:bg-[#1ea750]'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
