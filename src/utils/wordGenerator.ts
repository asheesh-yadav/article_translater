import { Document, Packer, Paragraph, TextRun, AlignmentType, ExternalHyperlink } from 'docx';
import { ArticleContent } from '../types/article';

export async function generateWordDocument(article: ArticleContent, keywords: string[] = [], sourceUrl?: string): Promise<Blob> {
  console.log('generateWordDocument called with:', {
    hasArticle: !!article,
    title: article?.title,
    contentLength: article?.content?.length,
    keywords: keywords
  });

  if (!article) {
    throw new Error('Article is undefined');
  }

  if (!article.content || !Array.isArray(article.content)) {
    throw new Error('Article content is missing or invalid');
  }

  const children: Paragraph[] = [];
  

  // ----------logo and external link
  // ---------------- OmniDash Header ----------------
children.push(
  new Paragraph({
    children: [
      new TextRun({
        text: 'LexiMorph',
        bold: true,
        size: 28,
      }),
    ],
    alignment: AlignmentType.LEFT,
  })
);

children.push(
  new Paragraph({
    children: [
      new ExternalHyperlink({
        link: 'https://omnitrix.ai',
        children: [
          new TextRun({
            text: 'https://omnitrix.ai',
            style: 'Hyperlink',
          }),
        ],
      }),
    ],
    alignment: AlignmentType.LEFT,
    spacing: { after: 200 },
  })
);

children.push(
  new Paragraph({
    children: [
      new TextRun({
        text: '________________________________________',
      }),
    ],
    spacing: { after: 300 },
  })
);
// ------------------------------------------------


  // ----------- article url
  if (sourceUrl) {
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'Source Article:',
          bold: true,
          size: 22,
        }),
      ],
    })
  );

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: sourceUrl,
          color: '0563C1',
          underline: {},
          size: 22,
        }),
      ],
      spacing: { after: 300 },
    })
  );

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: '________________________________________',
        }),
      ],
      spacing: { after: 400 },
    })
  );
}
// ------------------------------------
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: article.title || 'Untitled',
          bold: true,
          size: 32
        })
      ],
      alignment: AlignmentType.LEFT,
      spacing: {
        after: 400
      }
    })
  );

  if (article.author) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `By ${article.author}`,
            italics: true
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: {
          after: 200
        }
      })
    );
  }

  if (article.publishDate) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: article.publishDate,
            size: 20,
            color: '666666'
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: {
          after: 400
        }
      })
    );
  }

  for (const element of article.content) {
    switch (element.type) {
      case 'heading1':
        children.push(
          new Paragraph({
            children: highlightTextInRuns(element.content, keywords, true, 32),
            spacing: {
              before: 400,
              after: 200
            }
          })
        );
        break;

      case 'heading2':
        children.push(
          new Paragraph({
            children: highlightTextInRuns(element.content, keywords, true, 28),
            spacing: {
              before: 300,
              after: 150
            }
          })
        );
        break;

      case 'heading3':
        children.push(
          new Paragraph({
            children: highlightTextInRuns(element.content, keywords, true, 26),
            spacing: {
              before: 200,
              after: 100
            }
          })
        );
        break;

      case 'heading4':
        children.push(
          new Paragraph({
            children: highlightTextInRuns(element.content, keywords, true, 24),
            spacing: {
              before: 200,
              after: 100
            }
          })
        );
        break;

      case 'paragraph':
        children.push(
          new Paragraph({
            children: highlightTextInRuns(element.content, keywords, false, 24),
            spacing: {
              after: 200,
              line: 360
            }
          })
        );
        break;

      case 'list':
        if (element.items) {
          element.items.forEach(item => {
            const bulletRun = new TextRun({ text: '• ', size: 24 });
            const itemRuns = highlightTextInRuns(item, keywords, false, 24);
            children.push(
              new Paragraph({
                children: [bulletRun, ...itemRuns],
                spacing: {
                  after: 100
                },
                indent: {
                  left: 360
                }
              })
            );
          });
          children.push(
            new Paragraph({
              text: '',
              spacing: {
                after: 200
              }
            })
          );
        }
        break;

      case 'image':
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `[Image: ${element.alt || 'Image'}]`,
                italics: true,
                color: '666666'
              })
            ],
            spacing: {
              before: 200,
              after: 200
            }
          })
        );
        break;
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: children
      }
    ]
  });

  const blob = await Packer.toBlob(doc);
  return blob;
}

function highlightTextInRuns(text: string, keywords: string[], isBold: boolean = false, fontSize: number = 24): TextRun[] {
  if (keywords.length === 0 || !text) {
    return [new TextRun({ text, bold: isBold, size: fontSize })];
  }

  console.log('Highlighting text with keywords:', keywords, 'in text:', text.substring(0, 50));

  const escapedKeywords = keywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const pattern = new RegExp(`(${escapedKeywords.join('|')})`, 'gi');
  const parts = text.split(pattern);

  return parts
    .filter(part => part.length > 0)
    .map(part => {
      const isKeyword = keywords.some(keyword =>
        part.toLowerCase() === keyword.toLowerCase()
      );

      if (isKeyword) {
        return new TextRun({
          text: part,
          bold: true,
          highlight: 'yellow',
          size: fontSize
        });
      }
      return new TextRun({ text: part, bold: isBold, size: fontSize });
    });
}

export function downloadWordDocument(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.docx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
