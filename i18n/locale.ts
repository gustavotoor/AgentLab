/**
 * Server-side locale helpers. Reads/writes the locale cookie.
 */
import { cookies } from "next/headers";

const COOKIE_NAME = "NEXT_LOCALE";
const DEFAULT_LOCALE = "pt-BR";

/** Get the current user locale from cookies or fallback to default */
export async function getUserLocale(): Promise<string> {
  return (await cookies()).get(COOKIE_NAME)?.value || DEFAULT_LOCALE;
}

/** Set the user locale cookie */
export async function setUserLocale(locale: string): Promise<void> {
  (await cookies()).set(COOKIE_NAME, locale);
}
