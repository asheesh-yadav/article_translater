export function highlightKeywords(text: string, keywords: string[]): (string | { text: string; highlight: boolean })[] {
  console.log('[highlightKeywords] Called with keywords:', keywords, 'Text preview:', text.substring(0, 100));

  if (keywords.length === 0 || !text) {
    console.log('[highlightKeywords] No keywords or text, returning plain text');
    return [text];
  }

  const escapedKeywords = keywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const pattern = new RegExp(`(${escapedKeywords.join('|')})`, 'gi');
  console.log('[highlightKeywords] Pattern:', pattern);

  const parts = text.split(pattern);
  console.log('[highlightKeywords] Split into', parts.length, 'parts');

  const result = parts.map(part => {
    const isKeyword = keywords.some(keyword =>
      part.toLowerCase() === keyword.toLowerCase()
    );

    if (isKeyword) {
      console.log('[highlightKeywords] Found keyword match:', part);
      return { text: part, highlight: true };
    }
    return part;
  });

  console.log('[highlightKeywords] Result:', result.filter(r => typeof r !== 'string').length, 'highlighted parts');
  return result;
}
