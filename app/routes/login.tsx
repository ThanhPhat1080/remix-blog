import * as React from 'react';
import type { ActionFunctionArgs, LoaderFunctionArgs, LinksFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';

import { Form, useActionData, useSearchParams, useNavigation } from '@remix-run/react';

import { createUserSession, getUserId } from '~/server/session.server';
import { verifyLogin } from '~/model/user.server';
import { isEmptyOrNotExist, safeRedirect, validateEmail } from '~/utils';

import ROUTERS from '~/constants/routers';
import { AuthFormLayout, links as AuthFormLayoutLink } from '~/layouts/AuthFormLayout';

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await getUserId(request);
  if (userId) {
    return redirect(ROUTERS.ROOT);
  }

  return json({});
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = formData.get('email');
  const password = formData.get('password');

  const redirectTo = safeRedirect(formData.get('redirectTo'), `${ROUTERS.DASHBOARD}/profile`);

  if (!validateEmail(email)) {
    return json({ errors: { email: 'Email is invalid', password: null } }, { status: 400 });
  }

  if (typeof password !== 'string' || password.length === 0) {
    return json({ errors: { email: null, password: 'Password is required' } }, { status: 400 });
  }

  if (password.length < 8) {
    return json({ errors: { email: null, password: 'Password is too short' } }, { status: 400 });
  }

  const user = await verifyLogin(email, password);

  if (!user) {
    return json({ errors: { email: 'Invalid email or password', password: null } }, { status: 400 });
  }

  return createUserSession({
    request,
    userId: user.id,
    remember: true,
    redirectTo,
  });
}

export const meta = () => {
  return [
    {
      title: 'Login!',
    },
  ];
};

export const links: LinksFunction = () => {
  return [...AuthFormLayoutLink()];
};

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const navigation = useNavigation();

  const redirectTo = searchParams.get('redirectTo') || `${ROUTERS.DASHBOARD}/profile`;
  const actionData = useActionData<typeof action>();
  const emailRef = React.useRef<HTMLInputElement>(null);
  const passwordRef = React.useRef<HTMLInputElement>(null);

  const isEmailError = !isEmptyOrNotExist(actionData?.errors.email);
  const isPasswordError = !isEmptyOrNotExist(actionData?.errors.password);
  const isFormSubmitting = navigation.state === 'submitting';

  React.useEffect(() => {
    if (isEmailError) {
      emailRef.current?.focus();
    }
    if (isPasswordError) {
      passwordRef.current?.focus();
    }
  });

  return (
    <AuthFormLayout formName="login">
      <Form method="post" className="space-y-6 text-white" aria-describedby="Login form" aria-details="Login form">
        <div>
          <label htmlFor="email" className="block">
            Email address
          </label>
          <div className="mt-1">
            <input
              ref={emailRef}
              id="email"
              required
              autoFocus={true}
              name="email"
              type="email"
              autoComplete="email"
              aria-invalid={isEmailError ? true : undefined}
              aria-describedby="email-error"
              className="w-full rounded border bg-white px-2 py-1 text-slate-600 dark:border-gray-200 dark:bg-slate-800 dark:text-white"
            />
            {isEmailError && (
              <div className="pt-1 text-red-400" id="email-error">
                {actionData?.errors.email}
              </div>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="password" className="block">
            Password
          </label>
          <div className="mt-1">
            <input
              id="password"
              ref={passwordRef}
              name="password"
              type="password"
              autoComplete="current-password"
              aria-invalid={isPasswordError ? true : undefined}
              aria-describedby="password-error"
              className="w-full rounded border bg-white px-2 py-1 text-slate-600 dark:border-gray-200 dark:bg-slate-800 dark:text-white"
            />
            {isPasswordError && (
              <div className="pt-1 text-red-400" id="password-error">
                {actionData?.errors.password}
              </div>
            )}
          </div>
        </div>

        <input type="hidden" name="redirectTo" value={redirectTo} />
        <button
          type="submit"
          disabled={isFormSubmitting}
          aria-disabled={isFormSubmitting}
          className="inline-flex w-full items-center justify-center rounded bg-sky-700 px-4 py-2 font-bold text-white hover:bg-sky-600 focus:bg-sky-400">
          {isFormSubmitting ? 'Logging in' : 'Log in'}
        </button>
        <div className="flex items-center justify-between">
          <label htmlFor="remember" className="hidden cursor-pointer items-center">
            <input
              id="remember"
              name="remember"
              type="checkbox"
              disabled={isFormSubmitting}
              className="mr-2 h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
            />
            Remember me
          </label>
        </div>
      </Form>
    </AuthFormLayout>
  );
}
