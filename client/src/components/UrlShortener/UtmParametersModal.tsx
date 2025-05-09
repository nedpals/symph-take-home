import { UTMParameters } from '../../../../shared/types/url_shortener';
import BaseModal from '../common/BaseModal';

export default function UtmParametersModal({
  isOpen,
  onClose,
  utmParameters,
  onChange,
}: {
  isOpen: boolean;
  onClose: () => void;
  utmParameters: UTMParameters;
  onChange: (params: UTMParameters) => void;
}) {
  const handleChange = (key: keyof UTMParameters, value: string) => {
    onChange({
      ...utmParameters,
      [key]: value,
    });
  };

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
        onClick={onClose}
        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 
          focus:ring-2 focus:ring-purple-200 focus:ring-offset-2
          transition-all duration-200 shadow-sm"
      >
        Apply Parameters
      </button>
    </>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="UTM Parameters"
      description="Track your link performance across different channels"
      footer={modalFooter}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6">
          {[
            {
              key: 'utm_source',
              label: 'Source',
              description: 'The referrer: e.g., google, newsletter',
              placeholder: 'google',
            },
            {
              key: 'utm_medium',
              label: 'Medium',
              description: 'Marketing medium: e.g., cpc, social',
              placeholder: 'social',
            },
            {
              key: 'utm_campaign',
              label: 'Campaign',
              description: 'Campaign name: e.g., spring_sale',
              placeholder: 'spring_sale',
            },
            {
              key: 'utm_content',
              label: 'Content',
              description: 'Use to differentiate similar content',
              placeholder: 'blue_button',
            },
          ].map(({ key, label, description, placeholder }) => (
            <div key={key} className="group relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {label}
                <span className="text-xs text-gray-400 ml-1 font-normal">({key})</span>
              </label>
              <input
                type="text"
                value={utmParameters[key as keyof UTMParameters] || ''}
                onChange={(e) => handleChange(key as keyof UTMParameters, e.target.value)}
                placeholder={placeholder}
                className="block w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg 
                  focus:ring-2 focus:ring-purple-100 focus:border-purple-300 
                  hover:border-gray-300 transition-all duration-200
                  placeholder:text-gray-400 text-gray-600"
              />
              <div className="absolute left-0 -bottom-5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <div className="bg-gray-800 text-white text-xs rounded-md px-2 py-1 mt-1 shadow-lg">
                  {description}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </BaseModal>
  );
}
