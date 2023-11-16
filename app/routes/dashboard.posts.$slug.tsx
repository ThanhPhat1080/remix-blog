import type { ActionFunctionArgs, LinksFunction, LoaderFunctionArgs } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { Form, Link, isRouteErrorResponse, useLoaderData, useRouteError, useNavigation } from '@remix-run/react';
import invariant from 'tiny-invariant';

import type { Post } from '~/model/post.server';
import { deletePostBySlug, getPostBySlug } from '~/model/post.server';
import { requireUserId } from '~/server/session.server';
import { isEmptyOrNotExist } from '~/utils';

import { getUserById } from '~/model/user.server';
import ROUTERS from '~/constants/routers';
import { PostArticleContent, links as PostArticleContentLinks } from '~/components/PostArticleContent';
import { PostLoadingSkeleton } from '~/components';

export const links: LinksFunction = () => {
  return [...PostArticleContentLinks()];
};

type LoaderData = { post: Post };

export const meta = ({ data }: { data: LoaderData }) => {
  if (!data) {
    return [
      {
        title: 'No post',
        description: 'No blog found',
      },
    ];
  }
  return [
    {
      title: `Blog: "${data.post.title}"`,
      description: data.post.preface,
    },
  ];
};

export async function loader({ request, params }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);

  const author = await getUserById(userId);
  const post = await getPostBySlug(params.slug || '', userId);

  if (isEmptyOrNotExist(post) || isEmptyOrNotExist(author)) {
    throw new Response('Not Found', { status: 404 });
  }

  return json({ post });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  invariant(params.slug, `Not found this post with slug: ${params.slug}`);

  await deletePostBySlug({ userId, slug: params.slug });

  return redirect(`${ROUTERS.DASHBOARD}/posts`);
}

export default function NoteDetailsPage() {
  const { post } = useLoaderData<typeof loader>() as {
    post: Post;
  };
  const navigation = useNavigation();
  const isLoading = navigation.state === 'loading';

  return (
    <div className="relative">
      {!isLoading && (
        <div className="w-100 text-md sticky top-0 z-20 flex h-10 items-center justify-between gap-4 bg-slate-600 p-2 py-1 text-slate-200">
          {post.isPublish ? (
            <div>
              <strong className="mr-2 rounded-xl border-2 border-green-500 px-3 text-green-500">Published</strong>
              <Link to={`${ROUTERS.BLOG}/${post.slug}`} className="text-lg text-sky-500 hover:underline" prefetch="intent">
                <strong>Go to post</strong>
              </Link>
            </div>
          ) : (
            <>
              <div className=" rounded-xl border-2 border-gray-500 px-3 dark:text-gray-500">Draft</div>
            </>
          )}

          <div className="flex items-center gap-4">
            <Link prefetch="intent" title="Edit" to={`${ROUTERS.POST_EDITOR}?id=${post.id}`}>
              Edit
            </Link>
            <Form method="delete">
              <button type="submit" className="text-md rounded-lg bg-red-500 px-2 py-1 text-white">
                <strong>Delete</strong>
              </button>
            </Form>
          </div>
        </div>
      )}
      <div className="mx-auto my-12 flex min-h-screen max-w-6xl flex-col px-3">
        {isLoading ? (
          <PostLoadingSkeleton />
        ) : (
          <PostArticleContent
            {...post}
            author={post.user}
            createdAt={new Date(post.createdAt)}
            updatedAt={new Date(post.updatedAt)}
          />
        )}
      </div>
    </div>
  );
}

export function CatchBoundary() {
  const caughtError = useRouteError();

  // when true, this is what used to go to `CatchBoundary`
  if (isRouteErrorResponse(caughtError)) {
    return (
      <div>
        <h1>Oops. Post not found</h1>
        <p>Status: {caughtError.status}</p>
        <p>{caughtError.data.message}</p>
      </div>
    );
  }

  return (
    <div>
      <h1>Uh oh ...</h1>
      <p>Something went wrong.</p>
      <pre>{caughtError?.toString()}</pre>
    </div>
  );
}
