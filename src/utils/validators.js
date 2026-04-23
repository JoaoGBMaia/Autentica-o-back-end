const { badRequest } = require("./appError");

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function assertEmail(email) {
  const normalizedEmail = normalizeEmail(email);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(normalizedEmail)) {
    throw badRequest("Informe um email valido");
  }

  return normalizedEmail;
}

function assertPassword(password, fieldName = "password") {
  const value = String(password || "").trim();

  if (value.length < 6) {
    throw badRequest(`O campo ${fieldName} deve ter pelo menos 6 caracteres`);
  }

  return value;
}

function assertRegisterInput(payload = {}) {
  const name = String(payload.name || "").trim();

  if (name.length < 2) {
    throw badRequest("O campo name deve ter pelo menos 2 caracteres");
  }

  return {
    name,
    email: assertEmail(payload.email),
    password: assertPassword(payload.password)
  };
}

function assertLoginInput(payload = {}) {
  return {
    email: assertEmail(payload.email),
    password: String(payload.password || "")
  };
}

function assertProfileUpdateInput(payload = {}) {
  const changes = {};

  if (payload.name !== undefined) {
    const name = String(payload.name || "").trim();

    if (name.length < 2) {
      throw badRequest("O campo name deve ter pelo menos 2 caracteres");
    }

    changes.name = name;
  }

  if (payload.email !== undefined) {
    changes.email = assertEmail(payload.email);
  }

  if (!Object.keys(changes).length) {
    throw badRequest("Informe ao menos um campo para atualizar");
  }

  return changes;
}

function assertChangePasswordInput(payload = {}) {
  const currentPassword = String(payload.currentPassword || "");
  const newPassword = assertPassword(payload.newPassword, "newPassword");

  if (!currentPassword) {
    throw badRequest("currentPassword e obrigatorio");
  }

  if (currentPassword === newPassword) {
    throw badRequest("A nova senha deve ser diferente da senha atual");
  }

  return {
    currentPassword,
    newPassword
  };
}

module.exports = {
  assertChangePasswordInput,
  assertEmail,
  assertLoginInput,
  assertPassword,
  assertProfileUpdateInput,
  assertRegisterInput
};
