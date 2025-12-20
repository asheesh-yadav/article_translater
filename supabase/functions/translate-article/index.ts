import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ArticleContent {
  title: string;
  author?: string;
  publishDate?: string;
  content: ParsedElement[];
}

interface ParsedElement {
  type: 'heading1' | 'heading2' | 'heading3' | 'heading4' | 'paragraph' | 'list' | 'image';
  content: string;
  level?: number;
  items?: string[];
  alt?: string;
}

const LANGUAGE_CODE_MAP: { [key: string]: string } = {
  'English': 'en',
  'English (American)': 'en',
  'English (British)': 'en',
  'Spanish': 'es',
  'French': 'fr',
  'German': 'de',
  'Italian': 'it',
  'Portuguese': 'pt',
  'Portuguese (Brazilian)': 'pt',
  'Russian': 'ru',
  'Chinese (Simplified)': 'zh-CN',
  'Chinese (Traditional)': 'zh-TW',
  'Japanese': 'ja',
  'Korean': 'ko',
  'Arabic': 'ar',
  'Hindi': 'hi',
  'Turkish': 'tr',
  'Dutch': 'nl',
  'Polish': 'pl',
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { article, targetLanguage, keywords } = await req.json();

    console.log('Received translation request:', {
      hasArticle: !!article,
      targetLanguage,
      hasKeywords: !!keywords
    });

    if (!article || !targetLanguage) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const targetLangCode = LANGUAGE_CODE_MAP[targetLanguage] || 'en';
    console.log('Target language code:', targetLangCode);

    const sourceLanguage = await detectLanguage(article.title);
    console.log('Detected source language:', sourceLanguage);

    const translatedArticle: ArticleContent = {
      title: await translateText(article.title, 'auto', targetLangCode),
      author: article.author,
      publishDate: article.publishDate,
      content: await translateContent(article.content, targetLangCode),
    };

    console.log('Article translated successfully:', {
      hasTitle: !!translatedArticle.title,
      hasContent: !!translatedArticle.content,
      contentLength: translatedArticle.content?.length
    });

    let translatedKeywords: string[] = [];
    let sourceLanguageKeywords: string[] = [];

    if (keywords && Array.isArray(keywords) && keywords.length > 0) {
      console.log('Translating keywords:', keywords.length);
      for (const keyword of keywords) {
        if (keyword && keyword.trim()) {
          const translated = await translateText(keyword.trim(), 'auto', targetLangCode);
          translatedKeywords.push(translated);
          await delay(200);

          const sourceTranslated = await translateText(keyword.trim(), 'auto', sourceLanguage);
          sourceLanguageKeywords.push(sourceTranslated);
          await delay(200);
        }
      }
    }

    const responseData = {
      translatedArticle,
      translatedKeywords,
      sourceLanguageKeywords
    };

    console.log('Sending response:', {
      hasTranslatedArticle: !!responseData.translatedArticle,
      translatedContentLength: responseData.translatedArticle?.content?.length,
      translatedKeywordsCount: responseData.translatedKeywords?.length,
      sourceKeywordsCount: responseData.sourceLanguageKeywords?.length
    });

    return new Response(
      JSON.stringify(responseData),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Translation error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to translate article",
        details: error instanceof Error ? error.message : String(error)
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

async function translateText(text: string, sourceLang: string, targetLang: string): Promise<string> {
  if (!text || text.trim().length === 0) return text;

  const chunks = splitIntoChunks(text, 500);
  const translatedChunks: string[] = [];

  for (const chunk of chunks) {
    try {
      const sourceCode = sourceLang === 'auto' ? 'auto' : targetLang;
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(chunk)}`;

      console.log(`Translating chunk (${chunk.length} chars) from ${sourceLang} to ${targetLang}`);

      const response = await fetch(url);

      if (!response.ok) {
        console.error("Translation API error:", response.status);
        translatedChunks.push(chunk);
        continue;
      }

      const data = await response.json();

      if (data && Array.isArray(data) && data[0] && Array.isArray(data[0])) {
        const translated = data[0].map((item: any) => item[0]).filter(Boolean).join('');
        translatedChunks.push(translated || chunk);
      } else {
        console.warn('Unexpected translation response format:', data);
        translatedChunks.push(chunk);
      }

      await delay(100);
    } catch (error) {
      console.error("Translation error for chunk:", error);
      translatedChunks.push(chunk);
    }
  }

  return translatedChunks.join(' ');
}

function splitIntoChunks(text: string, maxLength: number): string[] {
  if (text.length <= maxLength) return [text];

  const chunks: string[] = [];
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  let currentChunk = '';

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length <= maxLength) {
      currentChunk += sentence;
    } else {
      if (currentChunk) chunks.push(currentChunk.trim());
      if (sentence.length > maxLength) {
        const words = sentence.split(' ');
        currentChunk = '';
        for (const word of words) {
          if ((currentChunk + ' ' + word).length <= maxLength) {
            currentChunk += (currentChunk ? ' ' : '') + word;
          } else {
            if (currentChunk) chunks.push(currentChunk.trim());
            currentChunk = word;
          }
        }
      } else {
        currentChunk = sentence;
      }
    }
  }

  if (currentChunk) chunks.push(currentChunk.trim());

  return chunks;
}

async function translateContent(
  content: ParsedElement[],
  targetLang: string
): Promise<ParsedElement[]> {
  console.log('translateContent called with:', {
    hasContent: !!content,
    isArray: Array.isArray(content),
    length: content?.length,
    targetLang
  });

  if (!content || !Array.isArray(content)) {
    console.warn('Content is not an array:', content);
    return [];
  }

  const translated: ParsedElement[] = [];

  for (let i = 0; i < content.length; i++) {
    const element = content[i];
    console.log(`Translating element ${i + 1}/${content.length}:`, {
      type: element.type,
      hasContent: !!element.content,
      hasItems: !!element.items
    });

    try {
      if (element.type === 'image') {
        translated.push({
          ...element,
          alt: element.alt ? await translateText(element.alt, 'auto', targetLang) : element.alt,
        });
      } else if (element.type === 'list' && element.items) {
        const translatedItems: string[] = [];
        for (const item of element.items) {
          translatedItems.push(await translateText(item, 'auto', targetLang));
          await delay(200);
        }
        translated.push({
          ...element,
          items: translatedItems,
        });
      } else {
        const translatedText = await translateText(element.content, 'auto', targetLang);
        translated.push({
          ...element,
          content: translatedText,
        });
      }

      await delay(200);
    } catch (error) {
      console.error('Error translating element:', error);
      translated.push(element);
    }
  }

  console.log(`translateContent completed: ${translated.length} elements translated`);
  return translated;
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function detectLanguage(text: string): Promise<string> {
  if (!text || text.trim().length === 0) return 'en';

  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(text.substring(0, 100))}`;
    const response = await fetch(url);

    if (!response.ok) {
      return 'en';
    }

    const data = await response.json();

    if (data && data[2]) {
      return data[2];
    }

    return 'en';
  } catch (error) {
    console.error("Language detection error:", error);
    return 'en';
  }
}
