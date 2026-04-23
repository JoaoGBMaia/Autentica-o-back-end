const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");

const dataDir = path.resolve(
  process.env.DATA_DIR || process.env.RAILWAY_VOLUME_MOUNT_PATH || path.join(process.cwd(), "data")
);
const usersFile = path.join(dataDir, "users.json");

async function ensureUsersFile() {
  await fs.mkdir(dataDir, { recursive: true });

  try {
    await fs.access(usersFile);
  } catch (error) {
    await fs.writeFile(usersFile, "[]", "utf-8");
  }
}

function normalizeUser(user) {
  return {
    ...user,
    sessions: Array.isArray(user.sessions) ? user.sessions : [],
    updatedAt: user.updatedAt || user.createdAt || new Date().toISOString()
  };
}

async function readUsers() {
  await ensureUsersFile();
  const raw = await fs.readFile(usersFile, "utf-8");
  const parsed = JSON.parse(raw);

  return parsed.map(normalizeUser);
}

async function writeUsers(users) {
  await fs.writeFile(usersFile, JSON.stringify(users, null, 2), "utf-8");
}

async function findAllUsers() {
  return readUsers();
}

async function findUserById(userId) {
  const users = await readUsers();
  return users.find((user) => user.id === userId) || null;
}

async function findUserByEmail(email) {
  const users = await readUsers();
  return users.find((user) => user.email === email) || null;
}

async function findUserByRefreshTokenHash(tokenHash) {
  const users = await readUsers();

  for (const user of users) {
    const session = user.sessions.find(
      (currentSession) =>
        currentSession.tokenHash === tokenHash && !currentSession.revokedAt
    );

    if (session) {
      return { user, session };
    }
  }

  return null;
}

async function createUser({ name, email, passwordHash }) {
  const users = await readUsers();
  const now = new Date().toISOString();

  const user = {
    id: crypto.randomUUID(),
    name,
    email,
    passwordHash,
    sessions: [],
    createdAt: now,
    updatedAt: now,
    lastLoginAt: null
  };

  users.push(user);
  await writeUsers(users);

  return user;
}

async function updateUser(userId, changes) {
  const users = await readUsers();
  const userIndex = users.findIndex((user) => user.id === userId);

  if (userIndex === -1) {
    return null;
  }

  const updatedUser = normalizeUser({
    ...users[userIndex],
    ...changes,
    updatedAt: new Date().toISOString()
  });

  users[userIndex] = updatedUser;
  await writeUsers(users);

  return updatedUser;
}

async function replaceUser(updatedUser) {
  const users = await readUsers();
  const userIndex = users.findIndex((user) => user.id === updatedUser.id);

  if (userIndex === -1) {
    return null;
  }

  users[userIndex] = normalizeUser({
    ...updatedUser,
    updatedAt: new Date().toISOString()
  });

  await writeUsers(users);
  return users[userIndex];
}

module.exports = {
  createUser,
  findAllUsers,
  findUserByEmail,
  findUserById,
  findUserByRefreshTokenHash,
  replaceUser,
  updateUser
};
