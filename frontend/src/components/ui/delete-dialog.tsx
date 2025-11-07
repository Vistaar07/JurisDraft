"use client";

import { AlertTriangle, X } from "lucide-react";
import { Button } from "./button";
import { useEffect } from "react";

interface DeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  itemName?: string;
  isDeleting?: boolean;
}

export function DeleteDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  itemName,
  isDeleting = false,
}: DeleteDialogProps) {
  // Prevent body scroll when dialog is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop with blur */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative z-50 w-full max-w-md mx-4 animate-in fade-in-0 zoom-in-95 duration-200">
        <div className="bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="flex items-start justify-between p-6 border-b border-gray-200">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-red-100 p-2">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
                <p className="text-sm text-gray-600 mt-1">{description}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100"
              disabled={isDeleting}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          {itemName && (
            <div className="px-6 py-4 bg-gray-50">
              <p className="text-sm text-gray-700">
                You are about to delete:{" "}
                <span className="font-semibold text-gray-900">{itemName}</span>
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 bg-gray-50 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isDeleting}
              className="bg-white hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              onClick={onConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white min-w-[100px]"
            >
              {isDeleting ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Deleting...</span>
                </div>
              ) : (
                "Delete"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
