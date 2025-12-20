import { ArticleContent } from '../types/article';
import { highlightKeywords } from '../utils/highlightText';

interface ArticlePreviewProps {
  article: ArticleContent;
  keywords?: string[];
  translatedArticle?: ArticleContent | null;
  translatedKeywords?: string[];
}

function HighlightedText({ text, keywords }: { text: string; keywords: string[] }) {
  const parts = highlightKeywords(text, keywords);

  return (
    <>
      {parts.map((part, index) => {
        if (typeof part === 'string') {
          return <span key={index}>{part}</span>;
        }
        return (
          <mark key={index} className="bg-gradient-to-r from-yellow-200 to-yellow-300 px-1.5 py-0.5 rounded font-medium">
            {part.text}
          </mark>
        );
      })}
    </>
  );
}

function renderContent(content: ArticleContent['content'], keywords: string[]) {
  console.log('renderContent called with:', { hasContent: !!content, isArray: Array.isArray(content), length: content?.length });

  if (!content || !Array.isArray(content)) {
    console.warn('renderContent - Invalid content:', content);
    return <div className="text-slate-500 italic p-4">No content to display</div>;
  }

  if (content.length === 0) {
    console.warn('renderContent - Empty content array');
    return <div className="text-slate-500 italic p-4">Content array is empty</div>;
  }

  return content.map((element, index) => {
    switch (element.type) {
      case 'heading1':
        return (
          <h1 key={index} className="text-2xl font-bold mt-6 mb-3 text-slate-900 border-l-4 border-blue-600 pl-3 hover:border-slate-600 transition-colors">
            <HighlightedText text={element.content} keywords={keywords} />
          </h1>
        );

      case 'heading2':
        return (
          <h2 key={index} className="text-xl font-bold mt-5 mb-2 text-slate-900 border-l-4 border-slate-400 pl-3 hover:border-blue-500 transition-colors">
            <HighlightedText text={element.content} keywords={keywords} />
          </h2>
        );

      case 'heading3':
        return (
          <h3 key={index} className="text-lg font-bold mt-4 mb-2 text-slate-800 pl-2 border-l-2 border-slate-300">
            <HighlightedText text={element.content} keywords={keywords} />
          </h3>
        );

      case 'heading4':
        return (
          <h4 key={index} className="text-base font-semibold mt-3 mb-2 text-slate-800">
            <HighlightedText text={element.content} keywords={keywords} />
          </h4>
        );

      case 'paragraph':
        return (
          <p key={index} className="text-slate-700 leading-relaxed text-sm sm:text-base">
            <HighlightedText text={element.content} keywords={keywords} />
          </p>
        );

      case 'list':
        return (
          <ul key={index} className="space-y-2 text-slate-700 ml-1">
            {element.items?.map((item, itemIndex) => (
              <li key={itemIndex} className="flex items-start gap-2 group">
                <div className="flex-shrink-0 w-1.5 h-1.5 bg-gradient-to-br from-blue-500 to-slate-600 rounded-full mt-2 group-hover:scale-125 transition-transform"></div>
                <span className="flex-1 text-sm sm:text-base">
                  <HighlightedText text={item} keywords={keywords} />
                </span>
              </li>
            ))}
          </ul>
        );

      case 'image':
        return (
          <div key={index} className="my-4 p-4 bg-gradient-to-br from-slate-50 to-blue-50 rounded-lg border border-slate-200 text-center group hover:shadow-md transition-all">
            <div className="flex items-center justify-center gap-2 text-slate-500 group-hover:text-slate-700 transition-colors text-xs">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="italic font-medium">[Image: {element.alt}]</span>
            </div>
          </div>
        );

      default:
        return null;
    }
  });
}

export default function ArticlePreview({ article, keywords = [], translatedArticle = null, translatedKeywords = [] }: ArticlePreviewProps) {
  console.log('[ArticlePreview] Rendering with:', {
    hasArticle: !!article,
    hasTranslatedArticle: !!translatedArticle,
    originalKeywords: keywords,
    translatedKeywords: translatedKeywords,
    articleContent: article?.content,
    translatedContent: translatedArticle?.content
  });

  if (!article) {
    return null;
  }

  const isDualView = translatedArticle !== null;

  return (
    <div className="relative group">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-slate-600 rounded-2xl opacity-0 group-hover:opacity-10 blur-xl transition-opacity duration-500"></div>
      <div className={`relative bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/60 p-8 sm:p-12 w-full transition-all duration-300 hover:shadow-2xl ${isDualView ? 'max-w-none' : 'max-w-5xl'}`}>
        {isDualView ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="max-h-[700px] overflow-y-auto pr-4 border-r border-slate-200">
              <div className="mb-6 pb-4 border-b-2 border-gradient-to-r from-blue-100 via-slate-100 to-blue-100">
                <div className="flex items-center gap-2 mb-3">
                  <div className="px-3 py-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs font-bold rounded-full">ORIGINAL</div>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-3 bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent leading-tight">
                  {article.title}
                </h2>
                {article.author && (
                  <div className="flex items-center gap-2 text-slate-600 mb-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <p className="text-sm italic font-medium">By {article.author}</p>
                  </div>
                )}
                {article.publishDate && (
                  <div className="flex items-center gap-2 text-slate-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-xs">{article.publishDate}</p>
                  </div>
                )}
              </div>
              <div className="space-y-4 prose prose-slate max-w-none">
                {renderContent(article.content, keywords)}
              </div>
            </div>
            <div className="max-h-[700px] overflow-y-auto pl-4">
              <div className="mb-6 pb-4 border-b-2 border-gradient-to-r from-green-100 via-emerald-100 to-green-100">
                <div className="flex items-center gap-2 mb-3">
                  <div className="px-3 py-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-xs font-bold rounded-full">TRANSLATED</div>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-3 bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent leading-tight">
                  {translatedArticle?.title || 'Untitled'}
                </h2>
                {translatedArticle?.author && (
                  <div className="flex items-center gap-2 text-slate-600 mb-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <p className="text-sm italic font-medium">By {translatedArticle.author}</p>
                  </div>
                )}
                {translatedArticle?.publishDate && (
                  <div className="flex items-center gap-2 text-slate-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-xs">{translatedArticle.publishDate}</p>
                  </div>
                )}
              </div>
              <div className="space-y-4 prose prose-slate max-w-none">
                {translatedArticle?.content && Array.isArray(translatedArticle.content) && translatedArticle.content.length > 0 ? (
                  renderContent(translatedArticle.content, translatedKeywords)
                ) : (
                  <div className="text-slate-500 italic p-8 text-center bg-slate-50 rounded-lg">
                    <p>No translated content available</p>
                    <p className="text-sm mt-2">Translation may have failed or content is empty</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="max-h-[800px] overflow-y-auto">
            <div className="mb-8 pb-6 border-b-2 border-gradient-to-r from-blue-100 via-slate-100 to-blue-100">
              <h1 className="text-3xl sm:text-4xl font-bold mb-4 bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent leading-tight">
                {article.title}
              </h1>
              {article.author && (
                <div className="flex items-center gap-2 text-slate-600 mb-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <p className="italic font-medium">By {article.author}</p>
                </div>
              )}
              {article.publishDate && (
                <div className="flex items-center gap-2 text-slate-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm">{article.publishDate}</p>
                </div>
              )}
            </div>
            <div className="space-y-5 prose prose-slate max-w-none">
              {renderContent(article.content, keywords)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
