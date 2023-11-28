import type { Post } from '@prisma/client';
import CloudinaryImageLoader from './CloudinaryImageLoader';
import TextWithMarkdown, { links as TextWithMarkdownLinks } from './TextWithMarkdown';
import type { LinksFunction } from '@remix-run/node';

export const links: LinksFunction = () => {
  return [...TextWithMarkdownLinks()];
};

export const PostArticleContent = (props: Partial<Post>) => {
  const {
    title,
    preface,
    coverImage,
    body,
    // updatedAt = ''
  } = props;

  // const updateAtString = new Date(updatedAt).toJSON().slice(0, 10).replace(/-/g, '/');

  return (
    <article aria-details={title} aria-label={title} className="w-full">
      <h1 className="text-stale-800 my-8 text-4xl font-bold lg:text-6xl">{title}</h1>

      <div className="mt-4 h-64 overflow-hidden rounded-xl shadow-lg md:h-80 lg:h-96">
        <CloudinaryImageLoader
          alt={title || ''}
          src={coverImage || ''}
          options={{ fit: 'cover' }}
          responsive={[
            {
              size: {
                width: 675,
              },
              maxWidth: 1024,
            },
          ]}
          width="675"
          height="675"
          className="h-full w-full object-cover"
        />
      </div>
      <div className="my-8 border-l-4 border-slate-500 pl-4 text-gray-400">
        <blockquote aria-details={preface} className="px-3 text-lg italic">
          {preface}
        </blockquote>
      </div>
      <hr className="line-wavy" />

      <div className="py-6">
        <TextWithMarkdown
          id="markdown-body-article"
          customClasses="markdown-body w-full"
          text={body}
          style={{ background: 'inherit', fontSize: '1em' }}
        />
      </div>
    </article>
  );
};
