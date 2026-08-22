const { contextBridge, ipcRenderer } = require("electron");
const packageInfo = require("../package.json");

contextBridge.exposeInMainWorld("DocGestorDesktop", {
  platform: process.platform,
  version: packageInfo.version,
  openKmlFile(payload) {
    return ipcRenderer.invoke("docgestor:open-kml-file", payload);
  },
});
