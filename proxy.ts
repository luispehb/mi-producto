import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PROTECTED = ["/planes", "/explorar", "/ciudad-actual", "/admin"];
const AUTH_PAGES = ["/login", "/registro", "/olvide"];

const matches = (path: string, prefixes: string[]) => prefixes.some(p => path === p || path.startsWith(p + "/"));

// Renueva la sesión de Supabase (cookies) en cada request y hace el chequeo
// optimista de rutas. Cada página y ruta de API vuelve a validar la sesión.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(toSet, headers) {
          toSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
          Object.entries(headers ?? {}).forEach(([k, v]) => response.headers.set(k, v));
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;

  // Las redirecciones copian las cookies renovadas
  const redirectTo = (url: URL) => {
    const res = NextResponse.redirect(url);
    response.cookies.getAll().forEach(c => res.cookies.set(c));
    return res;
  };

  if (!user && matches(path, PROTECTED)) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", path + request.nextUrl.search);
    return redirectTo(url);
  }
  if (user && matches(path, AUTH_PAGES)) {
    return redirectTo(new URL("/planes", request.url));
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\.[a-zA-Z0-9]+$).*)"],
};
