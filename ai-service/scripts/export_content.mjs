/**
 * Export curriculum content from the web/ Next.js data modules into a flat
 * JSONL corpus the Python RAG ingester can consume. Runs in Node so it imports
 * the real ESM modules instead of brittle-parsing them.
 *
 * Usage: node scripts/export_content.mjs > corpus/curriculum.jsonl
 */
import { pathToFileURL } from "node:url";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const dataDir = resolve(here, "../../web/data");

async function load(name, exportName) {
  const mod = await import(pathToFileURL(resolve(dataDir, name)).href);
  return mod[exportName];
}

function emit(record) {
  process.stdout.write(JSON.stringify(record) + "\n");
}

async function main() {
  const sources = [
    { file: "chaptersData.js", exportName: "chaptersData", subject: "sains" },
    { file: "chaptersDataMath.js", exportName: "chaptersDataMath", subject: "matematik" },
  ];

  for (const { file, exportName, subject } of sources) {
    let chapters;
    try {
      chapters = await load(file, exportName);
    } catch (err) {
      process.stderr.write(`skip ${file}: ${err.message}\n`);
      continue;
    }
    for (const chapter of chapters ?? []) {
      for (const sub of chapter.subchapters ?? []) {
        // Two shapes exist in the data: content nested in a sections[] array
        // (chapter1), or content directly on the subchapter (chapter2/3).
        const sections = sub.subsections ?? sub.sections ?? null;
        const items = sections ?? (sub.content ? [{ content: sub.content }] : []);
        for (const [i, section] of items.entries()) {
          if (!section?.content) continue;
          emit({
            subject,
            chapter: String(chapter.id),
            chapter_title: chapter.title ?? "",
            subchapter: String(sub.id ?? ""),
            subchapter_title: sub.title ?? "",
            section_index: i,
            content: section.content.trim(),
          });
        }
      }
    }
  }
}

main().catch((err) => {
  process.stderr.write(String(err?.stack ?? err) + "\n");
  process.exit(1);
});
