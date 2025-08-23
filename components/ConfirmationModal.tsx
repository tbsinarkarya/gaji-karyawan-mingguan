import React from 'react';

const { useEffect: useEffectConfirm } = React;

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, title, message }) => {
    if (!isOpen) return null;

    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };
    
    useEffectConfirm(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="dialog-title"
            onClick={handleBackdropClick}
        >
            <div
                className="bg-white rounded-lg shadow-xl w-full max-w-sm"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-6">
                    <h3 id="dialog-title" className="text-lg font-semibold leading-6 text-slate-900">{title}</h3>
                    <div className="mt-2">
                        <p className="text-sm text-slate-500">{message}</p>
                    </div>
                </div>
                <div className="flex justify-end gap-3 p-4 bg-slate-50 rounded-b-lg">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 bg-white text-slate-700 border border-slate-300 rounded-md hover:bg-slate-50 font-semibold transition-colors"
                    >
                        No
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-semibold transition-colors"
                    >
                        Yes
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;