import { describe, it, expect, vi, beforeEach } from "vitest";

// env.ts (imported transitively by the route) requires these at module load;
// vi.hoisted runs before the hoisted static imports do.
vi.hoisted(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL ??= "http://localhost:54321";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= "placeholder";
  process.env.NEXT_PUBLIC_APP_URL ??= "http://localhost:3000";
});
import JSZip from "jszip";
import { makeUser } from "../../helpers/factories";

vi.mock("@/lib/auth", () => ({
  requireUser: vi.fn(),
}));

import { GET } from "@/app/api/extension/download/route";
import { requireUser } from "@/lib/auth";

const requireUserMock = vi.mocked(requireUser);
const origin = new URL(process.env.NEXT_PUBLIC_APP_URL!).origin;

beforeEach(() => {
  vi.clearAllMocks();
  requireUserMock.mockResolvedValue({ supabase: {} as never, user: makeUser() as never });
});

async function downloadZip(): Promise<JSZip> {
  const response = await GET();
  expect(response.status).toBe(200);
  expect(response.headers.get("Content-Type")).toBe("application/zip");
  expect(response.headers.get("Content-Disposition")).toContain(".zip");
  return JSZip.loadAsync(await response.arrayBuffer());
}

describe("GET /api/extension/download", () => {
  it("requires an authenticated user", async () => {
    requireUserMock.mockRejectedValue({ type: "redirect", url: "/login" });
    await expect(GET()).rejects.toMatchObject({ type: "redirect" });
  });

  it("grants the tracker origin as an install-time host permission", async () => {
    const zip = await downloadZip();
    const manifest = JSON.parse(await zip.file("manifest.json")!.async("string"));
    expect(manifest.host_permissions).toEqual([`${origin}/*`]);
    expect(manifest.manifest_version).toBe(3);
  });

  it("points the background worker and options page at this deployment", async () => {
    const zip = await downloadZip();
    const background = await zip.file("background.js")!.async("string");
    const options = await zip.file("options/options.js")!.async("string");
    expect(background).toContain(`const DEFAULT_APP_URL = "${origin}";`);
    expect(options).toContain(`const DEFAULT_APP_URL = "${origin}";`);
  });

  it("bundles every extension file, including content scripts and icons", async () => {
    const zip = await downloadZip();
    for (const file of [
      "manifest.json",
      "background.js",
      "shared/job-info.js",
      "shared/confirm-prompt.js",
      "content/linkedin.js",
      "content/indeed.js",
      "popup/popup.html",
      "popup/popup.js",
      "options/options.html",
      "icons/icon-96.png",
    ]) {
      expect(zip.file(file), `${file} missing from zip`).toBeTruthy();
    }
  });
});
