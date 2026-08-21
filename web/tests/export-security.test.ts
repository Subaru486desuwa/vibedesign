import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const editor = readFileSync(new URL("../src/pages/EditorPage.tsx", import.meta.url), "utf8");
const main = readFileSync(new URL("../../electron/main.cjs", import.meta.url), "utf8");
const preload = readFileSync(new URL("../../electron/preload.cjs", import.meta.url), "utf8");

test("all PDF entry points use the headless render API", () => {
  assert.equal(editor.includes('window.open("", "_blank")'), false);
  assert.equal(editor.includes("document.write(stripWorkingAttrs"), false);
  assert.match(editor, /entry\.action === "save-pdf"[\s\S]*exportCurrentPdf/);
  assert.match(editor, /fetch\("\/api\/render-screenshot"/);
});

test("Electron generic artifact previews use an isolated main-process window", () => {
  assert.match(editor, /openArtifactWindow/);
  assert.match(preload, /vd:open-artifact-window/);
  assert.match(main, /ipcMain\.on\("vd:open-artifact-window"/);
  assert.match(main, /function createArtifactWindow/);
  assert.match(main, /sandbox: true/);
  assert.match(main, /nodeIntegration: false/);
  assert.match(main, /contextIsolation: true/);
});

test("the privileged editor window never allows authored blank or blob popups", () => {
  const createWindowSource = main.slice(main.indexOf("function createWindow"));
const handler = createWindowSource.slice(
  createWindowSource.indexOf("win.webContents.setWindowOpenHandler"),
  createWindowSource.indexOf("// Give the embedded server"),
);
  assert.equal(handler.includes('url === "about:blank"'), false);
  assert.equal(handler.includes('url.startsWith("blob:")'), false);
  assert.match(handler, /return \{ action: "deny" \}/);
});
