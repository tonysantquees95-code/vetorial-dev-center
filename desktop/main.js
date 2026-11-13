// Painel Dev no Windows: janela própria que abre o site oficial (sempre na versão mais recente).
const { app, BrowserWindow, shell, Menu } = require("electron");
const path = require("path");

const SITE = "https://tonysantquees95-code.github.io/vetorial-dev-center/";

function abrir() {
  const w = new BrowserWindow({
    width: 1280, height: 800, minWidth: 420, minHeight: 600, show: false, backgroundColor: "#000000",
    title: "Vetorial Dev", icon: path.join(__dirname, "build", "icon.png"),
    webPreferences: { contextIsolation: true, sandbox: true, nodeIntegration: false }
  });
  Menu.setApplicationMenu(null);
  w.maximize();
  w.once("ready-to-show", () => w.show());
  w.webContents.setWindowOpenHandler(({ url }) => { if (url.startsWith("https://")) void shell.openExternal(url); return { action: "deny" }; });
  w.webContents.on("will-navigate", (e, url) => { if (!url.startsWith(SITE) && !url.startsWith("file:")) { e.preventDefault(); if (url.startsWith("https://")) void shell.openExternal(url); } });
  // a primeira carga falha com frequência logo depois de abrir a rede: tenta de novo antes de mostrar a tela de aviso
  let tentativas = 0;
  w.webContents.on("did-fail-load", (_e, codigo, _d, url, principal) => {
    if (!principal || codigo === -3) return;
    if (url.startsWith("file:")) return;
    if (tentativas++ < 4) setTimeout(() => w.loadURL(SITE), 1500 * tentativas);
    else w.loadFile(path.join(__dirname, "offline.html"));
  });
  w.loadURL(SITE);
}

const unica = app.requestSingleInstanceLock();
if (!unica) app.quit();
else {
  app.on("second-instance", () => { const [w] = BrowserWindow.getAllWindows(); if (w) { if (w.isMinimized()) w.restore(); w.focus(); } });
  app.whenReady().then(abrir);
  app.on("window-all-closed", () => app.quit());
}
