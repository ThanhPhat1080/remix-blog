// import { Partytown } from "@builder.io/partytown/react";
import type { LinksFunction, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Link, Links, Meta, NavLink, Outlet, Scripts, ScrollRestoration, useMatches } from '@remix-run/react';

import tailwindStylesheetUrl from './styles/tailwind.css';
import globalStyles from './styles/globals.css';
import { getUser } from './server/session.server';
import ROUTERS from './constants/routers';

export const links: LinksFunction = () => {
  return [
    { rel: 'stylesheet', href: tailwindStylesheetUrl },
    { rel: 'stylesheet', href: globalStyles },
  ];
};

export const meta: MetaFunction = ({ location }) => [
  {
    charset: 'utf-8',
    title: 'Personal technical blog',
    description: 'Personal technical blog - Let share and learn together',
    viewport: 'width=device-width,initial-scale=1',
    keywords: 'Remix blog, Robot ,Remix indie',
    'og:type': 'website',
    'og:url': location.toString(),

    'twitter:card': 'summary_large_image',
    'twitter:creator': '@phat_truong',
    'twitter:site': '@phat_truong',
    'twitter:description': 'Personal technical blog - Let share and learn together',
    'twitter:image':
      'https://res.cloudinary.com/diveoh2pp/image/upload/v1670398746/Screenshot_120722_023903_PM_j2w20w.jpg',
    'twitter:title': 'Personal technical blog',
    'og:image:width': '1200',
    'og:image:height': '630',
  },
];

export async function loader({ request }: LoaderFunctionArgs) {
  return json({
    user: await getUser(request),
  });
}

export default function App() {
  const matches = useMatches();

  // If at least one route wants to hydrate, this will return true
  const includeScripts = matches.some(match => match.handle?.hydrate);

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />
        {/* <Partytown
          debug={process.env.NODE_ENV === "development"}
          forward={["dataLayer.push"]}
        /> */}

        {/* Google tag (gtag.js) */}
        {/* <script
          type="text/partytown"
          src="https://www.googletagmanager.com/gtag/js?id=G-6JM5FWM0XG"
        />
        <script
          type="text/partytown"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-6JM5FWM0XG');
            `,
          }}
        /> */}
      </head>
      <body className="relative h-full bg-slate-800">
        <main className="relative">
          <Outlet />
        </main>
        <ScrollRestoration />
        {/* include the scripts, or not! */}
        {includeScripts ? <Scripts /> : null}
      </body>
    </html>
  );
}
