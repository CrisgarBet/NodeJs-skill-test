"use strict";

const mongoose = require("mongoose");
const MongoStore = require("connect-mongo");
const passport = require("passport");
const { createApp } = require("./app");
const { DEFAULT_MONGODB_URI } = require("./config/database");

const port = Number(process.env.PORT) || 3000;
const mongoUrl = process.env.MONGODB_URI || DEFAULT_MONGODB_URI;
const isProduction = process.env.NODE_ENV === "production";
const sessionSecret = process.env.SESSION_SECRET || "development-only-change-me";

if (isProduction && sessionSecret === "development-only-change-me") {
  throw new Error("SESSION_SECRET es obligatorio en producción.");
}

async function start() {
  await mongoose.connect(mongoUrl, { serverSelectionTimeoutMS: 10_000 });
  require("./config/passport")(passport);

  const sessionStore = MongoStore.create({
    client: mongoose.connection.getClient(),
    collectionName: "sessions",
    ttl: 60 * 60 * 4,
    touchAfter: 60
  });
  const app = createApp({ passport, sessionStore, sessionSecret, isProduction });
  const server = app.listen(port, () => {
    console.log(`Servidor disponible en http://localhost:${port}`);
  });

  async function shutdown(signal) {
    console.log(`${signal}: cerrando servidor...`);
    server.close(async () => {
      await mongoose.disconnect();
      process.exit(0);
    });
  }

  process.once("SIGINT", () => shutdown("SIGINT"));
  process.once("SIGTERM", () => shutdown("SIGTERM"));
}

start().catch((error) => {
  console.error("No fue posible iniciar la aplicación:", error.message);
  process.exitCode = 1;
});
