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
      className="absolute top-full left-0 mt-2 w-80 bg-white/95 backdrop-blur-sm rounded-xl 
        shadow-lg shadow-purple-100/30 border border-purple-100/30 z-10 
        animate-fadeIn overflow-hidden"
    >
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <label className="text-base font-medium text-gray-800 flex items-center">
            <svg className="h-4 w-4 mr-2 text-purple-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            {title}
          </label>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
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
