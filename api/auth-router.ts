import * as cookie from "cookie";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { Session } from "@contracts/constants";
import { getSessionCookieOptions, readSessionCookie } from "./lib/cookies";
import { signSession, hashPassword, authenticateCredentials, verifySession } from "./lib/auth";
import { createRouter, publicQuery, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { users } from "@db/schema";

function setSessionCookie(
  resHeaders: Headers,
  token: string,
  headers: Headers,
  maxAge?: number,
) {
  const opts = getSessionCookieOptions(headers);
  resHeaders.append(
    "set-cookie",
    cookie.serialize(Session.cookieName, token, {
      httpOnly: opts.httpOnly,
      path: opts.path,
      sameSite: opts.sameSite?.toLowerCase() as "lax" | "none",
      secure: opts.secure,
      maxAge: maxAge ?? opts.maxAge,
    }),
  );
}

const registerInput = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

const loginInput = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const authRouter = createRouter({
  register: publicQuery
    .input(registerInput)
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const email = input.email.toLowerCase().trim();
      const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (existing.length > 0) {
        throw new Error("An account with this email already exists.");
      }
      const passwordHash = await hashPassword(input.password);
      const [user] = await db
        .insert(users)
        .values({ name: input.name, email, passwordHash, role: "customer" })
        .returning();
      const token = await signSession(user);
      setSessionCookie(ctx.resHeaders, token, ctx.req.headers);
      return { user };
    }),

  login: publicQuery
    .input(loginInput)
    .mutation(async ({ ctx, input }) => {
      const user = await authenticateCredentials(input.email, input.password);
      if (!user) {
        throw new Error("Invalid email or password.");
      }
      const token = await signSession(user);
      setSessionCookie(ctx.resHeaders, token, ctx.req.headers);
      return { user };
    }),

  me: authedQuery.query((opts) => opts.ctx.user),

  logout: authedQuery.mutation(async ({ ctx }) => {
    const opts = getSessionCookieOptions(ctx.req.headers);
    ctx.resHeaders.append(
      "set-cookie",
      cookie.serialize(Session.cookieName, "", {
        httpOnly: opts.httpOnly,
        path: opts.path,
        sameSite: opts.sameSite?.toLowerCase() as "lax" | "none",
        secure: opts.secure,
        maxAge: 0,
      }),
    );
    return { success: true };
  }),
});