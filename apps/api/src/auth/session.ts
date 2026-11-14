import { randomUUID } from "node:crypto";
import { Router, type RequestHandler } from "express";
import { rateLimit } from "express-rate-limit";
import { SignJWT, createRemoteJWKSet, decodeProtectedHeader, jwtVerify, type JWTVerifyGetKey } from "jose";

export type Visitor = { sub: string; kind: "anon" | "auth0"; permissions: string[] };
declare global { namespace Express { interface Request { visitor?: Visitor } } }

const TTL_SECONDS = 24 * 60 * 60;
// Env is read per request so tests can set it after import.
const sessionKey = () => new TextEncoder().encode(process.env.SESSION_SECRET);

/** The anonymous session check: a valid, unexpired HS256 token signed with SESSION_SECRET whose sub starts with `anon:`. */
export async function verifyAnon(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, sessionKey(), { algorithms: ["HS256"] });
    return typeof payload.sub === "string" && payload.sub.startsWith("anon:") ? payload.sub : null;
  } catch {
    return null;
  }
}

async function verify(token: string, getAuth0Key: JWTVerifyGetKey): Promise<Visitor> {
  const { alg } = decodeProtectedHeader(token);
  if (alg === "HS256") {
    const sub = await verifyAnon(token);
    if (!sub) throw new Error("invalid anonymous token");
    return { sub, kind: "anon", permissions: [] };
  }
  const domain = process.env.AUTH0_DOMAIN;
  if (alg === "RS256" && domain) {
    const { payload } = await jwtVerify(token, getAuth0Key, {
      algorithms: ["RS256"],
      issuer: `https://${domain}/`,
      audience: process.env.AUTH0_AUDIENCE,
    });
    if (typeof payload.sub !== "string") throw new Error("no sub");
    const permissions = Array.isArray(payload.permissions) ? (payload.permissions as string[]) : [];
    return { sub: payload.sub, kind: "auth0", permissions };
  }
  throw new Error("unsupported alg");
}

export function makeRequireVisitor(getAuth0Key: JWTVerifyGetKey): RequestHandler {
  return async (req, res, next) => {
    const token = req.headers.authorization?.match(/^Bearer (\S+)$/)?.[1];
    try {
      if (!token) throw new Error("no token");
      req.visitor = await verify(token, getAuth0Key);
    } catch {
      res.status(401).json({ error: "unauthorized" });
      return;
    }
    next();
  };
}

let auth0Jwks: JWTVerifyGetKey | undefined;
const remoteAuth0Key: JWTVerifyGetKey = (header, token) =>
  (auth0Jwks ??= createRemoteJWKSet(new URL(`https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`)))(header, token);

export const requireVisitor: RequestHandler = makeRequireVisitor(remoteAuth0Key);

// shortcut: memory store, counts reset on restart and are per instance; move to a shared store if the API runs on more than one instance
export const visitorLimiter: RequestHandler = rateLimit({
  windowMs: 60_000,
  limit: 120,
  keyGenerator: (req) => req.visitor!.sub,
});

// shortcut: memory store, counts reset on restart and are per instance; move to a shared store if the API runs on more than one instance
// 120, not 10: a room on one Wi-Fi shares one IP, and every phone needs a token in the same minute.
const anonLimiter = rateLimit({ windowMs: 60_000, limit: 120 });

export const sessionRouter: Router = Router();

sessionRouter.post("/session/anon", anonLimiter, async (_req, res) => {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + TTL_SECONDS;
  const token = await new SignJWT()
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(`anon:${randomUUID()}`)
    .setIssuedAt(iat)
    .setExpirationTime(exp)
    .sign(sessionKey());
  res.json({ token, expiresAt: new Date(exp * 1000).toISOString() });
});
