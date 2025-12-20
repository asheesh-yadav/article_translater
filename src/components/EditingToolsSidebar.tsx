import { ChevronRight, Sparkles, CheckCircle2 } from 'lucide-react';

interface EditingToolsSidebarProps {
  formality: 'default' | 'formal' | 'informal';
  onFormalityChange: (formality: 'default' | 'formal' | 'informal') => void;
  detectedLanguage?: string | null;
}

export default function EditingToolsSidebar({ formality, onFormalityChange, detectedLanguage }: EditingToolsSidebarProps) {
  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900">Editing tools</h3>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-4">
          {detectedLanguage && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
              <div className="text-xs font-medium text-blue-700 mb-1">Detected Language</div>
              <div className="text-sm text-blue-900">{detectedLanguage}</div>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-gray-400" />
              <div className="font-medium text-gray-900">Formality</div>
            </div>
            <div className="text-sm text-gray-600 mb-2">
              Adjust the tone of your translation
            </div>
            <div className="space-y-2">
              <button
                onClick={() => onFormalityChange('default')}
                className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  formality === 'default'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Default
              </button>
              <button
                onClick={() => onFormalityChange('formal')}
                className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  formality === 'formal'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100  hover:bg-gray-200 omTraslate'
                }`}
              >
                Formal
              </button>
              <button
                onClick={() => onFormalityChange('informal')}
                className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  formality === 'informal'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 omTraslate hover:bg-gray-200'
                }`}
              >
                Informal
              </button>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-gray-400 mt-0.5" />
            <div className="flex-1">
              <div className="font-medium text-gray-900 mb-1">Clarify</div>
              <button
                className="text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded hover:bg-blue-100 transition-colors"
                onClick={() => {
                  try {
                    window.dispatchEvent(new Event('omni:clarify'));
                  } catch {}
                }}
              >
                Clarify Text
              </button>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="font-medium text-gray-900 mb-3">Translation Tips</div>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start gap-2">
                <span className="text-blue-500">•</span>
                <p>Use formal mode for business communications</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-500">•</span>
                <p>Informal mode is best for casual conversations</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-500">•</span>
                <p>Translation quality improves with complete sentences</p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="font-medium text-gray-900 mb-3">Customizations</div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700">Glossaries</span>
                  <span className="text-xs text-gray-500">0/5</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Style rules</span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="font-medium text-gray-900 mb-3">Powered by</div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-gray-700">Language model</span>
              </div>
              <button className="text-sm text-gray-600 flex items-center gap-1">
                Next-gen
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
