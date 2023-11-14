import * as React from 'react';

/// TODO: check slug before upload image

import type { LinksFunction, MetaFunction, LoaderFunctionArgs, ActionFunctionArgs } from '@remix-run/node';
import { json, redirect, unstable_parseMultipartFormData as parseMultipartFormData } from '@remix-run/node';
import { Form, useActionData, useLoaderData, useNavigation } from '@remix-run/react';

import type { Post } from '~/model/post.server';
import { createPost, getPostBySlug, getPost, updatePost } from '~/model/post.server';
import { requireUserId } from '~/server/session.server';

import { SwitchButton, SwitchButtonLink, TextareaEditorSimple, TextWithMarkdown } from '~/components';
import { links as TextWithMarkdownLinks } from '~/components/TextWithMarkdown';
import { convertUrlSlug, convert_Vi_To_Eng, isEmptyOrNotExist } from '~/utils';

import ROUTERS from '~/constants/routers';
import { uploadImageHandler } from '~/server/cloudinaryUtils.server';

export const handle = { hydrate: true };

export const links: LinksFunction = () => {
  return [...SwitchButtonLink(), ...TextWithMarkdownLinks()];
};

export const meta: MetaFunction = () => [
  {
    charset: 'utf-8',
    title: 'Editor',
  },
];

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);

  const url = new URL(request.url);
  const id = url.searchParams.get('id');

  if (isEmptyOrNotExist(id)) {
    return json({ isEdit: false });
  }

  const post = await getPost({ id, userId });
  if (isEmptyOrNotExist(post)) {
    throw new Response("Can not found your post or you don't have permission to edit this one: ", { status: 404 });
  }

  return json({ post, isEdit: true });
}

export async function action({ request }: ActionFunctionArgs) {
  const defaultErrorObj = {
    title: null,
    preface: null,
    body: null,
    slug: null,
    coverImage: null,
    serverError: null,
  };

  const userId = await requireUserId(request);

  // Collect form data
  const formData = await parseMultipartFormData(request, uploadImageHandler('coverImage'));
  const slug = formData.get('slug');
  const title = formData.get('title');
  const preface = formData.get('preface');
  const body = formData.get('body');
  const coverImage = formData.get('coverImage') as string;
  const isPublish = !isEmptyOrNotExist(formData.get('isPublish'));
  const postId = formData.get('id') || null;

  if (isEmptyOrNotExist(title)) {
    return json({ errors: { ...defaultErrorObj, title: 'Title is required' } }, { status: 400 });
  }

  if (isEmptyOrNotExist(preface)) {
    return json({ errors: { ...defaultErrorObj, preface: 'Preface is required' } }, { status: 400 });
  }

  if (isEmptyOrNotExist(body)) {
    return json({ errors: { ...defaultErrorObj, body: 'Body is required' } }, { status: 400 });
  }

  // Get the post by slug
  const post: Post | null = (await getPostBySlug(slug?.toString() || '')) || null;

  // Create new post if method is 'POST'
  if (request.method.toUpperCase() === 'POST') {
    // Checking is post slug (generation form post title) already exists.
    // If exist, throw error; user must find another name.
    if (post) {
      return json(
        {
          errors: {
            ...defaultErrorObj,
            slug: 'This title or slug already taken',
          },
        },
        { status: 400 },
      );
    }

    // Handle validate upload image
    if (isEmptyOrNotExist(coverImage)) {
      return json(
        {
          errors: {
            ...defaultErrorObj,
            coverImage: "Fail to upload your cover image. It's require. Please try again!",
          },
        },
        { status: 400 },
      );
    }

    // Create new post
    const newPost = await createPost({
      title,
      preface,
      body,
      coverImage,
      isPublish,
      userId,
      slug: convertUrlSlug(title, '-', convert_Vi_To_Eng),
    });

    return redirect(`${ROUTERS.DASHBOARD}/posts/${newPost.slug}`);
  }

  // Update post if method is 'PATCH'
  if (request.method.toUpperCase() === 'PATCH' && !isEmptyOrNotExist(postId)) {
    if (post === null || post.id === postId) {
      const updatedPost = await updatePost({
        id: postId,
        title,
        preface,
        body,
        coverImage,
        isPublish,
        slug: convertUrlSlug(title, '-', convert_Vi_To_Eng),
      });

      return redirect(`${ROUTERS.DASHBOARD}/posts/${updatedPost.slug}`);
    }
  }

  return json({
    errors: {
      ...defaultErrorObj,
      serverError: 'Can not execute this action. Please try again!',
    },
    status: 400,
  });
}

export default function PostEditorForm() {
  const { post, isEdit } = useLoaderData<typeof loader>() as {
    post: Post;
    isEdit: boolean;
  };
  const { state: transitionState } = useNavigation();
  const isSubmitting = transitionState === 'submitting';

  const postTitle = isEdit ? post.title : '';
  const postPreface = isEdit ? post.preface : '';
  const postBody = isEdit ? post.body : '';
  const postSlug = isEdit ? post.slug : '';
  const postCoverImage = isEdit ? ROUTERS.LOADER_CLOUDINARY_IMAGE + post.coverImage : '';
  const postIsPublish = isEdit ? post.isPublish : false;

  const [postPreview, setNotePreview] = React.useState({
    title: postTitle,
    preface: postPreface,
    body: postBody,
    slug: postSlug,
  });
  const [postCoverImagePreview, setPostCoverImage] = React.useState<string>(postCoverImage);

  const actionData = useActionData<typeof action>();
  const titleRef = React.useRef<HTMLInputElement>(null);
  const prefaceRef = React.useRef<HTMLInputElement>(null);
  const bodyRef = React.useRef<HTMLTextAreaElement>(null);
  const slugRef = React.useRef<HTMLInputElement>(null);

  const isTitleError = !isEmptyOrNotExist(actionData?.errors?.title);
  const isPrefaceError = !isEmptyOrNotExist(actionData?.errors?.preface);
  const isBodyError = !isEmptyOrNotExist(actionData?.errors?.body);
  const isSlugError = !isEmptyOrNotExist(actionData?.errors?.slug);
  const isUploadCoverImageError = !isEmptyOrNotExist(actionData?.errors?.coverImage);

  React.useEffect(() => {
    if (isTitleError) {
      titleRef.current?.focus();
    }
    if (isPrefaceError) {
      prefaceRef.current?.focus();
    }
    if (isBodyError) {
      bodyRef.current?.focus();
    }
    if (isSlugError) {
      slugRef.current?.focus();
    }
  });

  const onUploadCoverImage = (e: any) => {
    if (!e.target.files || e.target.files.length === 0) {
      setPostCoverImage('');
      return;
    }

    const objectUrl = URL.createObjectURL(e.target.files[0]);
    setPostCoverImage(objectUrl);
  };

  const onBodyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotePreview(prev => ({
      ...prev,
      body: e.target.value,
    }));
  };

  return (
    <>
      <div className="flex h-screen bg-amber-50 text-slate-700 dark:bg-slate-600 dark:text-slate-200">
        <div className="h-full flex-1 border-r-2 border-gray-400 bg-slate-800">
          <Form
            encType="multipart/form-data"
            method={isEdit ? 'patch' : 'post'}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
              width: '100%',
              flex: 1,
              height: '100%',
              padding: '0',
            }}
            id="form-editor">
            <div className="w-100 flex h-8 items-center justify-between bg-slate-700 p-2 text-sm text-slate-200">
              <a
                href={ROUTERS.DASHBOARD + '/posts'}
                className="inline-flex items-center gap-1 px-1 text-sm font-semibold text-white duration-300 ease-in-out hover:scale-110 hover:underline focus:scale-110 active:scale-90">
                <img alt="return" src="/assets/icons/back.svg" />
                Return
              </a>
              <div className="flex items-center gap-4">
                <SwitchButton label="Publish" name="isPublish" isChecked={postIsPublish} />
                {/* <SwitchButton label="Auto save" name="autoSave" isChecked={postIsPublish} /> */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center rounded-md bg-sky-500 px-2 text-sm text-white duration-300 ease-in-out hover:scale-110 hover:bg-sky-600 focus:scale-110 focus:ring-sky-800 active:scale-90 active:bg-sky-700">
                  {transitionState === 'submitting' && (
                    <svg
                      className="-ml-1 mr-3 h-3 w-3 animate-spin text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  )}
                  Save
                </button>
              </div>
            </div>
            <div className="flex h-full flex-1 flex-col px-1">
              {/* ---Cover image --- */}
              <label htmlFor="img-field" className="flex w-full flex-col gap-1 text-sm">
                Upload your post cover image here
                <input
                  id="img-field"
                  type="file"
                  name="coverImage"
                  accept="image/*"
                  readOnly
                  onChange={onUploadCoverImage}
                />
                {isUploadCoverImageError && (
                  <div className="pt-1 text-red-700" id="body-error">
                    {actionData?.errors.coverImage}
                  </div>
                )}
              </label>

              {/* ---Title--- */}
              <label className="flex w-full flex-col gap-1 text-sm">
                Title
                <input
                  ref={titleRef}
                  name="title"
                  autoFocus
                  className="w-full rounded border bg-white px-2 py-1 text-slate-600 dark:border-gray-200 dark:bg-slate-800 dark:text-white"
                  aria-invalid={isTitleError ? true : undefined}
                  aria-errormessage={isTitleError ? 'title-error' : undefined}
                  onChange={e =>
                    setNotePreview(prev => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                  required
                  defaultValue={postTitle}
                />
                {isTitleError && (
                  <div className="pt-1 text-red-700" id="title-error">
                    {actionData?.errors.title}
                  </div>
                )}
                {isSlugError && (
                  <div className="pt-1 text-red-700" id="title-error">
                    {actionData?.errors.slug}. Please find another one.
                  </div>
                )}
              </label>

              {/* ---Hidden fields--- */}
              <input
                name="slug"
                className="hidden"
                readOnly
                value={convertUrlSlug(postPreview.title, '-', convert_Vi_To_Eng)}
              />
              <input name="id" className="hidden" readOnly value={post?.id ?? ''} />

              {/* ---Preface--- */}
              <label className="flex w-full flex-col gap-1 text-sm">
                Preface
                <textarea
                  rows={3}
                  name="preface"
                  className="w-full rounded border bg-white px-2 py-1 text-slate-600 dark:border-gray-200 dark:bg-slate-800 dark:text-white"
                  aria-invalid={isPrefaceError ? true : undefined}
                  aria-errormessage={isPrefaceError ? 'preface-error' : undefined}
                  onChange={e =>
                    setNotePreview(prev => ({
                      ...prev,
                      preface: e.target.value,
                    }))
                  }
                  required
                  defaultValue={postPreface}
                />
                {isPrefaceError && (
                  <div className="pt-1 text-red-700" id="title-error">
                    {actionData?.errors.preface}
                  </div>
                )}
              </label>

              {/* ---Body--- */}
              <label className="flex w-full flex-1 flex-col gap-1 text-sm" style={{}}>
                <span>
                  Body in{' '}
                  <a
                    className="text-sky-400 hover:underline"
                    href="https://www.markdownguide.org/basic-syntax/"
                    target="blank">
                    Markdown syntax
                  </a>
                </span>
                <TextareaEditorSimple
                  innerRef={bodyRef}
                  name="body"
                  isRequired
                  isError={isBodyError}
                  onChange={onBodyChange}
                  defaultValue={postBody || ''}
                />
                {isBodyError && (
                  <div className="pt-1 text-red-700" id="body-error">
                    {actionData?.errors.body}
                  </div>
                )}
              </label>
            </div>
          </Form>
        </div>
        <div className="flex h-full flex-1 flex-col overflow-scroll border-l-2 border-gray-400">
          <div className="w-100 flex h-8 items-center justify-center bg-slate-700 p-2 text-sm text-slate-200">
            <h2 className="font-bold">Live Preview</h2>
          </div>
          <div className="relative flex flex-1 flex-col px-1 pt-3 dark:bg-slate-800">
            <em className="text-sm">Your preview post title goes here</em>

            <h2 className="min-h-[3rem] text-center text-3xl font-bold">
              {postPreview.title ? postPreview.title : <em className="text-slate-400">Your title goes here</em>}
            </h2>
            <em className="text-sm">Your preview post preface goes here</em>

            <h3 className="my-4 border-l-2 border-slate-200 pl-2 text-lg">
              {postPreview.preface ? postPreview.preface : <em className="text-slate-400">Your preface goes here</em>}
            </h3>
            <label className="my-3 flex w-full flex-col gap-1 text-sm">
              <em>Your preview post slug goes here</em>
              <input
                readOnly
                className="dark:text-gray w-full rounded-md border-2 border-gray-100 px-3 text-sm italic leading-loose"
                aria-invalid={isSlugError ? true : undefined}
                aria-errormessage={isSlugError ? 'preface-error' : undefined}
                value={convertUrlSlug(postPreview.title, '-', convert_Vi_To_Eng)}
                disabled
              />
            </label>
            <label className="my-3 flex w-full flex-col gap-1 text-sm">
              <em className="my-3 text-sm">Your preview post cover image goes here</em>
              {isEmptyOrNotExist(postCoverImagePreview) ? (
                <div className="b-col mx-auto my-2 inline-block h-10 w-10 rounded-md border-2 border-gray-200 shadow-lg"></div>
              ) : (
                <img
                  alt="preview-cover"
                  className="mx-auto my-8 rounded-md shadow-lg"
                  width={300}
                  src={postCoverImagePreview}
                />
              )}
            </label>
            <em className="my-3 text-sm">Your preview post content goes here</em>
            <div className="relative h-full flex-1 rounded border-t-2 border-gray-100 bg-orange-50 dark:bg-slate-800">
              <TextWithMarkdown
                customClasses="flex-1 text-xs absolute px-4 pt-5 pb-10"
                text={postPreview.body}
                style={{ background: 'inherit' }}
              />
            </div>
          </div>
        </div>
      </div>
      <script
        dangerouslySetInnerHTML={{
          __html: `
          window.onload = function() {
            const formEditorInitialEntries = new FormData(document.getElementById('form-editor')).entries();
            const formEditorDataInitial = Array.from(formEditorInitialEntries, ([x,y]) => x.toString() + y.toString()).join('');

            window.addEventListener("beforeunload", function (e) {
                const formEditorCurrentlyEntries = new FormData(document.getElementById('form-editor')).entries();
                const formEditorDataCurrently = Array.from(formEditorCurrentlyEntries, ([x,y]) => x.toString() + y.toString()).join('');

                const isFormDirty = formEditorDataInitial !== formEditorDataCurrently;
                if (!isFormDirty) {
                    return undefined;
                }

                const confirmationMessage = 'It looks like you have been editing something. '
                                        + 'If you leave before saving, your changes will be lost.';

                (e || window.event).returnValue = confirmationMessage;
                return confirmationMessage;
            });
          };`,
        }}
      />
    </>
  );
}
