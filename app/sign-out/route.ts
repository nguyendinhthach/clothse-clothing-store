import { signOut } from "@/lib/auth";
import { routes } from "@/lib/routes";

/** The header's Sign Out button posts here (SiteHeader). */
export async function POST() {
  await signOut({ redirectTo: routes.home });
}
