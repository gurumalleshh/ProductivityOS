const { app, BrowserWindow } = require("electron");
const path = require("path");
const fs = require("fs");

const isDev =
  !app.isPackaged && process.env.ELECTRON_FORCE_PROD !== "true";

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    title: "ProductivityOS",

    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },

    show: false,
  });

  win.once("ready-to-show", () => {
    win.show();
  });

  if (isDev) {
    // Development mode: load the Vite development server
    win.loadURL("http://localhost:3000");
  } else {
    // Production mode: load the built React application
    const indexPath = path.resolve(
      __dirname,
      "..",
      "dist",
      "index.html"
    );

    console.log("Production index path:", indexPath);
    console.log("File exists:", fs.existsSync(indexPath));

    win.loadFile(indexPath).catch((error) => {
      console.error("Failed to load ProductivityOS:", error);
    });
  }

  win.webContents.on(
    "did-fail-load",
    (event, errorCode, errorDescription, validatedURL) => {
      console.error("Electron failed to load page:");
      console.error("Error code:", errorCode);
      console.error("Description:", errorDescription);
      console.error("URL:", validatedURL);
    }
  );
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});