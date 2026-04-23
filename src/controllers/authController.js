const authService = require("../services/authService");
const { parseAuthHeader } = require("../utils/tokenUtils");

async function register(req, res, next) {
  try {
    const result = await authService.register(req.body, {
      ip: req.ip,
      userAgent: req.get("user-agent")
    });

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const result = await authService.login(req.body, {
      ip: req.ip,
      userAgent: req.get("user-agent")
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
}

async function me(req, res, next) {
  try {
    const user = await authService.getCurrentUser(req.user.sub);
    res.json({ user });
  } catch (error) {
    next(error);
  }
}

async function refresh(req, res, next) {
  try {
    const result = await authService.refreshSession(req.body.refreshToken, {
      ip: req.ip,
      userAgent: req.get("user-agent")
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
}

async function logout(req, res, next) {
  try {
    await authService.logout(req.body.refreshToken);
    res.json({ message: "Logout realizado com sucesso" });
  } catch (error) {
    next(error);
  }
}

async function logoutCurrentSession(req, res, next) {
  try {
    const accessToken = parseAuthHeader(req.headers.authorization);
    await authService.logoutCurrentSession(req.user.sub, accessToken);

    res.json({ message: "Sessao atual encerrada com sucesso" });
  } catch (error) {
    next(error);
  }
}

async function updateProfile(req, res, next) {
  try {
    const result = await authService.updateProfile(
      req.user.sub,
      req.user.sessionId,
      req.body
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
}

async function changePassword(req, res, next) {
  try {
    await authService.changePassword(req.user.sub, req.body);
    res.json({
      message: "Senha alterada com sucesso. Faça login novamente."
    });
  } catch (error) {
    next(error);
  }
}

async function listSessions(req, res, next) {
  try {
    const sessions = await authService.listSessions(req.user.sub);
    res.json({ sessions });
  } catch (error) {
    next(error);
  }
}

async function revokeSession(req, res, next) {
  try {
    await authService.revokeSession(req.user.sub, req.params.sessionId);
    res.json({ message: "Sessao encerrada com sucesso" });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  changePassword,
  login,
  logout,
  logoutCurrentSession,
  listSessions,
  me,
  refresh,
  revokeSession,
  register,
  updateProfile
};
