import { useState } from 'react';
import { Search, Check, ChevronUp } from 'lucide-react';

interface LanguageSelectorProps {
  value: string;
  onChange: (language: string) => void;
  label: string;
  showDetect?: boolean;
}

const LANGUAGES = [
  'Detect language',
  'Acehnese*',
  'Afrikaans*',
  'Albanian*',
  'Arabic',
  'Aragonese*',
  'Armenian*',
  'Assamese*',
  'Aymara*',
  'Azerbaijani*',
  'Bashkir*',
  'Basque*',
  'Belarusian*',
  'Bengali',
  'Bosnian',
  'Bulgarian',
  'Burmese',
  'Catalan',
  'Chinese (Simplified)',
  'Chinese (Traditional)',
  'Croatian',
  'Czech',
  'Danish',
  'Dutch',
  'English',
  'English (American)',
  'English (British)',
  'Estonian',
  'Finnish',
  'French',
  'Galician',
  'Georgian',
  'German',
  'Greek',
  'Gujarati',
  'Haitian Creole',
  'Hebrew',
  'Hindi',
  'Hungarian',
  'Icelandic',
  'Indonesian',
  'Irish',
  'Italian',
  'Japanese',
  'Kannada',
  'Kazakh',
  'Khmer',
  'Korean',
  'Kurdish (Kurmanji)*',
  'Kurdish (Sorani)*',
  'Kyrgyz*',
  'Lao',
  'Latin*',
  'Latvian',
  'Lingala*',
  'Lithuanian',
  'Lombard*',
  'Luxembourgish*',
  'Macedonian*',
  'Maithili*',
  'Malagasy*',
  'Malay',
  'Malayalam',
  'Maltese',
  'Marathi',
  'Mongolian',
  'Nepali',
  'Norwegian',
  'Pashto',
  'Persian',
  'Polish',
  'Portuguese',
  'Portuguese (Brazilian)',
  'Punjabi',
  'Romanian',
  'Russian',
  'Serbian',
  'Sinhala',
  'Slovak',
  'Slovenian',
  'Spanish',
  'Swahili',
  'Swedish',
  'Tagalog',
  'Tamil',
  'Telugu',
  'Thai',
  'Turkish',
  'Ukrainian',
  'Urdu',
  'Uzbek',
  'Vietnamese',
  'Welsh',
  'Yiddish',
];

const SUGGESTED_LANGUAGES = [
  'English',
  'French',
  'Spanish',
  'German',
  'Japanese',
  'Italian',
];

export default function LanguageSelector({ value, onChange, label: _label, showDetect = false }: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLanguages = LANGUAGES.filter((lang) => {
    if (!showDetect && lang === 'Detect language') return false;
    return lang.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleSelect = (language: string) => {
    onChange(language);
    setIsOpen(false);
    setSearchQuery('');
  };
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2 min-w-[200px] justify-between"
      >
        <span style={{color:"grey"}}>{value}</span>
        <ChevronUp className={`w-4 h-4 transition-transform ${isOpen ? '' : 'rotate-180'}`} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full mt-2 w-[600px] bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[500px] flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search languages"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {!searchQuery && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Suggested languages</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {SUGGESTED_LANGUAGES.map((lang) => (
                      <button
                        key={lang}
                        onClick={() => handleSelect(lang)}
                        className={`px-4 py-2 text-left rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-between ${
                          value === lang ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                        }`}
                      >
                        <span>{lang}</span>
                        {value === lang && <Check className="w-4 h-4 text-blue-700" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">All languages</h4>
                <div className="grid grid-cols-2 gap-1">
                  {filteredLanguages.map((lang) => (
                    <button
                      key={lang}
                      onClick={() => handleSelect(lang)}
                      className={`px-4 py-2 text-left text-sm rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-between ${
                        value === lang ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                      }`}
                    >
                      <span>{lang}</span>
                      {value === lang && <Check className="w-4 h-4 text-blue-700" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
