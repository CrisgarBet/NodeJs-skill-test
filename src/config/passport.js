"use strict";

const { Strategy: LocalStrategy } = require("passport-local");
const User = require("../app/models/user");

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

module.exports = function configurePassport(passport) {
  passport.serializeUser((user, done) => done(null, user.id));

  passport.deserializeUser(async (id, done) => {
    try {
      done(null, await User.findById(id));
    } catch (error) {
      done(error);
    }
  });

  passport.use(
    "local-signup",
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
        passReqToCallback: true
      },
      async (req, rawEmail, password, done) => {
        try {
          const email = normalizeEmail(rawEmail);
          if (!/^\S+@\S+\.\S+$/.test(email)) {
            return done(null, false, req.flash("signupMessage", "Ingresa un correo válido."));
          }
          if (
            typeof password !== "string" ||
            password.length < 8 ||
            Buffer.byteLength(password, "utf8") > 72
          ) {
            return done(
              null,
              false,
              req.flash("signupMessage", "La contraseña debe tener entre 8 y 72 bytes.")
            );
          }
          if (await User.exists({ "local.email": email })) {
            return done(null, false, req.flash("signupMessage", "El correo ya está registrado."));
          }

          const user = new User({ local: { email } });
          await user.setPassword(password);
          await user.save();
          return done(null, user);
        } catch (error) {
          if (error?.code === 11000) {
            return done(null, false, req.flash("signupMessage", "El correo ya está registrado."));
          }
          return done(error);
        }
      }
    )
  );

  passport.use(
    "local-login",
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
        passReqToCallback: true
      },
      async (req, rawEmail, password, done) => {
        try {
          const user = await User.findOne({ "local.email": normalizeEmail(rawEmail) }).select(
            "+local.password"
          );
          if (!user || !(await user.validatePassword(password))) {
            return done(
              null,
              false,
              req.flash("loginMessage", "Correo o contraseña incorrectos.")
            );
          }
          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );
};

module.exports.normalizeEmail = normalizeEmail;
