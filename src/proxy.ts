import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // manifest.webmanifest and sw.js must stay reachable unauthenticated --
    // the browser evaluates PWA installability (and registers the service
    // worker) independent of whether anyone's logged in, and neither
    // response is valid JSON/JS once redirected to the login HTML page.
    "/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|webmanifest)$).*)",
  ],
};
