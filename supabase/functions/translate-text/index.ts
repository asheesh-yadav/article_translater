import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface TranslationRequest {
  text: string;
  sourceLang: string;
  targetLang: string;
  formality?: 'formal' | 'informal' | 'default';
  context?: string;
  preserveFormatting?: boolean;
}

const LANGUAGE_CODE_MAP: { [key: string]: string } = {
  'Detect language': 'auto',
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
  'Bengali': 'bn',
  'Turkish': 'tr',
  'Vietnamese': 'vi',
  'Thai': 'th',
  'Dutch': 'nl',
  'Polish': 'pl',
  'Ukrainian': 'uk',
  'Romanian': 'ro',
  'Greek': 'el',
  'Czech': 'cs',
  'Swedish': 'sv',
  'Hungarian': 'hu',
  'Hebrew': 'he',
  'Indonesian': 'id',
  'Malay': 'ms',
  'Persian': 'fa',
  'Finnish': 'fi',
  'Danish': 'da',
  'Norwegian': 'no',
  'Slovak': 'sk',
  'Bulgarian': 'bg',
  'Croatian': 'hr',
  'Serbian': 'sr',
  'Lithuanian': 'lt',
  'Latvian': 'lv',
  'Estonian': 'et',
  'Slovenian': 'sl',
  'Catalan': 'ca',
  'Tagalog': 'tl',
  'Urdu': 'ur',
  'Swahili': 'sw',
  'Tamil': 'ta',
  'Telugu': 'te',
  'Marathi': 'mr',
  'Gujarati': 'gu',
  'Kannada': 'kn',
  'Malayalam': 'ml',
  'Punjabi': 'pa',
  'Nepali': 'ne',
  'Sinhala': 'si',
  'Khmer': 'km',
  'Lao': 'lo',
  'Burmese': 'my',
  'Georgian': 'ka',
  'Armenian': 'hy',
  'Azerbaijani': 'az',
  'Kazakh': 'kk',
  'Uzbek': 'uz',
  'Mongolian': 'mn',
  'Amharic': 'am',
  'Albanian': 'sq',
  'Macedonian': 'mk',
  'Bosnian': 'bs',
  'Icelandic': 'is',
  'Maltese': 'mt',
  'Welsh': 'cy',
  'Irish': 'ga',
  'Basque': 'eu',
  'Galician': 'gl',
  'Afrikaans': 'af',
  'Haitian Creole': 'ht',
  'Yiddish': 'yi',
};

const LANGUAGE_NAME_MAP: { [key: string]: string } = {
  'auto': 'Unknown',
  'hu': 'Hungarian',
  'en': 'English',
  'es': 'Spanish',
  'fr': 'French',
  'de': 'German',
  'it': 'Italian',
  'pt': 'Portuguese',
  'ru': 'Russian',
  'zh': 'Chinese',
  'zh-CN': 'Chinese (Simplified)',
  'zh-TW': 'Chinese (Traditional)',
  'ja': 'Japanese',
  'ko': 'Korean',
  'ar': 'Arabic',
  'hi': 'Hindi',
  'bn': 'Bengali',
  'tr': 'Turkish',
  'vi': 'Vietnamese',
  'th': 'Thai',
  'nl': 'Dutch',
  'pl': 'Polish',
  'uk': 'Ukrainian',
  'ro': 'Romanian',
  'el': 'Greek',
  'cs': 'Czech',
  'sv': 'Swedish',
  'he': 'Hebrew',
  'iw': 'Hebrew',
  'id': 'Indonesian',
  'ms': 'Malay',
  'fa': 'Persian',
  'fi': 'Finnish',
  'da': 'Danish',
  'no': 'Norwegian',
  'nb': 'Norwegian',
  'sk': 'Slovak',
  'bg': 'Bulgarian',
  'hr': 'Croatian',
  'sr': 'Serbian',
  'lt': 'Lithuanian',
  'lv': 'Latvian',
  'et': 'Estonian',
  'sl': 'Slovenian',
  'ca': 'Catalan',
  'tl': 'Tagalog',
  'ur': 'Urdu',
  'sw': 'Swahili',
  'ta': 'Tamil',
  'te': 'Telugu',
  'mr': 'Marathi',
  'gu': 'Gujarati',
  'kn': 'Kannada',
  'ml': 'Malayalam',
  'pa': 'Punjabi',
  'ne': 'Nepali',
  'si': 'Sinhala',
  'km': 'Khmer',
  'lo': 'Lao',
  'my': 'Burmese',
  'ka': 'Georgian',
  'hy': 'Armenian',
  'az': 'Azerbaijani',
  'kk': 'Kazakh',
  'uz': 'Uzbek',
  'mn': 'Mongolian',
  'am': 'Amharic',
  'sq': 'Albanian',
  'mk': 'Macedonian',
  'bs': 'Bosnian',
  'is': 'Icelandic',
  'mt': 'Maltese',
  'cy': 'Welsh',
  'ga': 'Irish',
  'eu': 'Basque',
  'gl': 'Galician',
  'af': 'Afrikaans',
  'ht': 'Haitian Creole',
  'yi': 'Yiddish',
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { text, sourceLang, targetLang, formality, context, preserveFormatting }: TranslationRequest = await req.json();

    if (!text || !targetLang) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const sourceCode = LANGUAGE_CODE_MAP[sourceLang] || 'auto';
    const targetCode = LANGUAGE_CODE_MAP[targetLang] || 'en';

    const { translatedText, detectedLangCode } = await translateText(text, sourceCode, targetCode, formality || 'default');

    const detectedLanguage = LANGUAGE_NAME_MAP[detectedLangCode] || detectedLangCode;

    return new Response(
      JSON.stringify({
        translatedText,
        detectedLanguage,
        sourceLanguage: sourceCode,
        targetLanguage: targetCode,
      }),
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
      JSON.stringify({ error: "Failed to translate text" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

async function translateText(text: string, sourceLang: string, targetLang: string, formality: string): Promise<{ translatedText: string; detectedLangCode: string }> {
  if (!text || text.trim().length === 0) {
    return { translatedText: text, detectedLangCode: 'unknown' };
  }

  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    const response = await fetch(url);

    if (!response.ok) {
      console.error("Translation API error:", response.status);
      return { translatedText: text, detectedLangCode: 'unknown' };
    }

    const data = await response.json();

    if (data && data[0]) {
      let translatedText = '';
      for (const item of data[0]) {
        if (item[0]) {
          translatedText += item[0];
        }
      }

      const detectedLangCode = data[2] || sourceLang;

      if (formality === 'formal') {
        translatedText = applyFormalTone(translatedText, targetLang);
      } else if (formality === 'informal') {
        translatedText = applyInformalTone(translatedText, targetLang);
      }

      return { translatedText, detectedLangCode };
    }

    return { translatedText: text, detectedLangCode: 'unknown' };
  } catch (error) {
    console.error("Translation error:", error);
    return { translatedText: text, detectedLangCode: 'unknown' };
  }
}

function applyFormalTone(text: string, targetLang: string): string {
  const formalPatterns: { [key: string]: { [key: string]: string } } = {
    'en': {
      "you're": "you are",
      "don't": "do not",
      "can't": "cannot",
      "won't": "will not",
      "isn't": "is not",
      "aren't": "are not",
      "wasn't": "was not",
      "weren't": "were not",
      "hasn't": "has not",
      "haven't": "have not",
      "hadn't": "had not",
      "doesn't": "does not",
      "didn't": "did not",
      "wouldn't": "would not",
      "shouldn't": "should not",
      "couldn't": "could not",
    },
    'es': {
      "tú": "usted",
    },
  };

  let formalText = text;
  const patterns = formalPatterns[targetLang] || {};

  for (const [informal, formal] of Object.entries(patterns)) {
    const regex = new RegExp(`\\b${informal}\\b`, 'gi');
    formalText = formalText.replace(regex, formal);
  }

  return formalText;
}

function applyInformalTone(text: string, targetLang: string): string {
  const informalPatterns: { [key: string]: { [key: string]: string } } = {
    'en': {
      "you are": "you're",
      "do not": "don't",
      "cannot": "can't",
      "will not": "won't",
      "is not": "isn't",
      "are not": "aren't",
      "was not": "wasn't",
      "were not": "weren't",
      "has not": "hasn't",
      "have not": "haven't",
      "had not": "hadn't",
      "does not": "doesn't",
      "did not": "didn't",
      "would not": "wouldn't",
      "should not": "shouldn't",
      "could not": "couldn't",
    },
  };

  let informalText = text;
  const patterns = informalPatterns[targetLang] || {};

  for (const [formal, informal] of Object.entries(patterns)) {
    const regex = new RegExp(`\\b${formal}\\b`, 'gi');
    informalText = informalText.replace(regex, informal);
  }

  return informalText;
}
