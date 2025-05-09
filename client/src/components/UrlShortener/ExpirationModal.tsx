import { useEffect, useState } from 'react';
import BaseModal from '../common/BaseModal';

export default function ExpirationModal({
  isOpen,
  onClose,
  value,
  onChange,
}: {
  isOpen: boolean;
  onClose: () => void;
  value: string;
  onChange: (value: string) => void;
}) {
  const [currentDate, setCurrentDate] = useState<string>("");

  const closeAndSave = () => {
    onChange(currentDate);
    onClose();
  }

  const modalFooter = (
    <>
      <button
        type="button"
        onClick={onClose}
        className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={closeAndSave}
        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 
          focus:ring-2 focus:ring-purple-200 focus:ring-offset-2
          transition-all duration-200 shadow-sm"
      >
        Apply Date
      </button>
    </>
  );

  useEffect(() => {
    if (!isOpen) return;

    if (value) {
      setCurrentDate(value);
    } else {
      setCurrentDate(new Date().toISOString().slice(0, 16));
    }
  }, [isOpen, value]);

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Custom Expiration"
      description="Set a specific date and time for link expiration"
      footer={modalFooter}
    >
      <div className="space-y-4">
        <input
          type="datetime-local"
          value={currentDate}
          onChange={(e) => setCurrentDate(e.target.value)}
          min={new Date().toISOString().slice(0, 16)}
          className="block w-full px-4 py-2.5 border border-gray-200 rounded-lg 
            focus:ring-2 focus:ring-purple-100 focus:border-purple-300 
            hover:border-gray-300 transition-all duration-200"
        />
        <p className="text-sm text-gray-500">
          The link will become inactive after this date and time.
        </p>
      </div>
    </BaseModal>
  );
}
