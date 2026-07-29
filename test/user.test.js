"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const User = require("../src/app/models/user");

test("el modelo cifra y verifica contraseñas", async () => {
  const user = new User({ local: { email: "persona@example.com" } });
  await user.setPassword("contraseña-segura");

  assert.notEqual(user.local.password, "contraseña-segura");
  assert.equal(await user.validatePassword("contraseña-segura"), true);
  assert.equal(await user.validatePassword("incorrecta"), false);
});
