import { json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import invariant from 'tiny-invariant';

import { getPostBySlug, getPublishPosts } from '~/model/post.server';
import type { Post } from 'prisma/prisma-client';
import { PostArticleContent, links as PostArticleContentLinks } from '~/components/PostArticleContent';
import { PostArticle } from '~/components';

import type { LinksFunction, LoaderFunctionArgs } from '@remix-run/node';
import { capitalizeFirstLetter, convertUrlSlug, isEmptyOrNotExist } from '~/utils';
import { useEffect, useRef } from 'react';

export const links: LinksFunction = () => {
  return [...PostArticleContentLinks()];
};
export const handle = { hydrate: true };

export const meta = ({ data, location }) => {
  if (!data) {
    return [
      {
        title: 'Not found - Personal technical blog',
        description: 'Not found - Personal technical blog',
      },
    ];
  }

  const title = data.post?.title || 'Personal technical blog';
  const description = data.post?.preface || '';
  const author = data.post?.user?.name || '';
  const avatar = data.post?.user?.avatar || '';
  const titleInOG = capitalizeFirstLetter(convertUrlSlug(title, '+'));
  const authorInOG = convertUrlSlug(author, '+').split('+').map(capitalizeFirstLetter).join('+');
  const avatarInOG = `https://res.cloudinary.com/diveoh2pp/b_rgb:00000000,c_fill,w_50,g_center,q_80,f_auto/${avatar}`;

  const OGImage = `https://vercel-og-nextjs-indol-iota.vercel.app/api/param?title=${titleInOG}&author=${authorInOG}&avatar=${avatarInOG}`;

  return [
    {
      title,
      description: description || title || '',
      keywords: 'technical blog,Remix indie,' + title,

      'twitter:title': title,
      'twitter:description': description,
      'twitter:image': OGImage,

      'og:url': location,
      'og:title': title,
      'og:description': description,
      'og:image': OGImage,
      'og:image:url': OGImage,
      'og:image:type': 'png/jpg/jpeg',
      'og:image:alt': title,
      'og:image:width': '1200',
      'og:image:height': '630',
    },
  ];
};

export const loader = async ({ params }: LoaderFunctionArgs) => {
  invariant(params.slug, 'Post not found');

  const post = (await getPostBySlug(params.slug)) as Post;
  const listPostsRelative = await getPublishPosts({
    NOT: { slug: params.slug },
  });

  if (!post) {
    return json({
      error: 'Post not found',
      status: 404,
      post: null,
      listPostsRelative,
    });
  }

  return json({
    error: '',
    status: 200,
    post: post as Post,
    listPostsRelative,
  });
};

export default function PostArticleContentDetail() {
  const data = useLoaderData<typeof loader>();

  const postArticleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let sections: NodeListOf<HTMLHeadingElement>;

    if (
      !isEmptyOrNotExist(postArticleRef?.current) &&
      typeof postArticleRef.current['querySelectorAll'] === 'function'
    ) {
      sections = postArticleRef.current?.querySelectorAll('article h2[id]');

      window.addEventListener('scroll', navHighlighter);
    }

    function navHighlighter() {
      // Get current scroll position
      const scrollY = window.pageYOffset;

      // Now we loop through sections to get height, top and ID values for each
      sections.forEach(current => {
        const sectionHeight = current.offsetHeight;
        const sectionTop = current.offsetTop - 50;
        const sectionId = current.getAttribute('id');

        /*
        - If our current scroll position enters the space where current section on screen is, add .active class to corresponding navigation link, else remove it
        - To know which link needs an active class, we use sectionId variable we are getting while looping through sections as an selector
        */
        if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
          document?.querySelector(`#nav-highlight a[href*=${sectionId}]`)?.classList.add('active');
        } else {
          document?.querySelector(`#nav-highlight a[href*=${sectionId}]`)?.classList.remove('active');
        }
      });
    }
  }, [postArticleRef]);

  return (
    <>
      <div className="2xlg:max-w-7xl relative mx-auto w-full px-4 md:max-w-3xl lg:max-w-5xl">
        <div className="relative pt-10 lg:pt-28 flex">
          <div ref={postArticleRef} className="mx-auto mb-5 flex w-full max-w-2xl flex-col sm:max-w-2xl md:max-w-3xl">
            {data.post ? (
              <section className="pb-8">
                <PostArticleContent
                  {...data.post}
                  author={data.post.user}
                  createdAt={new Date(data.post.createdAt)}
                  updatedAt={new Date(data.post.updatedAt)}
                />
              </section>
            ) : (
              <p className="dark:text-gray-400">{data.error}</p>
            )}
          </div>
          <aside id="nav-highlight" className="fixed left-2 bottom-[30px] flex max-w-[200px] flex-col">
            <ul>
              <li>
                <a className='text-blue-400' href="#react-view-action-state">React View, action và state</a>
              </li>
              <li>
                <a className='text-blue-400' href="#react-state-on-server">Vậy nếu "state" nằm ở phía Server thì sẽ như thế nào</a>
              </li>
              <li>
                <a className='text-blue-400' href="#remix-data-flow">Remix data flow</a>
              </li>
              <li>
                <a className='text-blue-400' href="#remix-in-action">Remix in action</a>
              </li>
              <li>
                <a href="#state-management">Vậy còn state management thì sao</a>
              </li>
            </ul>
          </aside>
          {/* RELATIVE POSTS SECTION */}
        </div>
        <div className="relative pt-20">
          <div className="rotate-flip-Y absolute -top-1 left-0 w-full overflow-hidden">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
              <path
                d="M985.66,92.83C906.67,72,823.78,31,743.84,14.19c-82.26-17.34-168.06-16.33-250.45.39-57.84,11.73-114,31.07-172,41.86A600.21,600.21,0,0,1,0,27.35V120H1200V95.8C1132.19,118.92,1055.71,111.31,985.66,92.83Z"
                className="fill-white dark:fill-slate-800"></path>
            </svg>
          </div>

          <section className="xlg:w-1/2 mx-auto mb-40 flex w-full flex-col px-5 lg:w-3/4 lg:px-0">
            <strong className="relative z-10 my-16 pt-20 text-center text-4xl font-semibold uppercase dark:text-gray-200 ">
              Relative posts
            </strong>
            <div className="relative mx-auto flex w-full flex-col px-5 pb-5 md:w-4/5 md:px-0 lg:max-w-2xl 2xl:max-w-3xl">
              {data.listPostsRelative.map((post, index) => (
                <div className="my-5" key={post.id}>
                  <PostArticle
                    {...post}
                    author={post.user}
                    createdAt={new Date(post.createdAt)}
                    updatedAt={new Date(post.updatedAt)}
                  />
                  {index < data.listPostsRelative.length - 1 && <hr className="line-wavy" />}
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
      <script>
    {window.addEventListener('DOMContentLoaded', ()=>{

        const observer = new IntersectionObserver(entries=>{
            entries.forEach(entry=>{
                const id = entry.target.getAttribute('id');
                console.log(entry.intersectionRatio);
                if (entry.intersectionRatio > 0) {
                    console.log(document.querySelector('#nav-highlight li a[href*="' + id + '"]').classList);

                    document.querySelector('#nav-highlight li a[href*="' + id + '"]').classList.add('active');
                } else {
                    document.querySelector('#nav-highlight li a[href*="' + id + '"]').classList.remove('active');
                }
            }
            );
        }
        );

        document.querySelectorAll('section[id]').forEach((section)=>{
            observer.observe(section);
        }
        );

    }
    );}
</script>
      <script
        dangerouslySetInnerHTML={{
          __html: `
            window.addEventListener('DOMContentLoaded', () => {

              const observer = new IntersectionObserver(entries => {
                entries.forEach(entry => {
                  const id = entry.target.getAttribute('id');
                  console.log(entry.intersectionRatio);
                  if (entry.intersectionRatio > 0) {
                  console.log(document.querySelector('#nav-highlight li a[href*="'+ id +'"]').classList);

                    document.querySelector('#nav-highlight li a[href*="'+ id +'"]').classList.add('active');
                  } else {
                    document.querySelector('#nav-highlight li a[href*="'+ id +'"]').classList.remove('active');
                  }
                });
              });
          
              document.querySelectorAll('section[id]').forEach((section) => {
                observer.observe(section);
              });
            
          });

          `
        }}
      />
    </>
  );
}
