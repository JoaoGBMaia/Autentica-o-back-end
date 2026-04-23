const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const env = require("../config/env");
const { unauthorized } = require("./appError");

function buildAccessToken(user, sessionId) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      name: user.name,
      sessionId: sessionId || null
    },
    env.jwtSecret,
    {
      expiresIn: env.accessTokenExpiresIn
    }
  );
}

function hashRefreshToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function createSessionToken(metadata = {}) {
  const rawToken = crypto.randomBytes(48).toString("hex");
  const now = new Date();
  const expiresAt = new Date(
    now.getTime() + env.refreshTokenTtlDays * 24 * 60 * 60 * 1000
  );
  const sessionId = crypto.randomUUID();

  return {
    rawToken,
    session: {
      id: sessionId,
      tokenHash: hashRefreshToken(rawToken),
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      revokedAt: null,
      ip: metadata.ip || null,
      userAgent: metadata.userAgent || null
    }
  };
}

function isSessionExpired(expiresAt) {
  return new Date(expiresAt).getTime() <= Date.now();
}

function parseAuthHeader(authHeader) {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw unauthorized("Token nao informado");
  }

  return authHeader.split(" ")[1];
}

function verifyAccessToken(token) {
  try {
    return jwt.verify(token, env.jwtSecret);
  } catch (error) {
    throw unauthorized("Token invalido ou expirado");
  }
}

module.exports = {
  buildAccessToken,
  createSessionToken,
  hashRefreshToken,
  isSessionExpired,
  parseAuthHeader,
  verifyAccessToken
};
