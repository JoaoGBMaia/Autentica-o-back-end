require("dotenv").config();

const app = require("./app");
const env = require("./config/env");

const server = app.listen(env.port, () => {
  console.log(`Servidor rodando em http://localhost:${env.port}`);
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(
      `A porta ${env.port} ja esta em uso. Feche o processo anterior ou troque a PORT no arquivo .env.`
    );
    return;
  }

  console.error("Falha ao iniciar o servidor:", error);
});
