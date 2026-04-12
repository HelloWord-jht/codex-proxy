/**
 * Electron main process for Codex Proxy desktop app.
 *
 * Built by esbuild into dist-electron/main.cjs (CJS format).
 * Loads the backend ESM modules from asarUnpack (real filesystem paths).
 */

import { app, BrowserWindow, Tray, Menu, nativeImage, dialog, ipcMain } from "electron";
import { resolve, join } from "path";
import { pathToFileURL } from "url";
import { existsSync, mkdirSync } from "fs";
import { IS_MAC } from "./constants.js";
import {
  ensureDesktopStartupAuthConfig,
  getStoredStartupAuthSecretKey,
} from "./startup-auth-config.js";
import { createLocalOnlyWindowOpenHandler, isAllowedLocalWindowUrl } from "./window-open-policy.js";

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let serverHandle: { close: () => Promise<void>; port: number } | null = null;
let isQuitting = false;
let allowProcessExit = false;

async function promptForStartupSecretKey(): Promise<string | null> {
  const submitChannel = `startup-auth-submit-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const cancelChannel = `startup-auth-cancel-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const promptWindow = new BrowserWindow({
    width: 560,
    height: 360,
    resizable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    autoHideMenuBar: true,
    title: "Startup Authentication",
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      sandbox: false,
    },
  });

  const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Startup Authentication</title>
    <style>
      :root { color-scheme: light; font-family: "Segoe UI", sans-serif; }
      body { margin: 0; background: #f5f7fb; color: #172033; }
      .wrap { padding: 24px; }
      h1 { margin: 0 0 10px; font-size: 22px; }
      p { margin: 0 0 12px; line-height: 1.5; color: #43506b; }
      textarea {
        width: 100%;
        height: 130px;
        box-sizing: border-box;
        padding: 12px;
        border: 1px solid #c5d0e0;
        border-radius: 10px;
        resize: none;
        font: 13px/1.5 Consolas, "Courier New", monospace;
        background: #fff;
      }
      .hint { font-size: 12px; color: #63708d; }
      .error { min-height: 20px; margin-top: 8px; color: #c62828; font-size: 12px; }
      .actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 16px; }
      button {
        min-width: 96px;
        padding: 10px 16px;
        border: 0;
        border-radius: 10px;
        font: 600 14px "Segoe UI", sans-serif;
        cursor: pointer;
      }
      .secondary { background: #dce4f2; color: #172033; }
      .primary { background: #1664d9; color: #fff; }
    </style>
  </head>
  <body>
    <div class="wrap">
      <h1>Enter Startup Secret Key</h1>
      <p>The desktop app needs a <code>startup_auth.secretKey</code> before it can start.</p>
      <p class="hint">The value will be saved to this machine's <code>data/local.yaml</code> and reused on later launches.</p>
      <textarea id="secret" placeholder="Paste your startup_auth secretKey here"></textarea>
      <div id="error" class="error"></div>
      <div class="actions">
        <button id="cancel" class="secondary" type="button">Exit</button>
        <button id="save" class="primary" type="button">Save and Start</button>
      </div>
    </div>
    <script>
      const { ipcRenderer } = require("electron");
      const secret = document.getElementById("secret");
      const error = document.getElementById("error");
      const submit = () => {
        const value = secret.value.trim();
        if (!value) {
          error.textContent = "secretKey is required.";
          secret.focus();
          return;
        }
        ipcRenderer.send(${JSON.stringify(submitChannel)}, value);
      };
      document.getElementById("save").addEventListener("click", submit);
      document.getElementById("cancel").addEventListener("click", () => {
        ipcRenderer.send(${JSON.stringify(cancelChannel)});
      });
      secret.addEventListener("keydown", (event) => {
        if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
          submit();
        }
      });
      window.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
          ipcRenderer.send(${JSON.stringify(cancelChannel)});
        }
      });
      window.addEventListener("load", () => {
        secret.focus();
      });
    </script>
  </body>
</html>`;

  await promptWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
  promptWindow.show();
  promptWindow.focus();

  return new Promise((resolvePromise) => {
    let settled = false;

    const finish = (value: string | null) => {
      if (settled) return;
      settled = true;
      ipcMain.removeAllListeners(submitChannel);
      ipcMain.removeAllListeners(cancelChannel);
      if (!promptWindow.isDestroyed()) {
        promptWindow.close();
      }
      resolvePromise(value);
    };

    ipcMain.once(submitChannel, (_event, value: unknown) => {
      finish(typeof value === "string" ? value.trim() : null);
    });
    ipcMain.once(cancelChannel, () => finish(null));
    promptWindow.on("closed", () => finish(null));
  });
}

async function ensureStartupAuthSecretKey(dataDir: string): Promise<boolean> {
  const localConfigPath = resolve(dataDir, "local.yaml");
  let localConfig = ensureDesktopStartupAuthConfig(localConfigPath);
  let secretKey = getStoredStartupAuthSecretKey(localConfig);

  while (!secretKey) {
    const enteredSecretKey = await promptForStartupSecretKey();
    if (!enteredSecretKey) {
      return false;
    }
    localConfig = ensureDesktopStartupAuthConfig(localConfigPath, enteredSecretKey);
    secretKey = getStoredStartupAuthSecretKey(localConfig);
  }

  return true;
}

function getErrorCode(error: unknown): string | null {
  if (
    error !== null &&
    typeof error === "object" &&
    "code" in error &&
    typeof (error as { code: unknown }).code === "string"
  ) {
    return (error as { code: string }).code;
  }
  return null;
}

function isStartupAuthError(error: unknown): boolean {
  const code = getErrorCode(error);
  if (code && (code.startsWith("STARTUP_AUTH") || code.startsWith("INVALID_STARTUP_AUTH"))) {
    return true;
  }
  if (!(error instanceof Error)) {
    return false;
  }
  const message = error.message.toLowerCase();
  const stack = error.stack?.toLowerCase() ?? "";
  return (
    message.includes("startup authentication") ||
    message.includes("startup_auth") ||
    stack.includes("startupauthenticator")
  );
}

async function handleStartupAuthRetry(dataDir: string, error: unknown): Promise<boolean> {
  if (!isStartupAuthError(error)) {
    return false;
  }

  const message = error instanceof Error ? error.message : String(error);
  const result = await dialog.showMessageBox({
    type: "warning",
    buttons: ["Re-enter Secret Key", "Exit"],
    defaultId: 0,
    cancelId: 1,
    noLink: true,
    title: "Startup Authentication Failed",
    message: "Startup authentication failed",
    detail: `${message}\n\nYou can re-enter the secretKey or exit the app.`,
  });

  if (result.response !== 0) {
    return false;
  }

  const enteredSecretKey = await promptForStartupSecretKey();
  if (!enteredSecretKey) {
    return false;
  }

  const localConfigPath = resolve(dataDir, "local.yaml");
  ensureDesktopStartupAuthConfig(localConfigPath, enteredSecretKey);
  return true;
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  });
}

function setupAppMenu(): void {
  if (!IS_MAC) return;

  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: app.name,
      submenu: [
        { role: "about" },
        { type: "separator" },
        { role: "hide" },
        { role: "hideOthers" },
        { role: "unhide" },
        { type: "separator" },
        {
          label: "Quit",
          accelerator: "Command+Q",
          click: () => quitApplication(),
        },
      ],
    },
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { role: "selectAll" },
      ],
    },
    {
      label: "View",
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
        { role: "toggleDevTools" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
    {
      label: "Window",
      submenu: [
        { role: "minimize" },
        { role: "zoom" },
        { type: "separator" },
        { role: "front" },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

app.on("ready", async () => {
  setupAppMenu();

  try {
    const userData = app.getPath("userData");
    const dataDir = resolve(userData, "data");
    if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });
    const hasStartupSecretKey = await ensureStartupAuthSecretKey(dataDir);
    if (!hasStartupSecretKey) {
      dialog.showErrorBox(
        "Codex Proxy - Startup Authentication Required",
        "startup_auth.secretKey is required before the desktop app can start.",
      );
      quitApplication();
      return;
    }

    const appRoot = app.getAppPath();
    const monorepoRoot = resolve(appRoot, "..", "..");
    const distRoot = app.isPackaged
      ? resolve(process.resourcesPath, "app.asar.unpacked")
      : monorepoRoot;

    const binDir = app.isPackaged
      ? resolve(process.resourcesPath, "bin")
      : resolve(monorepoRoot, "bin");

    const serverUrl = pathToFileURL(resolve(appRoot, "dist-electron", "server.mjs")).href;
    const { setPaths, startServer } = await import(serverUrl);

    setPaths({
      rootDir: appRoot,
      configDir: resolve(distRoot, "config"),
      dataDir,
      binDir,
      publicDir: resolve(distRoot, "public"),
    });

    for (;;) {
      try {
        try {
          serverHandle = await startServer({ host: "127.0.0.1" });
        } catch (error) {
          if (isStartupAuthError(error)) {
            throw error;
          }
          console.warn("[Electron] Default port in use, using random port");
          serverHandle = await startServer({ host: "127.0.0.1", port: 0 });
        }
        break;
      } catch (error) {
        const retried = await handleStartupAuthRetry(dataDir, error);
        if (!retried) {
          throw error;
        }
      }
    }
    console.log(`[Electron] Server started on port ${serverHandle.port}`);

    createTray();
    createWindow();
  } catch (err) {
    console.error("[Electron] Startup failed:", err);
    dialog.showErrorBox(
      "Codex Proxy - Startup Error",
      `Failed to start:\n\n${err instanceof Error ? err.stack ?? err.message : String(err)}`,
    );
    quitApplication();
  }
});

function createWindow(): void {
  if (IS_MAC) app.dock?.show();

  if (mainWindow) {
    mainWindow.show();
    mainWindow.focus();
    return;
  }

  mainWindow = new BrowserWindow({
    width: 1100,
    height: 750,
    minWidth: 800,
    minHeight: 500,
    title: "Codex Proxy",
    ...(IS_MAC
      ? {
          titleBarStyle: "hiddenInset",
          trafficLightPosition: { x: 16, y: 18 },
        }
      : {}),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    show: false,
  });

  const port = serverHandle?.port ?? 8080;
  mainWindow.loadURL(`http://127.0.0.1:${port}/`);

  mainWindow.webContents.on("did-finish-load", () => {
    const legacy = IS_MAC ? "electron-mac" : "electron-win";
    const platform = IS_MAC ? "platform-mac" : "platform-win";
    mainWindow?.webContents.executeJavaScript(
      `document.documentElement.classList.add("electron","${legacy}","${platform}")`,
    );
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
  });

  mainWindow.on("close", (e) => {
    if (!isQuitting) {
      e.preventDefault();
      mainWindow?.hide();
      if (IS_MAC) app.dock?.hide();
    }
  });

  mainWindow.webContents.setWindowOpenHandler(
    createLocalOnlyWindowOpenHandler(port),
  );
  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (!isAllowedLocalWindowUrl(url, port)) {
      event.preventDefault();
    }
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function quitApplication(): void {
  allowProcessExit = true;
  isQuitting = true;

  if (!serverHandle) {
    app.quit();
    return;
  }

  const forceQuit = setTimeout(() => {
    console.error("[Electron] Server close timeout, forcing exit");
    app.exit(0);
  }, 5000);

  serverHandle.close()
    .then(() => {
      clearTimeout(forceQuit);
      app.quit();
    })
    .catch((err: unknown) => {
      console.error("[Electron] Server close error:", err);
      clearTimeout(forceQuit);
      app.quit();
    });
}

function buildTrayMenu(): Electron.MenuItemConstructorOptions[] {
  return [
    {
      label: "Open Dashboard",
      click: () => createWindow(),
    },
    { type: "separator" },
    {
      label: `Port: ${serverHandle?.port ?? 8080}`,
      enabled: false,
    },
    { type: "separator" },
    {
      label: "Quit",
      click: () => quitApplication(),
    },
  ];
}

function createTray(): void {
  const iconPath = app.isPackaged
    ? join(app.getAppPath(), "electron", "assets", "icon.png")
    : join(__dirname, "..", "electron", "assets", "icon.png");
  let icon = existsSync(iconPath)
    ? nativeImage.createFromPath(iconPath)
    : nativeImage.createEmpty();

  if (IS_MAC && !icon.isEmpty()) {
    icon = icon.resize({ width: 18, height: 18 });
    icon.setTemplateImage(true);
  }

  tray = new Tray(icon.isEmpty() ? nativeImage.createEmpty() : icon);
  tray.setToolTip("Codex Proxy");
  tray.setContextMenu(Menu.buildFromTemplate(buildTrayMenu()));
  tray.on("double-click", () => createWindow());
}

app.on("activate", () => {
  createWindow();
});

process.on("SIGTERM", () => {
  if (!isQuitting) quitApplication();
});

app.on("before-quit", (event) => {
  if (IS_MAC && !allowProcessExit) {
    event.preventDefault();
    mainWindow?.hide();
    app.dock?.hide();
    return;
  }

  isQuitting = true;
});

app.on("window-all-closed", () => {
  // Tray keeps the app running.
});
