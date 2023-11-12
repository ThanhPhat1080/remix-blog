import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";

import { logout } from "~/server/session.server";

export async function action({ request }: LoaderFunctionArgs) {
  return logout(request);
}

export async function loader() {
  return redirect("/");
}
