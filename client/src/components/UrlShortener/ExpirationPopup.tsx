import { FC, useState } from 'react';
import PopupContainer from '../PopupContainer';
import ExpirationModal from './ExpirationModal';

export const EXPIRATION_OPTIONS = [
  { label: '1 hour', duration: 1 * 60 * 60 * 1000 },
  { label: '24 hours', duration: 24 * 60 * 60 * 1000 },
  { label: '7 days', duration: 7 * 24 * 60 * 60 * 1000 },
  { label: '30 days', duration: 30 * 24 * 60 * 60 * 1000 },
  { label: 'Custom date', duration: null },
] as const;

export default function ExpirationPopup({
  isOpen,
  onClose,
  hasExpiration,
  customDate,
  onOptionSelect,
  onCustomDateSelect,
  onRemove,
  render,
}: {
  isOpen: boolean;
  onClose: () => void;
  hasExpiration: boolean;
  customDate?: string;
  onOptionSelect: (duration: number | null) => void;
  onCustomDateSelect: (date: string) => void;
  onRemove: () => void;
  render: FC<{
    onClick: () => void;
    hasExpiration: boolean;
  }>;
}) {
  const [showModal, setShowModal] = useState(false);

  const handleOptionSelect = (duration: number | null) => {
    if (duration) {
      onOptionSelect(duration);
      onClose();
    } else {
      setShowModal(true);
    }
  };

  return (
    <div className="relative">
      {render({
        onClick: () => onClose(),
        hasExpiration,
      })}

      <PopupContainer
        isOpen={isOpen}
        onClose={onClose}
        title="Expiration Time">
        <div className="space-y-0.5">
          {EXPIRATION_OPTIONS.map((option) => (
            <button
              key={option.label}
              type="button"
              onClick={() => handleOptionSelect(option.duration)}
              className="w-full text-left px-3 py-2 text-sm rounded-md
                text-gray-700 hover:text-purple-700 hover:bg-purple-50 active:bg-purple-100 
                transition-colors flex items-center group relative"
            >
              <span className="font-medium">{option.label}</span>
              {option.duration === null ? (
                <svg className="w-4 h-4 ml-auto text-gray-400 group-hover:text-purple-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <span className="ml-auto text-xs text-gray-400 group-hover:text-purple-500">Select</span>
              )}
            </button>
          ))}
          {hasExpiration && (
            <button
              type="button"
              onClick={() => {
                onRemove();
                onClose();
              }}
              className="w-full text-left px-3 py-2 text-sm rounded-md font-medium
                text-red-600 hover:bg-red-50 active:bg-red-100 transition-colors"
            >
              Remove Expiration
            </button>
          )}
        </div>
      </PopupContainer>

      <ExpirationModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        value={customDate || ''}
        onChange={(value) => {
          onCustomDateSelect(value);
          setShowModal(false);
          onClose();
        }}
      />
    </div>
  );
}
