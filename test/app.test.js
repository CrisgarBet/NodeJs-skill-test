"use strict";

const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");
const { Passport } = require("passport");
const request = require("supertest");
const { createApp } = require("../src/app");

async function createTestApp(t) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "prueba-jaya-http-"));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const inputPath = path.join(directory, "original.txt");
  const outputPath = path.join(directory, "sorted.txt");
  await fs.writeFile(inputPath, "[4,6,3,5]; [100,3,450,34]", "utf8");

  return {
    app: createApp({
      passport: new Passport(),
      inputPath,
      outputPath,
      sessionSecret: "test-secret-with-enough-entropy",
      logger: false
    }),
    outputPath
  };
}

test("renderiza el inicio y expone health", async (t) => {
  const { app } = await createTestApp(t);
  await request(app).get("/").expect(200).expect("Content-Type", /html/);
  const health = await request(app).get("/health").expect(200);
  assert.deepEqual(health.body, { status: "ok" });
  assert.equal(health.headers["set-cookie"], undefined);
});

test("las rutas heredadas ordenan y generan sorted.txt", async (t) => {
  const { app, outputPath } = await createTestApp(t);
  const response = await request(app).get("/mix").expect(200).expect("Content-Type", /json/);
  assert.deepEqual(response.body, [[3, 4, 5, 6], [450, 100, 34, 3]]);
  assert.match(await fs.readFile(outputPath, "utf8"), /^\[3, 4, 5, 6\]/);
});

test("rechaza modos desconocidos con un error JSON", async (t) => {
  const { app } = await createTestApp(t);
  const response = await request(app)
    .get("/api/sort/otro")
    .set("Accept", "application/json")
    .expect(400);
  assert.match(response.body.error, /no válido/);
});

test("protege las solicitudes POST sin token CSRF", async (t) => {
  const { app } = await createTestApp(t);
  await request(app).post("/login").type("form").send({ email: "a@b.co", password: "12345678" }).expect(403);
});

test("redirige el perfil anónimo y responde 404", async (t) => {
  const { app } = await createTestApp(t);
  await request(app).get("/profile").expect(302).expect("Location", "/login");
  await request(app).get("/no-existe").expect(404);
});
