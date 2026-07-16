import { register } from "node:module";
import { pathToFileURL } from "node:url";
register("./resolve_extless.mjs", pathToFileURL("./scripts/"));
await import("./export_content.mjs");
