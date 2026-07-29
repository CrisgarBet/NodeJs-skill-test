"use strict";

const { rateLimit } = require("express-rate-limit");
const { MODES, sortFile } = require("./array-sorter");

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: "Demasiados intentos. Intenta nuevamente en unos minutos."
});

function requireLogin(req, res, next) {
  if (req.isAuthenticated()) return next();
  return res.redirect("/login");
}

module.exports = function registerRoutes({ app, passport, inputPath, outputPath }) {
  app.get("/", (req, res) => {
    res.render("index", { user: req.user });
  });

  app.get("/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/login", (req, res) => {
    if (req.isAuthenticated()) return res.redirect("/profile");
    return res.render("login", { message: req.flash("loginMessage") });
  });

  app.post(
    "/login",
    authLimiter,
    passport.authenticate("local-login", {
      successRedirect: "/profile",
      failureRedirect: "/login",
      failureFlash: true
    })
  );

  app.get("/signup", (req, res) => {
    if (req.isAuthenticated()) return res.redirect("/profile");
    return res.render("signup", { message: req.flash("signupMessage") });
  });

  app.post(
    "/signup",
    authLimiter,
    passport.authenticate("local-signup", {
      successRedirect: "/profile",
      failureRedirect: "/signup",
      failureFlash: true
    })
  );

  app.post("/logout", requireLogin, (req, res, next) => {
    req.logout((error) => {
      if (error) return next(error);
      req.session.destroy((sessionError) => {
        if (sessionError) return next(sessionError);
        res.clearCookie("prueba_jaya.sid");
        return res.redirect("/");
      });
    });
  });

  app.get("/profile", requireLogin, (req, res) => {
    res.render("profile", { user: req.user });
  });

  async function handleSort(req, res, next) {
    try {
      const mode = req.params.mode;
      if (!MODES.has(mode)) {
        const error = new Error("Modo de ordenamiento no válido.");
        error.status = 400;
        throw error;
      }
      return res.json(await sortFile(mode, inputPath, outputPath));
    } catch (error) {
      return next(error);
    }
  }

  app.get("/api/sort/:mode", handleSort);
  app.get("/asc", (req, res, next) => {
    req.params.mode = "asc";
    return handleSort(req, res, next);
  });
  app.get("/des", (req, res, next) => {
    req.params.mode = "des";
    return handleSort(req, res, next);
  });
  app.get("/mix", (req, res, next) => {
    req.params.mode = "mix";
    return handleSort(req, res, next);
  });
};

module.exports.requireLogin = requireLogin;
