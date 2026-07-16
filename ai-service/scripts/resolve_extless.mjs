/** Loader hook: let Node resolve extensionless relative imports (Next.js style). */
import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve as pathResolve } from "node:path";

export async function resolve(specifier, context, next) {
  if (specifier.startsWith(".") && !specifier.endsWith(".js")) {
    const parent = context.parentURL ? dirname(fileURLToPath(context.parentURL)) : process.cwd();
    const candidate = pathResolve(parent, specifier + ".js");
    if (existsSync(candidate)) return next(pathToFileURL(candidate).href, context);
  }
  return next(specifier, context);
}
