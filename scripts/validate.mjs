/* Physics Solved — data validator.
 * Checks that the JSON in /data is internally consistent:
 *   - registry references (equation files, sheet files, per-subject frqFile) exist
 *   - every equation's `uses` names a variable declared in its unit
 *   - FRQ shape: courseId references the registry; parts have label/modelAnswer;
 *     difficulty is 1–3 and points are numeric when present
 *
 * Runs standalone (`node scripts/validate.mjs`) and is invoked by build.mjs.
 * Exports validate() -> { errors, warnings }.
 */
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const p = (rel) => path.join(ROOT, "data", rel);

async function readJson(rel, errors) {
  const abs = p(rel);
  if (!existsSync(abs)) { errors.push(`Missing file: data/${rel}`); return null; }
  try { return JSON.parse(await readFile(abs, "utf8")); }
  catch (e) { errors.push(`Invalid JSON in data/${rel}: ${e.message}`); return null; }
}

export async function validate() {
  const errors = [];
  const warnings = [];

  const registry = await readJson("registry.json", errors);
  if (!registry) return { errors, warnings };

  const courseIds = new Set();
  (registry.subjects || []).forEach((s) =>
    (s.courses || []).forEach((c) => courseIds.add(c.id)));

  for (const subject of registry.subjects || []) {
    // Per-subject FRQ file.
    if (subject.frqFile) {
      const frq = await readJson(subject.frqFile, errors);
      if (frq) validateFrq(subject, frq, courseIds, errors, warnings);
    }
    for (const course of subject.courses || []) {
      const feats = course.features || [];
      if (feats.includes("equation-finder")) {
        const eq = await readJson(`equations/${course.id}.json`, errors);
        if (eq) validateEquations(course.id, eq, errors, warnings);
      }
      if (feats.includes("sheet")) {
        for (const sh of course.sheets || []) {
          if (!sh.file) { errors.push(`Course ${course.id}: sheet entry missing "file"`); continue; }
          if (!existsSync(p(sh.file))) errors.push(`Course ${course.id}: sheet file data/${sh.file} not found`);
        }
        if (!course.sheets || !course.sheets.length)
          warnings.push(`Course ${course.id} has "sheet" feature but no sheets[] entries`);
      }
      if (feats.includes("frq") && !subject.frqFile)
        warnings.push(`Course ${course.id} has "frq" feature but subject "${subject.id}" has no frqFile`);
    }
  }
  return { errors, warnings };
}

function validateEquations(courseId, data, errors, warnings) {
  (data.units || []).forEach((unit, ui) => {
    const syms = new Set((unit.variables || []).map((v) => v.sym));
    (unit.equations || []).forEach((eq, ei) => {
      const where = `equations/${courseId}.json unit[${ui}] "${unit.title || ""}" eq "${eq.name || ei}"`;
      if (!Array.isArray(eq.uses)) { errors.push(`${where}: missing "uses" array`); return; }
      eq.uses.forEach((u) => {
        if (!syms.has(u)) errors.push(`${where}: uses "${u}" which is not a declared variable`);
      });
    });
  });
}

function validateFrq(subject, data, courseIds, errors, warnings) {
  const file = subject.frqFile;
  if (!Array.isArray(data.questions)) { errors.push(`${file}: missing questions[]`); return; }
  const ids = new Set();
  data.questions.forEach((q, i) => {
    const w = `${file} q[${i}] "${q.title || q.id || ""}"`;
    if (!q.id) errors.push(`${w}: missing id`);
    else if (ids.has(q.id)) errors.push(`${w}: duplicate id "${q.id}"`);
    else ids.add(q.id);
    if (!q.courseId || !courseIds.has(q.courseId))
      errors.push(`${w}: courseId "${q.courseId}" not in registry`);
    if (q.difficulty != null && !(q.difficulty >= 1 && q.difficulty <= 3))
      errors.push(`${w}: difficulty must be 1–3`);
    if (!Array.isArray(q.parts) || !q.parts.length) { errors.push(`${w}: needs parts[]`); return; }
    q.parts.forEach((part, pi) => {
      if (!part.label) warnings.push(`${w} part[${pi}]: missing label`);
      if (!part.modelAnswer) warnings.push(`${w} part[${pi}]: missing modelAnswer`);
      if (part.points != null && typeof part.points !== "number")
        errors.push(`${w} part[${pi}]: points must be a number`);
    });
  });
}

// Standalone run.
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("validate.mjs")) {
  const { errors, warnings } = await validate();
  warnings.forEach((m) => console.warn("  warn: " + m));
  if (errors.length) {
    errors.forEach((m) => console.error("  ERROR: " + m));
    console.error(`\nValidation failed: ${errors.length} error(s), ${warnings.length} warning(s).`);
    process.exit(1);
  }
  console.log(`Validation passed (${warnings.length} warning(s)).`);
}
