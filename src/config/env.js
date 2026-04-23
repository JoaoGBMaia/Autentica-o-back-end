const requiredEnvVars = ["JWT_SECRET"];

function getEnv() {
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Defina ${envVar} no arquivo .env antes de iniciar a API.`);
    }
  }

  return {
    port: Number(process.env.PORT || 3000),
    jwtSecret: process.env.JWT_SECRET,
    accessTokenExpiresIn: process.env.JWT_EXPIRES_IN || "15m",
    refreshTokenTtlDays: Number(process.env.REFRESH_TOKEN_TTL_DAYS || 7)
  };
}

module.exports = getEnv();
