/* eslint-disable @typescript-eslint/no-var-requires */
import marked from 'marked';
import markDownBody from '~/styles/mark-down-body.min.css';
import lineWavy from '~/styles/line-wavy.css';
import atomOneDark from '~/styles/atom-one-dark.min.css';

// @ts-ignore
import customHeadingId from 'marked-custom-heading-id';

import type { LinksFunction } from '@remix-run/node';

export const links: LinksFunction = () => {
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

marked.setOptions({
  // @ts-ignore
  highlight: function (code, lang) {
    const hljs = require('highlight.js/lib/common');
    const language = hljs.getLanguage(lang) ? lang : 'plaintext';

    return hljs.highlight(code, { language }).value;
  },
  langPrefix: 'hljs language-',
  headerPrefix: 'section-',
});
marked.use(customHeadingId());

const renderer = {
  heading(text:string, level:string) {
    const escapedText = text.toLowerCase().substring(
      text.indexOf('="') + 2, 
      text.lastIndexOf('">')
  );
console.log('escapedText', {text, escapedText});

    return `
    </section>
    <section id="${escapedText.replace("#", '')}">
            <h${level}>
              ${text}
            </h${level}>`;

  }
};

marked.use({ renderer });

export default function TextWithMarkdown({
  text = '',
  customClasses = '',
  style = {},
}: {
  text?: string;
  customClasses?: string;
  style?: object;
}) {
  return (
    <div
      className={`markdown-body w-full ${customClasses}`}
      style={style}
      dangerouslySetInnerHTML={{
        __html: marked.parse(text, {
          sanitize: true,
        }),
      }}
    />
  );
}
