"use client";

import { X } from "lucide-react";

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  closeOnBackdropClick = true,
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-foreground/40 p-3 pt-8 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      onClick={closeOnBackdropClick ? onClose : undefined}
    >
      <div
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-card p-4 shadow-xl sm:p-5 md:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground hover:bg-secondary/80"
            aria-label="Close modal"
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
