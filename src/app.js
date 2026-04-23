const express = require("express");
const cors = require("cors");
const path = require("path");

const errorHandler = require("./middleware/errorHandler");
const notFoundHandler = require("./middleware/notFoundHandler");
const authRoutes = require("./routes/authRoutes");

const app = express();
const publicDir = path.join(process.cwd(), "public");

app.use(cors());
app.use(express.json());
app.use(express.static(publicDir));

app.get("/api", (req, res) => {
  res.json({
    message: "API de autenticacao no ar",
    endpoints: {
      health: "GET /health",
      register: "POST /auth/register",
      login: "POST /auth/login",
      refresh: "POST /auth/refresh",
      logout: "POST /auth/logout",
      me: "GET /auth/me",
      sessions: "GET /auth/sessions",
      revokeSession: "DELETE /auth/sessions/:sessionId",
      updateProfile: "PATCH /auth/me",
      changePassword: "POST /auth/change-password"
    }
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/auth", authRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
