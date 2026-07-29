"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs/promises");
const path = require("node:path");

const MODES = new Set(["asc", "des", "mix"]);

function parseArrays(content) {
  if (typeof content !== "string" || content.trim() === "") {
    throw new Error("El archivo de entrada está vacío.");
  }

  return content
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item, arrayIndex) => {
      const hasOpeningBracket = item.startsWith("[");
      const hasClosingBracket = item.endsWith("]");
      if (hasOpeningBracket !== hasClosingBracket) {
        throw new Error(`Corchetes incompletos en el arreglo ${arrayIndex + 1}.`);
      }
      const value = item.replace(/^\[/, "").replace(/\]$/, "").trim();
      if (!value) return [];

      return value.split(",").map((rawNumber) => {
        const trimmed = rawNumber.trim();
        const number = Number(trimmed);
        if (trimmed === "" || !Number.isFinite(number)) {
          throw new Error(`Valor inválido en el arreglo ${arrayIndex + 1}: "${rawNumber}".`);
        }
        return number;
      });
    });
}

function sortArrays(arrays, mode) {
  if (!MODES.has(mode)) throw new Error(`Modo de ordenamiento no válido: ${mode}.`);

  return arrays.map((values, index) => {
    const direction = mode === "mix" ? (index % 2 === 0 ? "asc" : "des") : mode;
    return [...values].sort((left, right) =>
      direction === "asc" ? left - right : right - left
    );
  });
}

async function sortFile(mode, inputPath, outputPath) {
  const content = await fs.readFile(inputPath, "utf8");
  const result = sortArrays(parseArrays(content), mode);
  const output = `${result.map((values) => `[${values.join(", ")}]`).join(";\n")}\n`;
  const temporaryPath = `${outputPath}.${crypto.randomUUID()}.tmp`;

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  try {
    await fs.writeFile(temporaryPath, output, "utf8");
    await fs.rename(temporaryPath, outputPath);
  } catch (error) {
    await fs.rm(temporaryPath, { force: true });
    throw error;
  }
  return result;
}

module.exports = { MODES, parseArrays, sortArrays, sortFile };
