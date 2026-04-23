const userRepository = require("../repositories/userRepository");
const { unauthorized } = require("../utils/appError");
const { parseAuthHeader, verifyAccessToken } = require("../utils/tokenUtils");

async function authMiddleware(req, res, next) {
  try {
    const token = parseAuthHeader(req.headers.authorization);
    const payload = verifyAccessToken(token);
    const user = await userRepository.findUserById(payload.sub);

    if (!user) {
      throw unauthorized("Usuario nao encontrado");
    }

    if (payload.sessionId) {
      const currentSession = user.sessions.find(
        (session) => session.id === payload.sessionId
      );

      if (!currentSession || currentSession.revokedAt) {
        throw unauthorized("Sessao invalida ou encerrada");
      }
    }

    req.user = payload;
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = authMiddleware;
