export interface ArticleContent {
  title: string;
  author?: string;
  publishDate?: string;
  content: ParsedElement[];
}

export interface ParsedElement {
  type: 'heading1' | 'heading2' | 'heading3' | 'heading4' | 'paragraph' | 'list' | 'image';
  content: string;
  level?: number;
  items?: string[];
  alt?: string;
}
