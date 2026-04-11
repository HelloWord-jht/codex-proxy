/**
 * Electron main process for Codex Proxy desktop app.
 *
 * Built by esbuild into dist-electron/main.cjs (CJS format).
 * Loads the backend ESM modules from asarUnpack (real filesystem paths).
 */

import { app, BrowserWindow, Tray, Menu, nativeImage, dialog } from "electron";
import { resolve, join } from "path";
import { pathToFileURL } from "url";
import { existsSync, mkdirSync } from "fs";
import { IS_MAC } from "./constants.js";
import { createLocalOnlyWindowOpenHandler, isAllowedLocalWindowUrl } from "./window-open-policy.js";

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let serverHandle: { close: () => Promise<void>; port: number } | null = null;
let isQuitting = false;
let allowProcessExit = false;

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

    try {
      serverHandle = await startServer({ host: "127.0.0.1" });
    } catch {
      console.warn("[Electron] Default port in use, using random port");
      serverHandle = await startServer({ host: "127.0.0.1", port: 0 });
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
