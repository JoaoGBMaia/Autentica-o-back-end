const bcrypt = require("bcryptjs");

const userRepository = require("../repositories/userRepository");
const {
  buildAccessToken,
  createSessionToken,
  hashRefreshToken,
  isSessionExpired,
  verifyAccessToken
} = require("../utils/tokenUtils");
const {
  assertChangePasswordInput,
  assertLoginInput,
  assertProfileUpdateInput,
  assertRegisterInput
} = require("../utils/validators");
const { badRequest, conflict, notFound, unauthorized } = require("../utils/appError");

function sanitizeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    lastLoginAt: user.lastLoginAt
  };
}

async function createAuthResponse(user, metadata) {
  const refreshSession = createSessionToken(metadata);
  const activeSessions = user.sessions.filter(
    (session) => !session.revokedAt && !isSessionExpired(session.expiresAt)
  );

  const updatedUser = await userRepository.updateUser(user.id, {
    lastLoginAt: new Date().toISOString(),
    sessions: [...activeSessions, refreshSession.session]
  });

  return {
    message: metadata.message,
    accessToken: buildAccessToken(updatedUser, refreshSession.session.id),
    refreshToken: refreshSession.rawToken,
    user: sanitizeUser(updatedUser)
  };
}

async function register(payload, metadata) {
  const { name, email, password } = assertRegisterInput(payload);
  const existingUser = await userRepository.findUserByEmail(email);

  if (existingUser) {
    throw conflict("Email ja cadastrado");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await userRepository.createUser({
    name,
    email,
    passwordHash
  });

  return createAuthResponse(user, {
    ...metadata,
    message: "Usuario criado com sucesso"
  });
}

async function login(payload, metadata) {
  const { email, password } = assertLoginInput(payload);
  const user = await userRepository.findUserByEmail(email);

  if (!user) {
    throw unauthorized("Credenciais invalidas");
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);

  if (!passwordMatches) {
    throw unauthorized("Credenciais invalidas");
  }

  return createAuthResponse(user, {
    ...metadata,
    message: "Login realizado com sucesso"
  });
}

async function getCurrentUser(userId) {
  const user = await userRepository.findUserById(userId);

  if (!user) {
    throw notFound("Usuario nao encontrado");
  }

  return sanitizeUser(user);
}

async function refreshSession(refreshToken, metadata) {
  if (!refreshToken) {
    throw badRequest("refreshToken e obrigatorio");
  }

  const tokenHash = hashRefreshToken(refreshToken);
  const found = await userRepository.findUserByRefreshTokenHash(tokenHash);

  if (!found) {
    throw unauthorized("Refresh token invalido");
  }

  if (isSessionExpired(found.session.expiresAt)) {
    found.session.revokedAt = new Date().toISOString();
    await userRepository.replaceUser(found.user);
    throw unauthorized("Refresh token expirado");
  }

  found.session.revokedAt = new Date().toISOString();

  const refreshedSession = createSessionToken(metadata);
  const updatedSessions = found.user.sessions
    .filter((session) => !isSessionExpired(session.expiresAt))
    .map((session) =>
      session.id === found.session.id ? found.session : session
    );

  updatedSessions.push(refreshedSession.session);

  const updatedUser = await userRepository.updateUser(found.user.id, {
    sessions: updatedSessions
  });

  return {
    message: "Token renovado com sucesso",
    accessToken: buildAccessToken(updatedUser, refreshedSession.session.id),
    refreshToken: refreshedSession.rawToken,
    user: sanitizeUser(updatedUser)
  };
}

async function logout(refreshToken) {
  if (!refreshToken) {
    throw badRequest("refreshToken e obrigatorio");
  }

  const tokenHash = hashRefreshToken(refreshToken);
  const found = await userRepository.findUserByRefreshTokenHash(tokenHash);

  if (!found) {
    throw unauthorized("Refresh token invalido");
  }

  const updatedSessions = found.user.sessions.map((session) =>
    session.id === found.session.id
      ? { ...session, revokedAt: new Date().toISOString() }
      : session
  );

  await userRepository.updateUser(found.user.id, {
    sessions: updatedSessions
  });
}

async function logoutCurrentSession(userId, accessToken) {
  const payload = verifyAccessToken(accessToken);
  const user = await userRepository.findUserById(userId);

  if (!user) {
    throw notFound("Usuario nao encontrado");
  }

  if (!payload.sessionId) {
    throw unauthorized("Sessao atual nao identificada");
  }

  const updatedSessions = user.sessions.map((session) =>
    session.id === payload.sessionId
      ? { ...session, revokedAt: new Date().toISOString() }
      : session
  );

  await userRepository.updateUser(user.id, {
    sessions: updatedSessions
  });
}

async function updateProfile(userId, currentSessionId, payload) {
  const changes = assertProfileUpdateInput(payload);
  const user = await userRepository.findUserById(userId);

  if (!user) {
    throw notFound("Usuario nao encontrado");
  }

  if (changes.email && changes.email !== user.email) {
    const existingUser = await userRepository.findUserByEmail(changes.email);

    if (existingUser && existingUser.id !== user.id) {
      throw conflict("Email ja cadastrado");
    }
  }

  const updatedUser = await userRepository.updateUser(user.id, {
    ...changes
  });

  return {
    message: "Perfil atualizado com sucesso",
    user: sanitizeUser(updatedUser),
    accessToken: buildAccessToken(updatedUser, currentSessionId)
  };
}

async function changePassword(userId, payload) {
  const { currentPassword, newPassword } = assertChangePasswordInput(payload);
  const user = await userRepository.findUserById(userId);

  if (!user) {
    throw notFound("Usuario nao encontrado");
  }

  const passwordMatches = await bcrypt.compare(currentPassword, user.passwordHash);

  if (!passwordMatches) {
    throw unauthorized("Senha atual incorreta");
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  const revokedSessions = user.sessions.map((session) => ({
    ...session,
    revokedAt: session.revokedAt || new Date().toISOString()
  }));

  await userRepository.updateUser(user.id, {
    passwordHash,
    sessions: revokedSessions
  });
}

async function listSessions(userId) {
  const user = await userRepository.findUserById(userId);

  if (!user) {
    throw notFound("Usuario nao encontrado");
  }

  return user.sessions
    .filter((session) => !isSessionExpired(session.expiresAt))
    .map((session) => ({
      id: session.id,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      revokedAt: session.revokedAt,
      ip: session.ip,
      userAgent: session.userAgent
    }));
}

async function revokeSession(userId, sessionId) {
  const user = await userRepository.findUserById(userId);

  if (!user) {
    throw notFound("Usuario nao encontrado");
  }

  const sessionExists = user.sessions.some((session) => session.id === sessionId);

  if (!sessionExists) {
    throw notFound("Sessao nao encontrada");
  }

  const updatedSessions = user.sessions.map((session) =>
    session.id === sessionId
      ? { ...session, revokedAt: session.revokedAt || new Date().toISOString() }
      : session
  );

  await userRepository.updateUser(user.id, {
    sessions: updatedSessions
  });
}

module.exports = {
  changePassword,
  getCurrentUser,
  login,
  logout,
  logoutCurrentSession,
  listSessions,
  refreshSession,
  revokeSession,
  register,
  updateProfile
};
