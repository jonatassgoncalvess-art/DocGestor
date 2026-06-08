const { contextBridge } = require("electron");
const packageInfo = require("../package.json");

contextBridge.exposeInMainWorld("DocGestorDesktop", {
  platform: process.platform,
  version: packageInfo.version,
});
