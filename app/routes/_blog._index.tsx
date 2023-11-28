import type { LinksFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { PostArticle } from '~/components/PostArticle';
import { getPublishPosts } from '~/model/post.server';

import lineWavy from '~/styles/line-wavy.css';

export const links: LinksFunction = () => {
  return [{ rel: 'stylesheet', href: lineWavy }];
};

export async function loader() {
  const postArticles = await getPublishPosts();

  return json({ postArticles });
}

export default function BlogIndex() {
  const { postArticles } = useLoaderData<typeof loader>();

  return (
    <>
      <section className="2xlg:max-w-7xl relative z-10 mx-auto flex w-full px-4 pb-[80px] pt-[50px] text-slate-800 sm:flex-row sm:px-4 sm:pb-[50px] md:max-w-3xl md:px-0 lg:max-w-5xl">
        <div className="flex-3">
          <h1 className="my-4 text-5xl font-semibold lg:text-7xl">
            Hi, I am
            <span className="relative mx-5 inline-block before:absolute before:-inset-1 before:block before:-skew-y-3 before:bg-pink-500">
              <em className="relative inline-block font-semibold text-white">Robotooo!</em>
            </span>
          </h1>
          <h1 className="my-3 text-3xl font-semibold lg:text-4xl">
            Welcome to the <em className="text-sky-500 underline decoration-wavy">"rabbit hole"!!!</em>
          </h1>
        </div>
        <div className="hidden flex-1 sm:block">
          <img src="assets/images/robot-cute.webp" alt="robot-cute-Ouch" width={256} height={311} />
        </div>
      </section>
      <section className="mx-auto mb-5 flex flex-col px-6 md:w-4/5 lg:max-w-2xl 2xl:max-w-3xl">
        {postArticles.map((post, index) => (
          <div className="my-5" key={post.id}>
            <PostArticle
              {...post}
              author={post.user}
              createdAt={new Date(post.createdAt)}
              updatedAt={new Date(post.updatedAt)}
            />
            {index < postArticles.length - 1 && <hr className="line-wavy" />}
          </div>
        ))}
      </section>
    </>
  );
}
