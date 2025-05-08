import { ReactNode, RefObject } from 'react';

interface PopupContainerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  popupRef: RefObject<HTMLDivElement>;
}

export default function PopupContainer({
  isOpen,
  onClose,
  title,
  children,
  popupRef
}: PopupContainerProps) {
  if (!isOpen) return null;

  return (
    <div
      ref={popupRef}
      className="absolute top-full left-0 mt-2 w-80 bg-white/95 backdrop-blur rounded-xl 
        shadow-lg shadow-purple-100/20 border border-purple-100/20 z-10 
        animate-fadeIn"
    >
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <label className="text-base font-medium text-gray-800">
            {title}
          </label>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
