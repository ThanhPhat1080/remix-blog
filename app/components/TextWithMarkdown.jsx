import { Marked } from 'marked';
import markDownBody from '~/styles/mark-down-body.min.css';
import lineWavy from '~/styles/line-wavy.css';
import atomOneDark from '~/styles/atom-one-dark.min.css';
import { markedHighlight } from 'marked-highlight';
import hljs from 'highlight.js';
import customHeadingId from 'marked-custom-heading-id';

export const links = () => {
  return [
    {
      rel: 'stylesheet',
      href: 'https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.1.0/github-markdown-dark.min.css',
      crossOrigin: 'anonymous',
    },

    {
      rel: 'stylesheet',
      href: markDownBody,
    },
    {
      rel: 'stylesheet',
      href: lineWavy,
    },
    {
      rel: 'stylesheet',
      href: atomOneDark,
    },
  ];
};

const marked = new Marked(
  markedHighlight({
    langPrefix: 'hljs language-',
    headerPrefix: 'section-',
    highlight(code, lang) {
      const language = hljs.getLanguage(lang) ? lang : 'plaintext';
      return hljs.highlight(code, { language }).value;
    },
  }),
);

// The sectionLevel will help us prevent matching the same header multiple times.
let sectionLevel = 1;

// Creating regular expressions is expensive so we create them once.
// Create 7 sections since that is the maximum heading level.
const sectionRegexps = new Array(7).fill().map((e, i) => new RegExp(`^(#{${i + 1}} )[^]*?(?:\\n(?=\\1)|$)`));

const sectionExtension = {
  extensions: [
    {
      name: 'sectionBlock',
      level: 'block',
      start(src) {
        // Match when # is at the beginning of a line.
        return src.match(/^#/m)?.index;
      },
      tokenizer(src) {
        const match = src.match(sectionRegexps[sectionLevel]);
        if (!match) {
          return;
        }

        sectionLevel++;
        // Tokenize text inside the section.
        // Only add sectionBlock token for headers one level up from current level.
        const tokens = this.lexer.blockTokens(match[0]);
        sectionLevel--;

        return {
          type: 'sectionBlock',
          raw: match[0],
          level: sectionLevel + 1,
          tokens,
        };
      },
      renderer(token) {
        const tag = token.level === 1 ? 'article' : 'section';
        const heading = token.tokens.find(item => item.type === 'heading');
        const headingId = heading.tokens
          .find(item => item.type === 'link')
          ?.href.toString()
          .replace('#', '');

        return `<${tag} id="${headingId}">\n${this.parser.parse(token.tokens)}</${tag}>\n`;
      },
    },
  ],
};

marked.use(customHeadingId(), sectionExtension);

export default function TextWithMarkdown({ text = '', customClasses = '', style = {} , id = ''}) {
  return (
    <div
      className={customClasses}
      style={style}
      id={id}
      dangerouslySetInnerHTML={{
        __html: marked.parse(text),
      }}
    />
  );
}
