import { useState, useRef } from 'react';
import { Download, Loader2, AlertCircle, Languages, Highlighter } from 'lucide-react';
import { extractArticle } from '../utils/articleExtractor';
import { generateWordDocument, downloadWordDocument } from '../utils/wordGenerator';
import { ArticleContent } from '../types/article';
import ArticlePreview from './ArticlePreview';
import LanguageSelector from './LanguageSelector';
import { Copy } from 'lucide-react';


export default function ArticleTranslatorTab() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [article, setArticle] = useState<ArticleContent | null>(null);
  const [sourceLanguage, setSourceLanguage] = useState(() => {
    try {
      return localStorage.getItem('omni.pref.sourceLang') || 'Detect language';
    } catch {
      return 'Detect language';
    }
  });
  const [detectedLanguage, setDetectedLanguage] = useState<string | null>(null);
  const [targetLanguage, setTargetLanguage] = useState(() => {
    try {
      return localStorage.getItem('omni.pref.targetLang') || 'English';
    } catch {
      return 'English';
    }
  });
  const [translating, setTranslating] = useState(false);
  const [keywords, setKeywords] = useState('');
  const [translatedArticle, setTranslatedArticle] = useState<ArticleContent | null>(null);
  const [translatedKeywords, setTranslatedKeywords] = useState<string[]>([]);
  const previewRef = useRef<HTMLDivElement>(null);

  const handleExtract = async () => {
    if (!url.trim()) {
      setError('Please enter a valid URL');
      return;
    }

    setLoading(true);
    setError('');
    setArticle(null);

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-article`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Fetch error:', response.status, errorData);
        throw new Error(errorData.error || 'Failed to fetch article');
      }

      const { html } = await response.json();

      console.log('handleExtract - Received HTML length:', html?.length);

      if (!html) {
        throw new Error('No HTML content received');
      }

      const extractedArticle = await extractArticle(html);
      console.log('handleExtract - Extracted article:', {
        title: extractedArticle.title,
        contentLength: extractedArticle.content?.length,
        firstElement: extractedArticle.content?.[0]
      });

      setArticle(extractedArticle);

      if (sourceLanguage === 'Detect language') {
        detectArticleLanguage(extractedArticle.title);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to extract article. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const detectArticleLanguage = async (text: string) => {
    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(text.substring(0, 100))}`;
      const response = await fetch(url);

      if (response.ok) {
        const data = await response.json();
        if (data && data[2]) {
          const langCode = data[2];
          const languageNames: { [key: string]: string } = {
            'en': 'English',
            'es': 'Spanish',
            'fr': 'French',
            'de': 'German',
            'it': 'Italian',
            'pt': 'Portuguese',
            'ru': 'Russian',
            'zh-CN': 'Chinese (Simplified)',
            'zh-TW': 'Chinese (Traditional)',
            'ja': 'Japanese',
            'ko': 'Korean',
            'ar': 'Arabic',
            'hi': 'Hindi',
            'tr': 'Turkish',
            'nl': 'Dutch',
            'pl': 'Polish',
            'hu': 'Hungarian',
          };
          const detectedLang = languageNames[langCode] || langCode.toUpperCase();
          setDetectedLanguage(detectedLang);
          console.log('Detected language:', detectedLang);
        }
      }
    } catch (error) {
      console.error('Language detection error:', error);
    }
  };

  const handleDownloadOriginal = async () => {
    if (!article) {
      setError('No article available to download');
      return;
    }

    setLoading(true);
    setError('');
    try {
      console.log('handleDownloadOriginal - Starting with article:', {
        hasTitle: !!article.title,
        hasContent: !!article.content,
        contentLength: article.content?.length
      });

      const keywordList = keywords.split(',').map(k => k.trim()).filter(k => k.length > 0);
      console.log('handleDownloadOriginal - Keywords:', keywordList);

      const blob = await generateWordDocument(article, keywordList,url);
      console.log('handleDownloadOriginal - Blob generated:', blob.size, 'bytes');

      const filename = article.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      downloadWordDocument(blob, `${filename}-original`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to generate Word document: ${errorMessage}`);
      console.error('handleDownloadOriginal error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadBoth = async () => {
    if (!article || !targetLanguage) return;

    setLoading(true);
    setTranslating(true);
    setError('');
    try {
      const keywordList = keywords.split(',').map(k => k.trim()).filter(k => k.length > 0);
      console.log('handleDownloadBoth - Original keywords:', keywordList);

      const { article: translatedContent, keywords: translatedKeywords, sourceKeywords } = await translateArticle(article, targetLanguage, keywordList);
      console.log('handleDownloadBoth - Translation result:', {
        hasTranslated: !!translatedContent,
        hasContent: !!translatedContent?.content,
        contentLength: translatedContent?.content?.length,
        sourceKeywords,
        translatedKeywords
      });

      if (!translatedContent || !translatedContent.content) {
        throw new Error('Translation returned empty content');
      }

      const combinedSourceKeywords = [...new Set([...sourceKeywords, ...keywordList])];
      console.log('handleDownloadBoth - Generating original document...');
      const originalBlob = await generateWordDocument(article, combinedSourceKeywords,url);
      console.log('handleDownloadBoth - Original blob size:', originalBlob.size);

      const originalFilename = article.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      downloadWordDocument(originalBlob, `${originalFilename}-original`);

      const combinedTranslatedKeywords = [...new Set([...translatedKeywords, ...keywordList])];
      console.log('handleDownloadBoth - Generating translated document...');
      const translatedBlob = await generateWordDocument(translatedContent, combinedTranslatedKeywords,url);
      console.log('handleDownloadBoth - Translated blob size:', translatedBlob.size);

      const translatedFilename = (translatedContent.title || 'translated-article')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      downloadWordDocument(translatedBlob, `${translatedFilename}-${targetLanguage}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to generate Word documents: ${errorMessage}`);
      console.error('handleDownloadBoth error:', err);
    } finally {
      setLoading(false);
      setTranslating(false);
    }
  };

  const handlePreviewTranslation = async () => {
    if (!article || !targetLanguage) return;

    setTranslating(true);
    setError('');
    try {
      const keywordList = keywords.split(',').map(k => k.trim()).filter(k => k.length > 0);
      console.log('Preview - Starting translation with:', { targetLanguage, keywordCount: keywordList.length });
      const { article: translated, keywords: translatedKw } = await translateArticle(article, targetLanguage, keywordList);
      console.log('Preview - Translation result:', {
        hasTranslated: !!translated,
        title: translated?.title,
        contentLength: translated?.content?.length,
        translatedKeywords: translatedKw
      });
      const combinedKeywords = [...new Set([...translatedKw, ...keywordList])];
      console.log('Preview - Combined keywords:', combinedKeywords);
      setTranslatedArticle(translated);
      setTranslatedKeywords(combinedKeywords);

      setTimeout(() => {
        if (previewRef.current) {
          previewRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } catch (err) {
      setError('Failed to translate article for preview. Please try again.');
      console.error('Preview translation error:', err);
    } finally {
      setTranslating(false);
    }
  };

  const handleDownloadTranslated = async () => {
    if (!article || !targetLanguage) return;

    setLoading(true);
    setTranslating(true);
    setError('');
    try {
      const keywordList = keywords.split(',').map(k => k.trim()).filter(k => k.length > 0);
      console.log('handleDownloadTranslated - Original keywords:', keywordList);

      const { article: translatedContent, keywords: translatedKeywords } = await translateArticle(article, targetLanguage, keywordList);
      console.log('handleDownloadTranslated - Translation result:', {
        hasTranslated: !!translatedContent,
        hasContent: !!translatedContent?.content,
        contentLength: translatedContent?.content?.length,
        translatedKeywords
      });

      if (!translatedContent || !translatedContent.content) {
        throw new Error('Translation returned empty content');
      }

      const combinedKeywords = [...new Set([...translatedKeywords, ...keywordList])];
      console.log('handleDownloadTranslated - Combined keywords:', combinedKeywords);

      const blob = await generateWordDocument(translatedContent, combinedKeywords,url);
      console.log('handleDownloadTranslated - Blob generated:', blob.size, 'bytes');

      const filename = (translatedContent.title || 'translated-article')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      downloadWordDocument(blob, `${filename}-${targetLanguage}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to generate translated Word document: ${errorMessage}`);
      console.error('handleDownloadTranslated error:', err);
    } finally {
      setLoading(false);
      setTranslating(false);
    }
  };

  const translateArticle = async (article: ArticleContent, targetLang: string, keywords: string[]): Promise<{ article: ArticleContent, keywords: string[], sourceKeywords: string[] }> => {
    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/translate-article`;

    console.log('translateArticle - Request:', {
      apiUrl,
      targetLang,
      keywordsCount: keywords.length,
      articleContentLength: article.content?.length
    });

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ article, targetLanguage: targetLang, keywords }),
    });

    console.log('translateArticle - Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('translateArticle - Error response:', errorText);
      throw new Error(`Failed to translate article: ${response.status} - ${errorText}`);
    }

    const responseData = await response.json();
    console.log('translateArticle - Response data:', {
      hasTranslatedArticle: !!responseData.translatedArticle,
      translatedTitle: responseData.translatedArticle?.title,
      translatedContentLength: responseData.translatedArticle?.content?.length,
      translatedKeywordsCount: responseData.translatedKeywords?.length
    });

    const { translatedArticle, translatedKeywords, sourceLanguageKeywords } = responseData;

    if (!translatedArticle) {
      throw new Error('No translated article in response');
    }

    return {
      article: translatedArticle,
      keywords: translatedKeywords || [],
      sourceKeywords: sourceLanguageKeywords || []
    };
  };


const getArticleText = (article: ArticleContent) => {
  if (!article?.content) return '';

  return article.content
    .map((item: any) => {
      // Try all common possibilities
      if (typeof item === 'string') return item;
      if (item.text) return item.text;
      if (item.content) return item.content;
      if (item.value) return item.value;

      // Handle nested children
      if (Array.isArray(item.children)) {
        return item.children
          .map((child: any) => child.text || child.value || '')
          .join('');
      }

      return '';
    })
    .filter(Boolean)
    .join('\n\n');
};

const handleCopyArticle = (article: ArticleContent) => {
  const text = getArticleText(article);

  if (!text) {
    alert('No content to copy!');
    return;
  }

  navigator.clipboard.writeText(text)
    .then(() => {
      alert('Article copied to clipboard!');
    })
    .catch((err) => {
      console.error('Failed to copy text: ', err);
    });
};




  return (
    <div className="flex-1 flex flex-col bg-white">
      <div className="max-w-5xl mx-auto w-full p-8">
        <div className="mb-10 p-6 bg-white rounded-2xl shadow-md border border-gray-100">
  <h1 className="text-4xl font-extrabold text-gray-900 mb-3 text-center tracking-tight">
    Article Translator
  </h1>
  <p className="text-gray-600 text-lg leading-relaxed">
    Extract and translate articles from any webpage. Highlight keywords in both original and translated documents for easy comparison.
  </p>
</div>


        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Article URL
          </label>
          <div className="flex gap-3">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/article"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
              style={{color:"black"}}
            />
            <button
              onClick={handleExtract}
              disabled={loading || !url.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Extracting...
                </>
              ) : (
                'Extract Article'
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {article && (
          <>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <Languages className="w-4 h-4" />
                    Source Language
                  </label>
                  <LanguageSelector
                    value={sourceLanguage}
                    onChange={(lang) => {
                      setSourceLanguage(lang);
                      if (lang === 'Detect language' && article) {
                        detectArticleLanguage(article.title);
                      } else {
                        setDetectedLanguage(null);
                      }
                    }}
                    label="Source Language"
                    showDetect={true}
                  />
                  {detectedLanguage && sourceLanguage === 'Detect language' && (
                    <div className="mt-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <span className="font-semibold">Detected:</span> {detectedLanguage}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <Languages className="w-4 h-4" />
                    Target Language
                  </label>
                  <LanguageSelector
                    value={targetLanguage}
                    onChange={setTargetLanguage}
                    label="Target Language"
                    showDetect={false}
                  />
                </div>

              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Highlighter className="w-4 h-4" />
                  Keywords to Highlight
                </label>
                <input
                  type="text"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="keyword1, keyword2, keyword3"
                
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  style={{color:"black"}}
                />
                <p className="text-xs text-gray-500 mt-1">Comma-separated list</p>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={handleDownloadOriginal}
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-gray-100  rounded-lg font-medium hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{color:"black"}}
               >
                  <Download className="w-5 h-5" />
                  Download Original
                </button>

                <button
                  onClick={handleDownloadTranslated}
                  disabled={loading || translating || !targetLanguage}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {translating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Translating...
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5" />
                      Download Translated
                    </>
                  )}
                </button>

                <button
                  onClick={handleDownloadBoth}
                  disabled={loading || translating || !targetLanguage}
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {translating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5" />
                      Download Both
                    </>
                  )}
                </button>
              </div>

              {targetLanguage && (
                <button
                  onClick={handlePreviewTranslation}
                  disabled={translating}
                  className="w-full mt-3 px-6 py-3 bg-gray-50  rounded-lg font-medium hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{color:"black"}}
                  >
                  {translating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Translating...
                    </>
                  ) : (
                    'Preview Translation'
                  )}
                </button>
              )}
            </div>

{article && (
  <div className="flex justify-end mb-2">
    <button
      onClick={() => handleCopyArticle(article)}
      className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
      title="Copy article"
    >
      <Copy className="w-5 h-5" />
      Copy Article
    </button>
  </div>
)}

            <div ref={previewRef}>
              {translatedArticle ? (
                
                <ArticlePreview
                  article={article}
                  keywords={keywords.split(',').map(k => k.trim()).filter(k => k.length > 0)}
                  translatedArticle={translatedArticle}
                  translatedKeywords={translatedKeywords}
                />
              ) : (
                <ArticlePreview
                  article={article}
                  keywords={keywords.split(',').map(k => k.trim()).filter(k => k.length > 0)}
                />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

