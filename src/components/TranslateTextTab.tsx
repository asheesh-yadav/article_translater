import { useState, useRef, useEffect } from 'react';
import { ArrowLeftRight, Bold, Italic, MoreHorizontal, Copy, ChevronDown, FileText, Cloud, Wand2, Briefcase, MessageCircle, Maximize2, Minimize2, Link2, ThumbsUp, Sparkles, Scissors, PenLine, GraduationCap, Smile, Megaphone } from 'lucide-react';
import LanguageSelector from './LanguageSelector';
interface TranslateTextTabProps {
  onToggleSidebar: () => void;
  formality: 'default' | 'formal' | 'informal';
  onFormalityChange: (formality: 'default' | 'formal' | 'informal') => void;
  onDetectedLanguageChange: (language: string | null) => void;
}
export default function TranslateTextTab({ onToggleSidebar, formality, onFormalityChange: _onFormalityChange, onDetectedLanguageChange }: TranslateTextTabProps) {
  const [sourceText, setSourceText] = useState('');
  const [targetText, setTargetText] = useState('');
  const newVariant = Date.now();

  const [sourceLang, setSourceLang] = useState(() => {
    try {
      return localStorage.getItem('omni.pref.sourceLang') || 'Detect language';
    } catch {
      return 'Detect language';
    }
  });
  const [targetLang, setTargetLang] = useState(() => {
    try {
      return localStorage.getItem('omni.pref.targetLang') || 'English';
    } catch {
      return 'English';
    }
  });
  const [detectedLanguage, setDetectedLanguage] = useState<string | null>(null);
  const [translating, setTranslating] = useState(false);
  const [activeMode, setActiveMode] = useState<'text' | 'files' | 'write'>('text');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [translatingFile, setTranslatingFile] = useState(false);
  const [translatedFileUrl, setTranslatedFileUrl] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [translationError, setTranslationError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Array<{text: string, label: string, type: string}>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  // Variant seed for regenerations
  const [writeVariant, setWriteVariant] = useState<number>(Date.now());
  // Track last requested write mode to support regeneration
  const [lastWriteMode, setLastWriteMode] = useState<'default' | 'formal' | 'informal' | 'concise' | 'expand' | 'simplify' | 'polish' | 'academic' | 'friendly' | 'persuasive' | 'clarify'>('default');
  // Omnitrix Write settings
  const [writeDefaultMode, setWriteDefaultMode] = useState<'default' | 'formal' | 'informal' | 'concise' | 'expand' | 'simplify' | 'polish' | 'academic' | 'friendly' | 'persuasive' | 'clarify'>(() => {
    try {
      const v = (localStorage.getItem('omni.write.defaultMode') || 'default') as any;
      return ['default','formal','informal','concise','expand','simplify','polish','academic','friendly','persuasive','clarify'].includes(v) ? v : 'default';
    } catch { return 'default'; }
  });
  const [writeMaxSuggestions, setWriteMaxSuggestions] = useState<number>(() => {
    try {
      const v = parseInt(localStorage.getItem('omni.write.maxSuggestions') || '9', 10);
      return isNaN(v) ? 9 : Math.min(9, Math.max(8, v));
    } catch { return 9; }
  });
  const [showWriteStyleTips, setShowWriteStyleTips] = useState<boolean>(() => {
    try {
      return (localStorage.getItem('omni.write.showStyleTips') ?? 'true') === 'true';
    } catch { return true; }
  });
  const [engineMode, setEngineMode] = useState<'ai' | 'local'>(() => {
    try {
      return (localStorage.getItem('omni.engine.mode') || 'ai') as any;
    } catch { return 'ai'; }
  });
  const [showAskMenu, setShowAskMenu] = useState(false);
  const supabaseReady = !!import.meta.env.VITE_SUPABASE_URL && !!import.meta.env.VITE_SUPABASE_ANON_KEY;
  const [writeVariationLevel, setWriteVariationLevel] = useState<number>(() => {
    try {
      const v = parseInt(localStorage.getItem('omni.write.variationLevel') || '2', 10);
      return [1,2,3].includes(v) ? v : 2;
    } catch { return 2; }
  });

  const swapLanguages = () => {
    const temp = sourceLang;
    setSourceLang(targetLang);
    setTargetLang(temp);
    setSourceText(targetText);
    setTargetText(sourceText);
  };

 const handleTranslate = async (text: string) => {
  if (!text.trim()) {
    setTargetText('');
    onDetectedLanguageChange(null);
    setTranslationError(null);
    return;
  }

  // ✅ WRITE MODE → use correct handler
  if (activeMode === 'write') {
    handleImproveText(lastWriteMode || writeDefaultMode);
    return;
  }

  setTranslating(true);
  setTranslationError(null);

  try {
    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/translate-text`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        text,
        sourceLang,
        targetLang,
        formality,
        preserveFormatting: true,
      }),
    });

    if (response.ok) {
      const data = await response.json();

      if (data.translatedText) {
        setTargetText(data.translatedText);
        setTranslationError(null);
      } else {
        setTranslationError('Translation returned empty result');
      }

      if (data.detectedLanguage) {
        onDetectedLanguageChange(data.detectedLanguage);
        setDetectedLanguage(data.detectedLanguage);
      }
    } else {
      const errorText = await response.text();
      console.error('Translation failed:', response.status, errorText);
      setTranslationError(`Translation failed (${response.status}). Please try again.`);
    }
  } catch (error) {
    console.error('API error:', error);
    setTranslationError('Unable to connect to service. Please check your internet connection.');
  } finally {
    setTranslating(false);
  }
};


  const handleSourceTextChange = (text: string) => {
    setSourceText(text);

    if (activeMode === 'write') {
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      handleTranslate(text);
    }, 500);
  };

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (sourceText.trim() && activeMode !== 'write') {
      handleTranslate(sourceText);
    }
  }, [formality]);

  useEffect(() => {
    const handler = () => {
      if (!sourceText.trim()) return;
      setActiveMode('write');
      handleImproveText('clarify');
    };
    const fn = handler as EventListener;
    window.addEventListener('omni:clarify', fn);
    return () => {
      window.removeEventListener('omni:clarify', fn);
    };
  }, [sourceText]);

const handleImproveText = async (mode: string) => {
  if (!sourceText.trim()) {
    setTranslationError('Enter text to rewrite');
    return;
  }

  setTranslating(true);
  setTranslationError(null);
  setSuggestions([]);
  setLastWriteMode(mode as any);

  try {
    const base = sourceText.trim();

    const variationsMap: Record<string, string[]> = {
      default: [
        `${base}`,
        `Here's a fresh take on your text: ${base}.`,
        `🔹 Refined version: ${base}, enhanced for clarity and readability.`,
      ],
      fluent: [
        `💨 Effortlessly readable: ${base}, now flowing naturally like a conversation.`,
        `${base} 🌟 Rewritten to feel smooth and seamless.`,
        `✍️ Polished for easy comprehension: ${base}.`,
      ],
      casual: [
        `Hey! 😎 Just a chill spin: ${base}.`,
        `Yo! ✌️ ${base} — short, snappy, and friendly.`,
        `${base} 🤗 Simple and casual for everyday use.`,
      ],
      formal: [
        `📄 Kindly be informed that ${base}.`,
        `Please consider the following: ${base}.`,
        `It is formally requested that ${base}.`,
      ],
      expand: [
        `🔍 Let’s elaborate: ${base}. Here’s a deeper explanation with context and insight.`,
        `📖 Expanded version: ${base}. Additional details added for clarity and comprehension.`,
        `💡 Full breakdown: ${base}. Now enriched with context, nuance, and explanation.`,
      ],
      shorten: [
        `✂️ Condensed: ${base.split('.').slice(0, 1).join('.')}`,
        `Quick summary: ${base.replace(/,\s*/g, ' ')}.`,
        `📌 Short and snappy: ${base.replace(/\b(very|really|quite|basically)\b/gi, '').trim()}.`,
      ],
      simplify: [
        `🟢 Simply put: ${base}, easy to understand for everyone.`,
        `In plain words: ${base} ✅ No jargon, just clarity.`,
        `${base} 🌼 Explained simply and clearly.`,
      ],
      polish: [
        `✨ Polished for excellence: ${base}, sounding professional and smooth.`,
        `💎 Refined wording: ${base}. Crafted for a clean and elegant flow.`,
        `🖋️ Enhanced style: ${base}. Optimized for readability and tone.`,
      ],
      academic: [
        `📚 From an academic standpoint: ${base}, backed by logical reasoning.`,
        `Research suggests that ${base}. 🧠`,
        `In scholarly terms: ${base}, demonstrating insight and clarity.`,
      ],
      friendly: [
        `Hey friend! 😊 Just thought you might like: ${base}.`,
        `🌈 Friendly note: ${base}, hope it makes sense!`,
        `💬 Warmly rewritten: ${base} — casual and approachable.`,
      ],
      persuasive: [
        `🔥 Important! ${base} — here’s why this matters.`,
        `💡 Convincing version: ${base}, clearly highlighting significance and impact.`,
        `🏆 Persuasive take: ${base}. Crafted to motivate and engage.`,
      ],
      clarify: [
        `🔍 To clarify: ${base}. Making the meaning crystal clear.`,
        `Simply put: ${base} 📝 So there’s no confusion.`,
        `Here’s what it actually means: ${base} ✅ Explained step by step.`,
      ],
    };

    const variations = variationsMap[mode] ?? variationsMap.default;

    await new Promise((res) => setTimeout(res, 300));

    setTargetText(variations[0]);
    setSuggestions(
      variations.map((text, i) => ({
        text,
        label: `Option ${i + 1}`,
        type: mode,
      }))
    );
  } catch (err) {
    console.error(err);
    setTranslationError('Rewrite failed');
  } finally {
    setTranslating(false);
  }
};




  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setTranslatedFileUrl(null);
      setFileError(null);
    }
  };

  const handleChooseFile = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      setSelectedFile(file);
      setTranslatedFileUrl(null);
      setFileError(null);
    }
  };

  const handleTranslateFile = async () => {
    if (!selectedFile) return;

    setTranslatingFile(true);
    setTranslatedFileUrl(null);
    setFileError(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('sourceLang', sourceLang);
      formData.append('targetLang', targetLang);

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/translate-file`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setTranslatedFileUrl(url);
        setFileError(null);
      } else {
        const errorData = await response.json();
        setFileError(errorData.error || 'Translation failed. Please try again.');
      }
    } catch (error) {
      console.error('File translation error:', error);
      setFileError('Unable to connect to translation service. Please try again.');
    } finally {
      setTranslatingFile(false);
    }
  };


  return (
    <div className="flex-1 flex flex-col">
      <div className="border-b border-gray-200 bg-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center border border-gray-300 rounded-full overflow-hidden">
            <button
              onClick={() => setActiveMode('text')}
              className={`px-4 py-1.5 text-sm ${activeMode === 'text' ? 'bg-blue-50 text-blue-700' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
            >
              Translate text
            </button>
            <button
              onClick={() => setActiveMode('files')}
              className={`px-4 py-1.5 text-sm ${activeMode === 'files' ? 'bg-blue-50 text-blue-700' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
            >
              Translate files
            </button>
            <button
              onClick={() => setActiveMode('write')}
              className={`px-4 py-1.5 text-sm ${activeMode === 'write' ? 'bg-blue-50 text-blue-700' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
            >
              LexiMorph Write
            </button>
          </div>
        </div>
        <button
          onClick={onToggleSidebar}
          className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-full text-sm font-medium hover:bg-gray-50 "
        >
          Expand
        </button>
      </div>

      {activeMode === 'text' && (
        <div className="flex-1 flex">
          <div className="flex-1 flex flex-col border-r border-gray-200">
          <div className="border-b border-gray-200 px-6 py-3 flex flex-col gap-2 bg-gray-50">
            <LanguageSelector
              value={sourceLang}
              onChange={(lang) => {
                setSourceLang(lang);
                if (lang !== 'Detect language') {
                  setDetectedLanguage(null);
                }
              }}
              label="Select source language"
              showDetect={true}
            />
            {detectedLanguage && sourceLang === 'Detect language' && (
              <div className="px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-xs">
                <span className="text-blue-700">Detected: </span>
                <span className="font-semibold text-blue-800">{detectedLanguage}</span>
              </div>
            )}
          </div>

          <div className="border-b border-gray-200 px-4 py-2 flex items-center gap-2 bg-white">
            <button className="p-2 hover:bg-gray-100 rounded text-gray-600">
              <Bold className="w-4 h-4" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded text-gray-600">
              <Italic className="w-4 h-4" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded text-gray-600">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 relative flex flex-col">
            <textarea
              value={sourceText}
              onChange={(e) => handleSourceTextChange(e.target.value)}
              placeholder="Type to translate."
              className="flex-1 w-full p-6 text-lg resize-none focus:outline-none omTraslate"
            />
            {!sourceText && (
              <div className="absolute inset-x-6 top-20 text-sm text-gray-500">
                <p>Drag and drop to translate Word (.docx), PowerPoint</p>
                <p>(.pptx), Excel (.xlsx), Text (.txt), and SubRip (.srt) files with our document translator.</p>
              </div>
            )}
            <div className="px-6 pb-3 text-xs text-gray-500 border-t border-gray-100 pt-2">
              <span>{sourceText.length} characters</span>
              {sourceText && sourceText.split(/\s+/).filter(w => w.length > 0).length > 0 && (
                <span className="ml-4">{sourceText.split(/\s+/).filter(w => w.length > 0).length} words</span>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={swapLanguages}
          className="absolute left-1/2 top-32 -translate-x-1/2 w-10 h-10 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 shadow-sm z-10"
        >
          <ArrowLeftRight className="w-5 h-5 text-gray-600" />
        </button>

        <div className="flex-1 flex flex-col bg-gray-50">
          <div className="border-b border-gray-200 px-6 py-3 flex items-center justify-between">
            <LanguageSelector
              value={targetLang}
              onChange={setTargetLang}
              label="Select target language"
              showDetect={false}
            />
          </div>

          <div className="flex-1 relative">
            <div className="w-full min-h-screen p-6 text-lg overflow-y-auto">
              {translating ? (
                <div className="flex items-center gap-2 text-gray-500">
                  <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full" />
                  Translating...
                </div>
              ) : translationError ? (
                <div className="flex items-start gap-2 text-red-600 bg-red-50 p-4 rounded-lg">
                  <span className="text-red-600">⚠</span>
                  <div>
                    <p className="font-medium">Translation Error</p>
                    <p className="text-sm mt-1">{translationError}</p>
                  </div>
                </div>
              ) : (
                <p className="text-dark-900 whitespace-pre-wrap omTraslate">{targetText}</p>
              )}
            </div>
            {targetText && !translationError && (
              <button
                onClick={() => navigator.clipboard.writeText(targetText)}
                className="absolute top-6 right-6 p-2 hover:bg-gray-200 rounded text-gray-600"
                title="Copy to clipboard"
              >
                <Copy className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        </div>
      )}

      {activeMode === 'files' && (
        <div className="flex-1 flex bg-white">
          <div className="flex-1 flex flex-col">
            <div className="border-b border-gray-200 bg-white px-8 py-4">
              <div className="flex items-center justify-center gap-3 max-w-2xl mx-auto">
                <LanguageSelector
                  value={sourceLang}
                  onChange={setSourceLang}
                  label="Select source language"
                  showDetect={true}
                />

                <ArrowLeftRight className="w-5 h-5 text-gray-400" />

                <LanguageSelector
                  value={targetLang}
                  onChange={setTargetLang}
                  label="Select target language"
                  showDetect={false}
                />
              </div>
            </div>

            <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
              <div className="text-center max-w-3xl w-full">
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-12 transition-colors ${
                    isDragging
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 bg-white'
                  }`}
                >

                 {/* teanslate files text */}
<div className="my-6 text-center">
  <div className="inline-block px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-lg text-white max-w-3xl mx-auto">
    <h2 className="text-xl md:text-2xl font-semibold mb-2">
      Translate & Download your documents with ease!
    </h2>
    <p className="text-sm md:text-base text-blue-100">
      Simply upload your Word, Excel, or PowerPoint files, and get them translated instantly. 
      Once done, you can <span className="font-semibold underline">download the translated file</span> directly.  
      Supported formats: <span className="font-medium">.docx, .pptx, .xlsx, .txt, .srt</span>. 
      PDF support is coming soon! 🚀
    </p>
  </div>
</div>



                  <div className="flex justify-center gap-6 mb-8">
                    <div className="w-20 h-24 bg-red-50 rounded-lg flex items-center justify-center border border-red-100">
                      <div className="text-center">
                        <div className="w-12 h-12 mx-auto mb-1 bg-red-100 rounded flex items-center justify-center">
                          <FileText className="w-6 h-6 text-red-600" />
                        </div>
                        <span className="text-xs font-semibold text-red-600">PDF</span>
                      </div>
                    </div>
                    <div className="w-20 h-24 bg-blue-50 rounded-lg flex items-center justify-center border border-blue-100">
                      <div className="text-center">
                        <div className="w-12 h-12 mx-auto mb-1 bg-blue-100 rounded flex items-center justify-center">
                          <FileText className="w-6 h-6 text-blue-600" />
                        </div>
                        <span className="text-xs font-semibold text-blue-600">W</span>
                      </div>
                    </div>
                    <div className="w-20 h-24 bg-green-50 rounded-lg flex items-center justify-center border border-green-100">
                      <div className="text-center">
                        <div className="w-12 h-12 mx-auto mb-1 bg-green-100 rounded flex items-center justify-center">
                          <FileText className="w-6 h-6 text-green-600" />
                        </div>
                        <span className="text-xs font-semibold text-green-600">X</span>
                      </div>
                    </div>
                    <div className="w-20 h-24 bg-orange-50 rounded-lg flex items-center justify-center border border-orange-100">
                      <div className="text-center">
                        <div className="w-12 h-12 mx-auto mb-1 bg-orange-100 rounded flex items-center justify-center">
                          <FileText className="w-6 h-6 text-orange-600" />
                        </div>
                        <span className="text-xs font-semibold text-orange-600">P</span>
                      </div>
                    </div>
                  </div>

                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    Drag your documents here, or
                  </h3>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".docx,.pptx,.xlsx,.txt,.srt"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  <div className="flex items-center justify-center gap-4 mb-6">
                    <button
                      onClick={handleChooseFile}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm"
                    >
                      Select from your computer
                    </button>
                    <button className="px-6 py-3 bg-white text-blue-600 border border-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors flex items-center gap-2">
                      <Cloud className="w-5 h-5" />
                      Select from OneDrive
                    </button>
                  </div>

                  <p className="text-sm text-gray-500">
                    Currently supported: .docx, .pptx, .xlsx, .txt, .srt. PDF support is coming soon.
                    {' '}
                    <a href="#" className="text-blue-600 hover:underline">
                      Learn more
                    </a>
                  </p>
                </div>

                {selectedFile && (
                  <div className="mt-6 p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
                    <p className="text-sm text-gray-600 mb-2">Selected file:</p>
                    <p className="font-medium text-gray-900">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {(selectedFile.size / 1024).toFixed(2)} KB
                    </p>
                    <div className="flex items-center justify-center gap-3 mt-4">
                      <button
                        onClick={handleTranslateFile}
                        disabled={translatingFile}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {translatingFile ? 'Translating...' : 'Translate file'}
                      </button>
                      {translatedFileUrl && (
                        <a
                          href={translatedFileUrl}
                          download={`translated_${selectedFile.name}`}
                          className="px-6 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors inline-block"
                        >
                          Download translated file
                        </a>
                      )}
                    </div>
                    {fileError && (
                      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-700">{fileError}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="w-80 border-l border-gray-200 bg-gray-50 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold" style={{color:"black"}}>Editing tools</h3>
            </div>

            <div className="mb-6">
              <button className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-between text-sm text-gray-700">
                <span>Formality</span>
              </button>
            </div>

            <div className="mb-6">
              <h4 className="text-sm font-semibold  mb-3"  style={{color:"black"}}>Customizations</h4>
              <button className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-between text-sm mb-2">
                <span className="text-gray-700">Glossaries 0/1</span>
                <div className="w-5 h-5 bg-gray-300 rounded-full"></div>
              </button>
              <button className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-between text-sm">
                <span className="text-gray-700">Style rules</span>
                <div className="w-5 h-5 bg-gray-300 rounded-full"></div>
              </button>
            </div>

            <div>
              <h4 className="text-sm font-semibold  mb-3"  style={{color:"black"}}>Powered by</h4>
              <div className="px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-600">
                Language model
              </div>
            </div>
          </div>
        </div>
      )}

      {activeMode === 'write' && (
        <div className="flex-1 flex flex-col">
          <div className="border-b border-gray-200 bg-white px-6 py-3">
            <div className="flex items-center gap-2 overflow-x-auto relative">
              <button
                onClick={() => handleImproveText('default')}
                disabled={!sourceText.trim()}
                className={`flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-300 rounded-full text-sm font-medium transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed ${lastWriteMode==='default' ? 'text-purple-700 border-purple-300 bg-purple-50' : 'text-gray-700'}`}
              >
                <Wand2 className="w-4 h-4 text-purple-600" />
                Fluent
              </button>
              <button
                onClick={() => handleImproveText('formal')}
                disabled={!sourceText.trim()}
                className={`flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-300 rounded-full text-sm font-medium transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed ${lastWriteMode==='formal' ? 'text-purple-700 border-purple-300 bg-purple-50' : 'text-gray-700'}`}
              >
                <Briefcase className="w-4 h-4 text-purple-600" />
                Formal
              </button>
              <button
                onClick={() => handleImproveText('informal')}
                disabled={!sourceText.trim()}
                className={`flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-300 rounded-full text-sm font-medium transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed ${lastWriteMode==='informal' ? 'text-purple-700 border-purple-300 bg-purple-50' : 'text-gray-700'}`}
              >
                <MessageCircle className="w-4 h-4 text-purple-600" />
                Casual
              </button>
              <button
                onClick={() => handleImproveText('expand')}
                disabled={!sourceText.trim()}
                className={`flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-300 rounded-full text-sm font-medium transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed ${lastWriteMode==='expand' ? 'text-purple-700 border-purple-300 bg-purple-50' : 'text-gray-700'}`}
              >
                <Maximize2 className="w-4 h-4 text-purple-600" />
                Expand
              </button>
              <button
                onClick={() => handleImproveText('concise')}
                disabled={!sourceText.trim()}
                className={`flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-300 rounded-full text-sm font-medium transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed ${lastWriteMode==='concise' ? 'text-purple-700 border-purple-300 bg-purple-50' : 'text-gray-700'}`}
              >
                <Minimize2 className="w-4 h-4 text-purple-600" />
                Shorten
              </button>
              <button
                onClick={() => handleImproveText('academic')}
                disabled={!sourceText.trim()}
                className={`flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-300 rounded-full text-sm font-medium transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed ${lastWriteMode==='academic' ? 'text-purple-700 border-purple-300 bg-purple-50' : 'text-gray-700'}`}
              >
                <GraduationCap className="w-4 h-4 text-purple-600" />
                Academic
              </button>
              <button
                onClick={() => handleImproveText('friendly')}
                disabled={!sourceText.trim()}
                className={`flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-300 rounded-full text-sm font-medium transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed ${lastWriteMode==='friendly' ? 'text-purple-700 border-purple-300 bg-purple-50' : 'text-gray-700'}`}
              >
                <Smile className="w-4 h-4 text-purple-600" />
                Friendly
              </button>
            
              {/* <button className="flex items-center gap-2 px-2.5 py-1.5 bg-white hover:bg-gray-50 border border-gray-300 rounded-full text-sm font-medium text-gray-700 transition-colors whitespace-nowrap">
                <Link2 className="w-4 h-4 text-purple-600" />
              </button> */}
              {/* <button className="flex items-center gap-2 px-2.5 py-1.5 bg-white hover:bg-gray-50 border border-gray-300 rounded-full text-sm font-medium text-gray-700 transition-colors whitespace-nowrap">
                <ThumbsUp className="w-4 h-4 text-purple-600" />
              </button>
              <button className="flex items-center gap-2 px-2.5 py-1.5 bg-white hover:bg-gray-50 border border-gray-300 rounded-full text-sm font-medium text-gray-700 transition-colors whitespace-nowrap">
                <ChevronDown className="w-4 h-4 text-purple-600" />
              </button> */}
              <div className="ml-auto flex items-center gap-2">
                {/* <div className="flex items-center border border-gray-300 rounded-full overflow-hidden">
                  <button
                    onClick={() => { setEngineMode('ai'); localStorage.setItem('omni.engine.mode','ai'); }}
                    className={`px-3 py-1.5 text-xs ${engineMode==='ai' ? 'bg-purple-100 text-purple-700' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                    title="AI + Local"
                  >
                    AI + Local
                  </button>
                  <button
                    onClick={() => { setEngineMode('local'); localStorage.setItem('omni.engine.mode','local'); }}
                    className={`px-3 py-1.5 text-xs ${engineMode==='local' ? 'bg-purple-100 text-purple-700' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                    title="Local only"
                  >
                    Local only
                  </button>
                </div> */}
                {/* <div className={`flex items-center gap-1 px-2 py-2 text-xs rounded ${supabaseReady ? 'text-green-700 bg-green-50 border border-green-200' : 'text-gray-600 bg-gray-50 border border-gray-200'}`}>
                  <span className={`w-2 h-2 rounded-full ${supabaseReady ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                  {supabaseReady ? 'Connected' : 'Local mode'}
                </div> */}
                <div className="relative">
                  {/* <button
                    onClick={() => handleImproveText(writeDefaultMode)}
                    disabled={!sourceText.trim()}
                    className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg text-sm font-medium transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Sparkles className="w-4 h-4" />
                    Ask AI
                  </button> */}
                  {/* <button
                    onClick={() => setShowAskMenu((v) => !v)}
                    className="absolute right-0 -mr-2 top-1/2 -translate-y-1/2 translate-x-full px-2 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                    title="Default Ask AI action"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button> */}
                  {showAskMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                      {['default','formal','informal','concise','expand','simplify','polish','academic','friendly','persuasive','clarify'].map((m) => (
                        <button
                          key={m}
                          onClick={() => { setWriteDefaultMode(m as 'default' | 'formal' | 'informal' | 'concise' | 'expand' | 'simplify' | 'polish' | 'academic' | 'friendly' | 'persuasive' | 'clarify'); localStorage.setItem('omni.write.defaultMode', m); setShowAskMenu(false); }}
                          className={`w-full text-left px-3 py-2 text-sm ${writeDefaultMode===m ? 'bg-purple-50 text-purple-700' : 'hover:bg-gray-50 text-gray-700'}`}
                        >
                          {m==='default' ? 'Fluent' : m[0].toUpperCase()+m.slice(1)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="px-2 mt-2">
              <div className="h-1 bg-gray-200 rounded-full">
                <div className="h-1 w-24 bg-purple-200 rounded-full"></div>
              </div>
            </div>
          </div>

          <div className="flex-1 flex">
            <div className="flex-1 flex flex-col border-r border-gray-200">
              <div className="flex-1 relative flex flex-col">
                <textarea
                  value={sourceText}
                  onChange={(e) => handleSourceTextChange(e.target.value)}
                  placeholder="Write or paste text, and hit Rewrite (Ctrl+D)"
                  className="flex-1 w-full p-6 text-lg resize-none focus:outline-none omTraslate"
                />
                <div className="absolute bottom-3 left-6 right-6 text-xs text-gray-500">
                  <span>{sourceText.length} characters</span>
                  {sourceText && sourceText.split(/\s+/).filter(w => w.length > 0).length > 0 && (
                    <span className="ml-4">{sourceText.split(/\s+/).filter(w => w.length > 0).length} words</span>
                  )}
                </div>
              </div>
            </div>

          <div className="flex-1 flex flex-col bg-gray-50">
            <div className="border-b border-gray-200 px-6 py-3 flex items-center justify-between bg-white">
              <h3 className="font-semibold text-gray-900">AI Suggestions</h3>
              {targetText && (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setWriteVariant((v) => v + 1);
                      handleImproveText(lastWriteMode);
                    }}
                    className="text-xs text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
                    title="Regenerate suggestions"
                  >
                    <Sparkles className="w-3 h-3" />
                    Regenerate
                  </button>
                  <button
                    onClick={() => navigator.clipboard.writeText(targetText)}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    Copy
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-auto p-6">
              {translating ? (
                <div className="flex items-center gap-2 text-gray-500">
                  <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full" />
                  Analyzing your text...
                </div>
              ) : translationError ? (
                <div className="flex items-start gap-2 text-red-600 bg-red-50 p-4 rounded-lg">
                  <span className="text-red-600">⚠</span>
                  <div>
                    <p className="font-medium">Analysis Error</p>
                    <p className="text-sm mt-1">{translationError}</p>
                  </div>
                </div>
              ) : targetText ? (
                <div className="space-y-4">
                  {suggestions.length > 0 ? (
                    <div className="space-y-3">
                      <h4 className="text-xs font-semibold uppercase tracking-wide px-1" style={{color:'black'}}>Multiple Suggestions</h4>
                      {suggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          onClick={() => setTargetText(suggestion.text)}
                          className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:border-purple-300 hover:shadow-md transition-all cursor-pointer group"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                              {suggestion.label}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(suggestion.text);
                              }}
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-purple-600"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <p className="text-gray-900 leading-relaxed">{suggestion.text}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Improved Version</span>
                      </div>
                      <p className="text-gray-900 leading-relaxed whitespace-pre-wrap">{targetText}</p>
                    </div>
                  )}

                  {showWriteStyleTips && (
                  <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border border-purple-200 p-4">
                    <h4 className="text-sm font-semibold  mb-2 flex items-center gap-2" style={{color:'black'}}>
                      <span className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs">✨</span>
                      Try Different Styles
                    </h4>
                    <div className="space-y-2">
                      <button
                        onClick={() => handleImproveText('formal')}
                        className="w-full text-left px-3 py-2 bg-white hover:bg-purple-50 rounded-lg text-sm text-gray-700 hover:text-purple-700 transition-colors border border-gray-200"
                      >
                        Make it more formal
                      </button>
                      <button
                        onClick={() => handleImproveText('informal')}
                        className="w-full text-left px-3 py-2 bg-white hover:bg-purple-50 rounded-lg text-sm text-gray-700 hover:text-purple-700 transition-colors border border-gray-200"
                      >
                        Make it more casual
                      </button>
                      <button
                        onClick={() => handleImproveText('concise')}
                        className="w-full text-left px-3 py-2 bg-white hover:bg-purple-50 rounded-lg text-sm text-gray-700 hover:text-purple-700 transition-colors border border-gray-200"
                      >
                        Make it shorter
                      </button>
                      <button
                        onClick={() => handleImproveText('expand')}
                        className="w-full text-left px-3 py-2 bg-white hover:bg-purple-50 rounded-lg text-sm text-gray-700 hover:text-purple-700 transition-colors border border-gray-200"
                      >
                        Add more detail
                      </button>
                      <button
                        onClick={() => handleImproveText('clarify')}
                        className="w-full text-left px-3 py-2 bg-white hover:bg-purple-50 rounded-lg text-sm text-gray-700 hover:text-purple-700 transition-colors border border-gray-200"
                      >
                        Make it clearer
                      </button>
                    </div>
                  </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-gray-400 py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <p className="text-sm">Start writing to get AI-powered suggestions</p>
                </div>
              )}
            </div>
          </div>
          </div>
        </div>
      )}

      {activeMode === 'text' && sourceText && (
        <div className="border-t border-gray-200 px-6 py-3 bg-white">
          <div className="text-sm font-semibold text-blue-600 cursor-pointer hover:text-blue-700">
            Dictionary
          </div>
          <div className="text-xs text-gray-500 mt-0.5">
            Click on a word to look it up.
          </div>
        </div>
      )}
    </div>
  );
}
