import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import JSZip from "jszip";
import { requireUser } from "@/lib/auth";
import { APP_URL } from "@/lib/env";

// Serves the browser extension as a zip preconfigured for this deployment:
// the manifest gets the tracker origin as an install-time host permission and
// the scripts get it as their default app URL, so nothing has to be set up on
// the extension's options page after loading it unpacked.

const TEXT_EXTENSIONS = new Set([".js", ".json", ".html", ".css", ".md"]);

async function collectFiles(
  dir: string,
  base = ""
): Promise<Array<{ rel: string; abs: string }>> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files: Array<{ rel: string; abs: string }> = [];

  for (const entry of entries) {
    const abs = path.join(dir, entry.name);
    const rel = base ? `${base}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(abs, rel)));
    } else {
      files.push({ rel, abs });
    }
  }

  return files;
}

function configureManifest(source: string, origin: string): string {
  const manifest = JSON.parse(source);
  manifest.host_permissions = [`${origin}/*`];
  return JSON.stringify(manifest, null, 2);
}

function configureDefaultUrl(source: string, origin: string): string {
  return source.replace(
    /const DEFAULT_APP_URL = "[^"]*";/,
    `const DEFAULT_APP_URL = "${origin}";`
  );
}

export async function GET() {
  await requireUser();

  const origin = new URL(APP_URL).origin;
  const root = path.join(process.cwd(), "extension");
  const zip = new JSZip();

  for (const file of await collectFiles(root)) {
    if (file.rel === "manifest.json") {
      zip.file(file.rel, configureManifest(await fs.readFile(file.abs, "utf8"), origin));
    } else if (file.rel === "background.js" || file.rel === "options/options.js") {
      zip.file(file.rel, configureDefaultUrl(await fs.readFile(file.abs, "utf8"), origin));
    } else if (TEXT_EXTENSIONS.has(path.extname(file.rel))) {
      zip.file(file.rel, await fs.readFile(file.abs, "utf8"));
    } else {
      zip.file(file.rel, await fs.readFile(file.abs));
    }
  }

  const buffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": 'attachment; filename="application-tracker-extension.zip"',
      "Cache-Control": "no-store",
    },
  });
}
