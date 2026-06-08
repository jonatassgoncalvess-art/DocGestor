const path = require("path");
const { app, BrowserWindow, dialog, shell } = require("electron");

const APP_URL = "https://doc-gestor.vercel.app";

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1360,
    height: 820,
    minWidth: 1100,
    minHeight: 700,
    title: "DocGestor by Carminatti",
    icon: path.join(__dirname, "../assets/app-icon.ico"),
    autoHideMenuBar: true,
    backgroundColor: "#f3f4f6",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.loadURL(APP_URL);

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.webContents.on("did-fail-load", (_event, errorCode, errorDescription) => {
    if (errorCode === -3) return;
    dialog.showMessageBox(mainWindow, {
      type: "warning",
      title: "Sem conexao com o DocGestor",
      message: "Nao foi possivel carregar o DocGestor.",
      detail: `Verifique a internet deste computador e tente novamente.\n\nDetalhe tecnico: ${errorDescription}`,
      buttons: ["Tentar novamente", "Fechar"],
      defaultId: 0,
    }).then(({ response }) => {
      if (response === 0) mainWindow.loadURL(APP_URL);
      else app.quit();
    });
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
