import { useEffect, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
}

export default function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    isDestructive = false
}: ConfirmationModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 dark:bg-slate-900/50 backdrop-blur-sm animate-fade-in">
            <div
                ref={modalRef}
                className="bg-white dark:bg-slate-800 rounded-2xl shadow-glass-lg w-full max-w-md border border-slate-200/60 dark:border-slate-700/40 animate-scale-in"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6 space-y-4">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            {isDestructive && (
                                <div className="bg-red-50 dark:bg-red-900/20 p-2.5 rounded-xl">
                                    <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                                </div>
                            )}
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                                {title}
                            </h3>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                            id="modal-close"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm">
                        {message}
                    </p>

                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600/50 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-600 transition-all"
                            id="modal-cancel"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={() => {
                                onConfirm();
                                onClose();
                            }}
                            className={`px-4 py-2.5 text-sm font-semibold text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all shadow-sm hover:shadow-md ${isDestructive
                                ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                                : 'bg-gradient-to-r from-medical-500 to-teal-500 hover:from-medical-600 hover:to-teal-600 focus:ring-medical-500'
                            }`}
                            id="modal-confirm"
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
