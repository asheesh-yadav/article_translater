import { ArticleContent, ParsedElement } from '../types/article';

export async function extractArticle(html: string): Promise<ArticleContent> {
  console.log('extractArticle - HTML length:', html.length);

  const parser = new DOMParser();
  const document = parser.parseFromString(html, 'text/html');

  const title = extractTitle(document);
  console.log('extractArticle - Title:', title);

  removeUnwantedElements(document);

  const article = findMainContent(document);
  console.log('extractArticle - Main content element:', article?.tagName, article?.className);

  let content = parseContent(article, title);
  console.log('extractArticle - Initial content parsed:', content.length, 'elements');

  if (content.length < 5) {
    console.log('extractArticle - Using fallback extraction (content too short)');
    content = fallbackExtraction(document, title);
    console.log('extractArticle - Fallback content:', content.length, 'elements');
  }

  if (content.length === 0) {
    console.warn('extractArticle - No content found! Adding placeholder');
    content = [{
      type: 'paragraph',
      content: 'Unable to extract content from this URL. The page structure may not be supported.'
    }];
  }

  const result = {
    title: title,
    author: extractAuthor(document),
    publishDate: extractPublishDate(document),
    content: content
  };

  console.log('extractArticle - Final result:', {
    title: result.title,
    author: result.author,
    publishDate: result.publishDate,
    contentElements: result.content.length,
    firstElement: result.content[0]
  });

  return result;
}

function removeUnwantedElements(document: Document): void {
  const selectorsToRemove = [
    'script',
    'style',
    'nav',
    'header',
    'footer',
    'aside',
    'form',
    'button',
    '.ad',
    '.advertisement',
    '.sidebar',
    '.social-share',
    '.comments',
    '.related-posts',
    '.breaking-news',
    '.breadcrumb',
    '.navigation',
    '.menu',
    '.widget',
    '.share',
    '.tags',
    '.category',
    '.author-bio',
    '[class*="ad-"]',
    '[class*="ads-"]',
    '[class*="banner"]',
    '[class*="breaking"]',
    '[class*="breadcrumb"]',
    '[class*="menu"]',
    '[class*="nav"]',
    '[class*="widget"]',
    '[class*="share"]',
    '[class*="social"]',
    '[class*="related"]',
    '[class*="recommend"]',
    '[class*="popular"]',
    '[class*="trending"]',
    '[class*="read-also"]',
    '[class*="read-more"]',
    '[id*="ad-"]',
    '[id*="ads-"]',
    '[id*="breaking"]',
    '[id*="menu"]',
    '[id*="nav"]',
    '[id*="sidebar"]',
    '[class*="cookie"]',
    '[id*="cookie"]',
    '[class*="policy"]',
    'iframe[src*="ads"]',
    'iframe[src*="doubleclick"]'
  ];

  selectorsToRemove.forEach(selector => {
    document.querySelectorAll(selector).forEach(el => el.remove());
  });
}

function findMainContent(document: Document): Element {
  const candidates = [
    document.querySelector('article'),
    document.querySelector('[role="main"]'),
    document.querySelector('main'),
    document.querySelector('.article-content'),
    document.querySelector('.post-content'),
    document.querySelector('.entry-content'),
    document.querySelector('.content'),
    document.querySelector('#content')
  ];
  const pick = candidates.find(el => el !== null);
  if (pick) return pick as Element;

  const titleEl = document.querySelector('h1');
  const titleText = titleEl?.textContent?.trim().toLowerCase() || '';

  const scoreContainer = (el: Element): number => {
    const ps = el.querySelectorAll('p');
    const textLen = Array.from(ps).reduce((n, p) => n + ((p.textContent || '').trim().length), 0);
    const pCount = ps.length;
    const hCount = el.querySelectorAll('h1, h2, h3').length;
    const links = el.querySelectorAll('a').length;
    const allText = (el.textContent || '').toLowerCase();
    const titleScore = titleText && allText.includes(titleText) ? 20 : 0;
    const badWords = [
      'cookie', 'cookies', 'política de cookies', 'privacy policy', 'aviso legal', 'legal notice', 'datenschutz', 'política de privacidad',
      'added to cart', 'view cart', 'continue shopping', 'shopping cart', 'checkout', 'buy now',
      'añadido al carrito', 'ver carrito', 'seguir comprando', 'carrito', 'producto', 'comprar',
      'subscribe', 'newsletter', 'sign up', 'login', 'register', 'account'
    ];
    const hasBad = badWords.some(w => allText.includes(w));
    const linkPenalty = links > pCount * 3 ? 10 : 0;
    const base = textLen * 0.001 + pCount * 5 + hCount * 2 + titleScore;
    return base - (hasBad ? 50 : 0) - linkPenalty;
  };

  if (titleEl) {
    let node: Element | null = titleEl;
    let best: { el: Element; score: number } | null = null;
    for (let i = 0; i < 6 && node; i++) {
      const s = scoreContainer(node);
      if (!best || s > best.score) best = { el: node, score: s };
      node = node.parentElement;
    }
    if (best) return best.el;
  }

  const containers = Array.from(document.querySelectorAll('article, main, section, div'));
  let bestEl: Element | null = null;
  let bestScore = -Infinity;
  for (const el of containers) {
    const s = scoreContainer(el);
    if (s > bestScore) { bestScore = s; bestEl = el; }
  }
  return bestEl || document.body;
}

function extractTitle(document: Document): string {
  const candidates = [
    document.querySelector('h1'),
    document.querySelector('[class*="title"]'),
    document.querySelector('title')
  ];

  for (const candidate of candidates) {
    if (candidate?.textContent?.trim()) {
      return candidate.textContent.trim();
    }
  }

  return 'Untitled Article';
}

function extractAuthor(document: Document): string | undefined {
  const authorSelectors = [
    '[rel="author"]',
    '.author',
    '.byline',
    '[class*="author"]',
    '[itemprop="author"]'
  ];

  for (const selector of authorSelectors) {
    const element = document.querySelector(selector);
    if (element?.textContent?.trim()) {
      return element.textContent.trim();
    }
  }

  return undefined;
}

function extractPublishDate(document: Document): string | undefined {
  const dateSelectors = [
    'time[datetime]',
    '[itemprop="datePublished"]',
    '.publish-date',
    '.post-date',
    '[class*="date"]'
  ];

  for (const selector of dateSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      const datetime = element.getAttribute('datetime');
      if (datetime) return datetime;
      if (element.textContent?.trim()) {
        return element.textContent.trim();
      }
    }
  }

  return undefined;
}

function parseContent(element: Element, title: string): ParsedElement[] {
  const parsed: ParsedElement[] = [];
  const seenContent = new Set<string>();
  const titleNormalized = title.toLowerCase().trim();

  seenContent.add(titleNormalized.slice(0, 100));

  const allElements = element.querySelectorAll('h1, h2, h3, h4, h5, h6, p, div, ul, ol, img');
  const elementsArray = Array.from(allElements);

  for (const child of elementsArray) {
    if (shouldSkipElement(child)) continue;

    const tagName = child.tagName.toLowerCase();
    const text = child.textContent?.trim() || '';

    if (tagName === 'div') {
      const hasBlockChildren = Array.from(child.children).some(c => {
        const tag = c.tagName.toLowerCase();
        return ['div', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'article', 'section'].includes(tag);
      });

      if (hasBlockChildren) continue;

      if (text.length >= 20 && text.length < 5000) {
        const normalizedText = text.toLowerCase().slice(0, 100);
        if (!seenContent.has(normalizedText) && text.toLowerCase().trim() !== titleNormalized) {
          seenContent.add(normalizedText);
          parsed.push({ type: 'paragraph', content: text });
        }
      }
      continue;
    }

    if (tagName === 'img') {
      const src = child.getAttribute('src');
      const alt = child.getAttribute('alt') || 'Image';
      if (src && !src.includes('icon') && !src.includes('logo') && !src.includes('avatar')) {
        parsed.push({ type: 'image', content: src, alt });
      }
      continue;
    }

    if (!text) continue;

    const normalizedText = text.toLowerCase().slice(0, 100);

    if (seenContent.has(normalizedText)) continue;
    if (text.toLowerCase().trim() === titleNormalized) continue;

    switch (tagName) {
      case 'h1':
        if (text.length <= 300 && !text.toLowerCase().includes(titleNormalized)) {
          seenContent.add(normalizedText);
          parsed.push({ type: 'heading2', content: text, level: 2 });
        }
        break;
      case 'h2':
        if (text.length <= 300) {
          seenContent.add(normalizedText);
          parsed.push({ type: 'heading2', content: text, level: 2 });
        }
        break;
      case 'h3':
        if (text.length <= 300) {
          seenContent.add(normalizedText);
          parsed.push({ type: 'heading3', content: text, level: 3 });
        }
        break;
      case 'h4':
      case 'h5':
      case 'h6':
        if (text.length <= 300) {
          seenContent.add(normalizedText);
          parsed.push({ type: 'heading4', content: text, level: 4 });
        }
        break;
      case 'p':
        if (text.length >= 5 && text.length < 5000) {
          const childElements = child.querySelectorAll('*');
          const hasNestedBlockElements = Array.from(childElements).some(el => {
            const tag = el.tagName.toLowerCase();
            return ['div', 'section', 'article', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tag);
          });

          if (!hasNestedBlockElements) {
            seenContent.add(normalizedText);
            parsed.push({ type: 'paragraph', content: text });
          }
        }
        break;
      case 'ul':
      case 'ol':
        const items = Array.from(child.querySelectorAll('li'))
          .map(li => {
            const liText = li.textContent?.trim() || '';
            const nestedList = li.querySelector('ul, ol');
            if (nestedList) {
              return liText.replace(nestedList.textContent || '', '').trim();
            }
            return liText;
          })
          .filter(item => item.length > 5 && item.length < 1000);

        if (items.length > 0 && items.length < 100) {
          const listKey = items.slice(0, 3).join('|').toLowerCase().slice(0, 100);
          if (!seenContent.has(listKey)) {
            seenContent.add(listKey);
            parsed.push({ type: 'list', content: '', items });
          }
        }
        break;
    }
  }

  return parsed;
}

function shouldSkipElement(element: Element): boolean {
  const className = element.className.toString().toLowerCase();
  const id = element.id.toLowerCase();
  const text = element.textContent?.trim().toLowerCase() || '';

  const skipPatterns = [
    'breaking', 'breadcrumb', 'share', 'social',
    'related', 'recommend', 'popular', 'trending', 'ads', 'banner',
    'widget', 'tag', 'category', 'comment', 'caption', 'byline',
    'meta', 'promo', 'newsletter', 'subscribe', 'footer', 'copyright'
  ];

  const hasSkipPattern = skipPatterns.some(pattern =>
    className.includes(pattern) || id.includes(pattern)
  );

  if (hasSkipPattern) return true;

  const skipPhrases = [
    'baca juga:', 'baca juga ', 'read also:', 'breaking news',
    'dark/light mode', 'switch mode', 'subscribe now',
    'follow us', 'share this', 'related articles', 'you may also like',
    'datenschutz', 'privacy policy', '© 20', 'copyright',
    'cookie', 'cookies', 'política de cookies', 'aviso legal', 'legal notice', 'política de privacidad',
    'added to cart', 'view cart', 'continue shopping', 'shopping cart', 'checkout', 'buy now',
    'añadido al carrito', 'ver carrito', 'seguir comprando', 'carrito', 'producto', 'comprar'
  ];

  const textLower = text.toLowerCase();
  const hasSkipPhrase = skipPhrases.some(phrase =>
    textLower === phrase || textLower.startsWith(phrase) || textLower.includes(phrase)
  );

  if (hasSkipPhrase) return true;

  const textLength = text.length;
  const linkCount = element.querySelectorAll('a').length;

  if (linkCount > 8 && textLength < 500) return true;

  if (textLength < 100 && linkCount > 3) return true;

  return false;
}

function fallbackExtraction(document: Document, title: string): ParsedElement[] {
  const parsed: ParsedElement[] = [];
  const seenContent = new Set<string>();
  const titleNormalized = title.toLowerCase().trim();

  seenContent.add(titleNormalized.slice(0, 100));

  const allParagraphs = document.querySelectorAll('p');
  const allHeadings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
  const allLists = document.querySelectorAll('ul, ol');
  const allDivs = document.querySelectorAll('div');

  const elements: Element[] = [];
  allHeadings.forEach(h => elements.push(h));
  allParagraphs.forEach(p => elements.push(p));
  allLists.forEach(l => elements.push(l));
  allDivs.forEach(d => {
    const hasBlockChildren = Array.from(d.children).some(c => {
      const tag = c.tagName.toLowerCase();
      return ['div', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'article', 'section'].includes(tag);
    });
    if (!hasBlockChildren) elements.push(d);
  });

  elements.sort((a, b) => {
    const posA = a.compareDocumentPosition(b);
    if (posA & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
    if (posA & Node.DOCUMENT_POSITION_PRECEDING) return 1;
    return 0;
  });

  for (const element of elements) {
    if (shouldSkipElement(element)) continue;

    const tagName = element.tagName.toLowerCase();
    const text = element.textContent?.trim() || '';

    if (!text || text.length < 5) continue;

    const normalizedText = text.toLowerCase().slice(0, 100);
    if (seenContent.has(normalizedText)) continue;
    if (text.toLowerCase().trim() === titleNormalized) continue;

    seenContent.add(normalizedText);

    switch (tagName) {
      case 'h1':
        if (text.length <= 300) {
          parsed.push({ type: 'heading2', content: text, level: 2 });
        }
        break;
      case 'h2':
        if (text.length <= 300) {
          parsed.push({ type: 'heading2', content: text, level: 2 });
        }
        break;
      case 'h3':
        if (text.length <= 300) {
          parsed.push({ type: 'heading3', content: text, level: 3 });
        }
        break;
      case 'h4':
      case 'h5':
      case 'h6':
        if (text.length <= 300) {
          parsed.push({ type: 'heading4', content: text, level: 4 });
        }
        break;
      case 'div':
      case 'p':
        if (text.length >= 5 && text.length < 5000) {
          parsed.push({ type: 'paragraph', content: text });
        }
        break;
      case 'ul':
      case 'ol':
        const items = Array.from(element.querySelectorAll('li'))
          .map(li => li.textContent?.trim() || '')
          .filter(item => item.length > 5 && item.length < 1000);
        if (items.length > 0 && items.length < 100) {
          parsed.push({ type: 'list', content: '', items });
        }
        break;
    }
  }

  return parsed;
}
