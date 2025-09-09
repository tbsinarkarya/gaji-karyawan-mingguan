import React from "react";

type Choice = "consumer" | "business";

interface WhatsAppChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChoose: (choice: Choice) => void;
}

export default function WhatsAppChoiceModal({ isOpen, onClose, onChoose }: WhatsAppChoiceModalProps) {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-slate-900">Bagikan via WhatsApp</h3>
          <p className="text-sm text-slate-500 mt-1">Pilih aplikasi WhatsApp yang ingin digunakan.</p>
          <div className="mt-4 grid grid-cols-1 gap-3">
            <button
              type="button"
              onClick={() => onChoose("consumer")}
              className="w-full px-4 py-2 rounded-md bg-emerald-600 text-white font-semibold hover:bg-emerald-700"
            >
              WhatsApp
            </button>
            <button
              type="button"
              onClick={() => onChoose("business")}
              className="w-full px-4 py-2 rounded-md bg-emerald-100 text-emerald-800 font-semibold hover:bg-emerald-200"
            >
              WhatsApp Business
            </button>
          </div>
        </div>
        <div className="flex justify-end gap-3 p-4 bg-slate-50 rounded-b-lg">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white text-slate-700 border border-slate-300 rounded-md hover:bg-slate-50 font-semibold"
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}

