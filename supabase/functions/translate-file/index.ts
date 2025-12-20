import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { Document, Packer, Paragraph, TextRun } from "npm:docx@9.5.1";
import JSZip from "npm:jszip@3.10.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

async function translateText(text: string, targetLang: string): Promise<string> {
  if (!text || !text.trim()) return text;

  const langMap: { [key: string]: string } = {
    'Spanish': 'es',
    'English (American)': 'en',
    'French': 'fr',
    'German': 'de',
    'Italian': 'it',
    'Portuguese': 'pt',
    'Russian': 'ru',
    'Chinese': 'zh',
    'Japanese': 'ja',
    'Korean': 'ko',
  };

  const targetCode = langMap[targetLang] || 'en';

  try {
    const response = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetCode}&dt=t&q=${encodeURIComponent(text)}`
    );

    if (response.ok) {
      const data = await response.json();
      if (data && data[0] && Array.isArray(data[0])) {
        return data[0].map((item: any) => item[0]).join('');
      }
    }
  } catch (error) {
    console.error('Translation error:', error);
  }

  return text;
}

async function translateDocx(fileData: Uint8Array, targetLang: string): Promise<Uint8Array> {
  try {
    const zip = await JSZip.loadAsync(fileData);
    const documentXml = await zip.file("word/document.xml")?.async("text");

    if (!documentXml) {
      throw new Error("Could not read document.xml");
    }

    const textMatches = documentXml.match(/<w:t[^>]*>([^<]*)<\/w:t>/g);

    if (!textMatches || textMatches.length === 0) {
      throw new Error("No text found in document");
    }

    let translatedXml = documentXml;

    for (const match of textMatches) {
      const textContent = match.replace(/<w:t[^>]*>|<\/w:t>/g, '');
      if (textContent.trim()) {
        const translated = await translateText(textContent, targetLang);
        const escapedOriginal = textContent.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        translatedXml = translatedXml.replace(
          new RegExp(`(<w:t[^>]*>)${escapedOriginal}(<\\/w:t>)`, 'g'),
          `$1${translated}$2`
        );
      }
    }

    zip.file("word/document.xml", translatedXml);

    const translatedBuffer = await zip.generateAsync({ type: "uint8array" });
    return translatedBuffer;
  } catch (error) {
    console.error('DOCX translation error:', error);
    throw error;
  }
}

// Translate PPTX by iterating slide XML files and replacing <a:t> text elements
async function translatePptx(fileData: Uint8Array, targetLang: string): Promise<Uint8Array> {
  try {
    const zip = await JSZip.loadAsync(fileData);

    // Find slide files
    const slideFiles = Object.keys(zip.files).filter((p) => p.startsWith('ppt/slides/slide') && p.endsWith('.xml'));
    if (slideFiles.length === 0) {
      throw new Error('No slides found in presentation');
    }

    for (const slidePath of slideFiles) {
      const slideXml = await zip.file(slidePath)?.async('text');
      if (!slideXml) continue;

      // Text in PPTX slides is typically within <a:t> elements
      const matches = slideXml.match(/<a:t[^>]*>([^<]*)<\/a:t>/g);
      let translatedSlideXml = slideXml;

      if (matches && matches.length > 0) {
        for (const match of matches) {
          const textContent = match.replace(/<a:t[^>]*>|<\/a:t>/g, '');
          if (textContent.trim()) {
            const translated = await translateText(textContent, targetLang);
            const escapedOriginal = textContent.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            translatedSlideXml = translatedSlideXml.replace(
              new RegExp(`(<a:t[^>]*>)${escapedOriginal}(<\\/a:t>)`, 'g'),
              `$1${translated}$2`
            );
          }
        }
      }

      zip.file(slidePath, translatedSlideXml);
    }

    const translatedBuffer = await zip.generateAsync({ type: 'uint8array' });
    return translatedBuffer;
  } catch (error) {
    console.error('PPTX translation error:', error);
    throw error;
  }
}

// Translate XLSX by updating sharedStrings and inline string cells
async function translateXlsx(fileData: Uint8Array, targetLang: string): Promise<Uint8Array> {
  try {
    const zip = await JSZip.loadAsync(fileData);

    // Translate shared strings if present
    const sharedStringsPath = 'xl/sharedStrings.xml';
    const sharedXml = await zip.file(sharedStringsPath)?.async('text');
    if (sharedXml) {
      let translatedSharedXml = sharedXml;
      const sharedMatches = sharedXml.match(/<t[^>]*>([^<]*)<\/t>/g);
      if (sharedMatches && sharedMatches.length > 0) {
        for (const match of sharedMatches) {
          const textContent = match.replace(/<t[^>]*>|<\/t>/g, '');
          if (textContent.trim()) {
            const translated = await translateText(textContent, targetLang);
            const escapedOriginal = textContent.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            translatedSharedXml = translatedSharedXml.replace(
              new RegExp(`(<t[^>]*>)${escapedOriginal}(<\\/t>)`, 'g'),
              `$1${translated}$2`
            );
          }
        }
      }
      zip.file(sharedStringsPath, translatedSharedXml);
    }

    // Translate inline strings in worksheets
    const sheetFiles = Object.keys(zip.files).filter((p) => p.startsWith('xl/worksheets/sheet') && p.endsWith('.xml'));
    for (const sheetPath of sheetFiles) {
      const sheetXml = await zip.file(sheetPath)?.async('text');
      if (!sheetXml) continue;

      let translatedSheetXml = sheetXml;
      // Inline strings typically appear as <is><t>value</t></is>
      const inlineMatches = sheetXml.match(/<is>.*?<t[^>]*>([^<]*)<\/t>.*?<\/is>/gs);
      if (inlineMatches && inlineMatches.length > 0) {
        for (const inline of inlineMatches) {
          const tMatch = inline.match(/<t[^>]*>([^<]*)<\/t>/);
          if (tMatch && tMatch[1] && tMatch[1].trim()) {
            const textContent = tMatch[1];
            const translated = await translateText(textContent, targetLang);
            const escapedOriginal = textContent.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            translatedSheetXml = translatedSheetXml.replace(
              new RegExp(`(<t[^>]*>)${escapedOriginal}(<\\/t>)`, 'g'),
              `$1${translated}$2`
            );
          }
        }
      }

      zip.file(sheetPath, translatedSheetXml);
    }

    const translatedBuffer = await zip.generateAsync({ type: 'uint8array' });
    return translatedBuffer;
  } catch (error) {
    console.error('XLSX translation error:', error);
    throw error;
  }
}

// Translate plain text files (.txt) by translating each line
async function translateTxt(fileData: Uint8Array, targetLang: string): Promise<Uint8Array> {
  try {
    const original = new TextDecoder('utf-8').decode(fileData);
    const lines = original.split(/\r?\n/);
    const out: string[] = [];
    for (const line of lines) {
      if (!line.trim()) {
        out.push(line);
      } else {
        const translated = await translateText(line, targetLang);
        out.push(translated);
      }
    }
    const result = out.join('\n');
    return new TextEncoder().encode(result);
  } catch (error) {
    console.error('TXT translation error:', error);
    throw error;
  }
}

// Translate SubRip subtitle files (.srt) preserving timestamps and sequence numbers
async function translateSrt(fileData: Uint8Array, targetLang: string): Promise<Uint8Array> {
  try {
    const original = new TextDecoder('utf-8').decode(fileData);
    const lines = original.split(/\r?\n/);
    const timecodeRegex = /\d{2}:\d{2}:\d{2},\d{3}\s+-->\s+\d{2}:\d{2}:\d{2},\d{3}/;
    const out: string[] = [];
    for (const line of lines) {
      const isSequence = /^\d+$/.test(line.trim());
      const isTimecode = timecodeRegex.test(line.trim());
      if (isSequence || isTimecode || !line.trim()) {
        out.push(line);
      } else {
        const translated = await translateText(line, targetLang);
        out.push(translated);
      }
    }
    const result = out.join('\n');
    return new TextEncoder().encode(result);
  } catch (error) {
    console.error('SRT translation error:', error);
    throw error;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const targetLang = formData.get('targetLang') as string;

    console.log('Received file:', file?.name, 'Target lang:', targetLang);

    if (!file) {
      return new Response(
        JSON.stringify({ error: 'No file provided' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!targetLang) {
      return new Response(
        JSON.stringify({ error: 'Target language not specified' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const fileData = new Uint8Array(await file.arrayBuffer());
    console.log('File size:', fileData.length, 'bytes');

    let translatedData: Uint8Array;
    let mimeType = '';

    const lowerName = file.name.toLowerCase();

    if (lowerName.endsWith('.docx')) {
      console.log('Translating DOCX file...');
      translatedData = await translateDocx(fileData, targetLang);
      mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      console.log('DOCX translation complete');
    } else if (lowerName.endsWith('.pptx')) {
      console.log('Translating PPTX file...');
      translatedData = await translatePptx(fileData, targetLang);
      mimeType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
      console.log('PPTX translation complete');
    } else if (lowerName.endsWith('.xlsx')) {
      console.log('Translating XLSX file...');
      translatedData = await translateXlsx(fileData, targetLang);
      mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      console.log('XLSX translation complete');
    } else if (lowerName.endsWith('.txt')) {
      console.log('Translating TXT file...');
      translatedData = await translateTxt(fileData, targetLang);
      mimeType = 'text/plain; charset=utf-8';
      console.log('TXT translation complete');
    } else if (lowerName.endsWith('.srt')) {
      console.log('Translating SRT file...');
      translatedData = await translateSrt(fileData, targetLang);
      mimeType = 'application/x-subrip; charset=utf-8';
      console.log('SRT translation complete');
    } else {
      console.log('Unsupported file type');
      return new Response(
        JSON.stringify({ error: 'Only .docx, .pptx, .xlsx, .txt, and .srt files are currently supported' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(translatedData, {
      headers: {
        ...corsHeaders,
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename=\"translated_${file.name}\"`,
      },
    });
  } catch (error) {
    console.error('Error processing file:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to translate file',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
