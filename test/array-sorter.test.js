"use strict";

const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");
const { parseArrays, sortArrays, sortFile } = require("../src/app/array-sorter");

test("parseArrays convierte la entrada a números", () => {
  assert.deepEqual(parseArrays("[4, -2, 3.5]; [0] ;"), [[4, -2, 3.5], [0]]);
});

test("parseArrays rechaza valores no numéricos", () => {
  assert.throws(() => parseArrays("[1, hola, 3]"), /Valor inválido/);
  assert.throws(() => parseArrays("[1, 2, 3"), /Corchetes incompletos/);
});

test("sortArrays implementa asc, des y mix sin mutar la entrada", () => {
  const input = [[3, 1, 2], [8, 10, 9], [0, -1]];
  assert.deepEqual(sortArrays(input, "asc"), [[1, 2, 3], [8, 9, 10], [-1, 0]]);
  assert.deepEqual(sortArrays(input, "des"), [[3, 2, 1], [10, 9, 8], [0, -1]]);
  assert.deepEqual(sortArrays(input, "mix"), [[1, 2, 3], [10, 9, 8], [-1, 0]]);
  assert.deepEqual(input, [[3, 1, 2], [8, 10, 9], [0, -1]]);
});

test("sortFile persiste una salida legible", async (t) => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "prueba-jaya-"));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const inputPath = path.join(directory, "original.txt");
  const outputPath = path.join(directory, "sorted.txt");
  await fs.writeFile(inputPath, "[4,1,2]; [7,3]", "utf8");

  assert.deepEqual(await sortFile("mix", inputPath, outputPath), [[1, 2, 4], [7, 3]]);
  assert.equal(await fs.readFile(outputPath, "utf8"), "[1, 2, 4];\n[7, 3]\n");
});

test("sortFile tolera solicitudes concurrentes sin dejar una salida parcial", async (t) => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "prueba-jaya-concurrent-"));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const inputPath = path.join(directory, "original.txt");
  const outputPath = path.join(directory, "sorted.txt");
  await fs.writeFile(inputPath, "[3,1,2]; [7,9,8]", "utf8");

  await Promise.all([
    sortFile("asc", inputPath, outputPath),
    sortFile("des", inputPath, outputPath),
    sortFile("mix", inputPath, outputPath)
  ]);

  const output = await fs.readFile(outputPath, "utf8");
  assert.match(output, /^\[(?:1, 2, 3|3, 2, 1)\];\n\[(?:7, 8, 9|9, 8, 7)\]\n$/);
  assert.deepEqual(await fs.readdir(directory), ["original.txt", "sorted.txt"]);
});
