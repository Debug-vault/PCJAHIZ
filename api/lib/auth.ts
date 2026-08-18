import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { Session } from "@contracts/constants";
import { readSessionCookie } from "./cookies";
import { env } from "./env";
import { getDb } from "../queries/connection";
import { users, type User } from "@db/schema";
import { eq } from "drizzle-orm";

const secret = new TextEncoder().encode(env.authSecret);

export type SessionPayload = {
  sub: string;
  role: string;
};

export async function signSession(user: Pick<User, "id" | "role">): Promise<string> {
  return new SignJWT({ role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime("365d")
    .sign(secret);
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ["HS256"],
    });
    if (!payload.sub) return null;
    return { sub: payload.sub, role: String(payload.role ?? "customer") };
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Resolves the authenticated user from the request's session cookie, or null.
 */
export async function authenticateRequest(headers: Headers): Promise<User | null> {
  const token = readSessionCookie(headers);
  if (!token) return null;

  const payload = await verifySession(token);
  if (!payload) return null;

  const [user] = await getDb()
    .select()
    .from(users)
    .where(eq(users.id, payload.sub))
    .limit(1);
  return user ?? null;
}

export async function authenticateCredentials(
  email: string,
  password: string,
): Promise<User | null> {
  const [user] = await getDb()
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase().trim()))
    .limit(1);
  if (!user) return null;
  if (!(await verifyPassword(password, user.passwordHash))) return null;
  return user;
}

export { Session, env };