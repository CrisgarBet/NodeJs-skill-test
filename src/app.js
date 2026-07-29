"use strict";

const crypto = require("node:crypto");
const path = require("node:path");
const express = require("express");
const flash = require("connect-flash");
const helmet = require("helmet");
const morgan = require("morgan");
const session = require("express-session");

const FORM_PAGES = new Set(["/login", "/signup", "/profile"]);
const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function createCsrfMiddleware() {
  return (req, res, next) => {
    const isMutation = MUTATING_METHODS.has(req.method);

    if (!req.session.csrfToken && !isMutation && FORM_PAGES.has(req.path)) {
      req.session.csrfToken = crypto.randomBytes(32).toString("hex");
    }
    res.locals.csrfToken = req.session.csrfToken || "";

    if (!isMutation) return next();

    const suppliedToken = String(req.body?._csrf || req.get("x-csrf-token") || "");
    const expectedToken = req.session.csrfToken || "";
    const validLength = expectedToken.length > 0 && suppliedToken.length === expectedToken.length;
    const valid =
      validLength &&
      crypto.timingSafeEqual(Buffer.from(suppliedToken), Buffer.from(expectedToken));

    if (!valid) {
      const error = new Error("Token CSRF inválido o ausente.");
      error.status = 403;
      return next(error);
    }
    return next();
  };
}

function createApp({
  passport,
  sessionStore,
  sessionSecret = "development-only-change-me",
  isProduction = false,
  inputPath = path.join(__dirname, "data", "original.txt"),
  outputPath = path.join(__dirname, "data", "sorted.txt"),
  logger = process.env.NODE_ENV !== "test"
} = {}) {
  if (!passport) throw new TypeError("createApp requiere una instancia de Passport.");

  const app = express();
  app.disable("x-powered-by");
  if (isProduction) app.set("trust proxy", 1);
  app.set("views", path.join(__dirname, "views"));
  app.set("view engine", "ejs");

  app.use(helmet());
  if (logger) app.use(morgan("combined"));
  app.use(express.urlencoded({ extended: false, limit: "10kb" }));
  app.use(express.json({ limit: "10kb" }));
  app.use(
    session({
      name: "prueba_jaya.sid",
      secret: sessionSecret,
      store: sessionStore,
      resave: false,
      saveUninitialized: false,
      rolling: true,
      cookie: {
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 4,
        sameSite: "lax",
        secure: isProduction
      }
    })
  );
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(flash());
  app.use(createCsrfMiddleware());
  app.use(express.static(path.join(__dirname, "public"), { maxAge: isProduction ? "1d" : 0 }));

  require("./app/routes")({ app, passport, inputPath, outputPath });

  app.use((req, res) => {
    res.status(404).render("error", {
      title: "Página no encontrada",
      message: "La ruta solicitada no existe.",
      status: 404
    });
  });

  app.use((error, req, res, _next) => {
    const status = Number(error.status) || 500;
    if (status >= 500) console.error(error);
    if (req.accepts("html")) {
      return res.status(status).render("error", {
        title: status === 500 ? "Error interno" : "No se pudo completar la solicitud",
        message: status === 500 ? "Ocurrió un error inesperado." : error.message,
        status
      });
    }
    return res.status(status).json({ error: status === 500 ? "Error interno." : error.message });
  });

  return app;
}

module.exports = { createApp, createCsrfMiddleware };
