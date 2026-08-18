import { Session } from "@contracts/constants";

export type SessionCookieOptions = {
  httpOnly: boolean;
  secure: boolean;
  sameSite: string;
  path: string;
  maxAge: number;
};

/**
 * Returns cookie options appropriate for the current request.
 * In development (http://localhost) secure is disabled so the cookie works over http.
 */
export function getSessionCookieOptions(headers?: Headers): SessionCookieOptions {
  const forwardedProto = headers?.get("x-forwarded-proto") ?? "http";
  const secure = forwardedProto === "https" && process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: Session.maxAgeMs / 1000,
  };
}

export function readSessionCookie(headers: Headers): string | null {
  const cookieHeader = headers.get("cookie");
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === Session.cookieName) {
      return rest.join("=") || null;
    }
  }
  return null;
}