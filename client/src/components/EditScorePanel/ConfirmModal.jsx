import React from "react";

export default function ConfirmModal({
  isOpen,
  title = "Weet je het zeker?",
  message = "Deze actie kan niet ongedaan worden gemaakt.",
  onCancel,
  onConfirm,
  confirmText = "Bevestigen",
  cancelText = "Annuleren",
  loading = false,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-black/90 rounded-xl shadow-2xl w-full max-w-md p-6">
        <h2 className="text-white text-lg font-semibold mb-2">{title}</h2>
        <p className="text-white/70 mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded"
            disabled={loading}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded"
            disabled={loading}
          >
            {loading ? "Bezig..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
