// ---------------------------------------------------------------------------
// Markdown preparation for assistant replies.
// ---------------------------------------------------------------------------

// Fenced code blocks (closed, or still streaming to the end) and inline code
// spans. Text inside these is shown verbatim, so no transform may touch it.
const CODE_SEGMENTS = /(```[\s\S]*?(?:```|$)|~~~[\s\S]*?(?:~~~|$)|`[^`\n]*`)/g;

function mapOutsideCode(markdown: string, fn: (text: string) => string): string {
  return markdown
    .split(CODE_SEGMENTS)
    .map((part, i) => (i % 2 === 1 ? part : fn(part)))
    .join('');
}

// This is a financial assistant: "$648.1B" is a figure, not the start of a
// LaTeX expression. The web app turns off single-dollar maths for that reason
// (remark-math singleDollarTextMath: false). The native renderer has no such
// switch, so single "$" signs are escaped instead; "$$...$$" block maths still
// renders.
function escapeSingleDollars(text: string): string {
  let out = '';
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch !== '$') {
      out += ch;
    } else if (text[i + 1] === '$') {
      out += '$$';
      i++;
    } else if (i > 0 && text[i - 1] === '\\') {
      out += ch; // already escaped
    } else {
      out += '\\$';
    }
  }
  return out;
}

// Sources should trail the text they support. When the model drops a
// citation link between two sentences ("…Nebraska. [Britannica](url) He's…"),
// move it to the end of that paragraph. Ported from the web app's Chat.jsx.
function reflowCitations(markdown: string): string {
  if (!markdown.includes('](')) return markdown;
  const between = /([.!?][)\]"'’”]?)\s+((?:\[[^\]]+\]\([^)]+\)\s*)+?)(?=[A-Z"“'‘(])/g;
  return markdown
    .split(/(\n{2,})/)
    .map((block) => {
      if (!block.includes('](')) return block;
      const moved: string[] = [];
      const out = block.replace(between, (_match, before: string, run: string) => {
        moved.push(...(run.match(/\[[^\]]+\]\([^)]+\)/g) || []));
        return `${before} `;
      });
      return moved.length ? `${out.replace(/\s+$/, '')} ${moved.join(' ')}` : block;
    })
    .join('');
}

export function prepareAssistantMarkdown(content: string): string {
  if (!content) return '';
  return mapOutsideCode(reflowCitations(content), escapeSingleDollars);
}

// The claim quoted in the sources panel is sliced straight out of the answer,
// so its markdown markers are stripped rather than rendered a second time.
export function plainText(markdown: string): string {
  return (markdown || '')
    .replace(/```[\s\S]*?```/g, '') // fenced code
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '') // images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // links -> their text
    .replace(/(\*\*\*|___)(.+?)\1/g, '$2') // bold italic
    .replace(/(\*\*|__)(.+?)\1/g, '$2') // bold
    .replace(/(^|[^\w])([*_])(?!\s)(.+?)\2(?!\w)/g, '$1$3') // italic
    .replace(/`([^`]+)`/g, '$1') // inline code
    .replace(/^\s{0,3}#{1,6}\s+/gm, '') // headings
    .replace(/^\s{0,3}>\s?/gm, '') // block quotes
    .replace(/^\s*[-*+]\s+/gm, '') // bullets
    .replace(/\s+/g, ' ')
    .trim();
}

// Only these schemes are opened from a reply; anything else stays inert.
export function isSafeLink(url: string): boolean {
  return /^(https?:|mailto:)/i.test((url || '').trim());
}
