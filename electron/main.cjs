const { app, BrowserWindow, Menu, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { fork, exec } = require('child_process');

let mainWindow = null;
let serverProcess = null;

// Ensure single instance
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
  process.exit(0);
}

// Windows Local Data Storage Path
// Packaged (.exe): %APPDATA%/ZahiIceStock/data
// Dev: Project root directory
const isPackaged = app.isPackaged;
const appDataDir = isPackaged
  ? path.join(app.getPath('userData'), 'data')
  : path.resolve(__dirname, '..');

// Ensure local directories exist on the computer
if (!fs.existsSync(appDataDir)) {
  fs.mkdirSync(appDataDir, { recursive: true });
}
const assetsDir = path.join(appDataDir, 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}
const backupsDir = path.join(appDataDir, 'backups');
if (!fs.existsSync(backupsDir)) {
  fs.mkdirSync(backupsDir, { recursive: true });
}

// Preserve existing data: If target db.json doesn't exist, migrate existing db.json
const targetDb = path.join(appDataDir, 'db.json');
if (!fs.existsSync(targetDb)) {
  const rootDb = path.join(__dirname, '..', 'db.json');
  const backupDb = path.join(__dirname, '..', 'db.backup.json');
  if (fs.existsSync(rootDb)) {
    try {
      fs.copyFileSync(rootDb, targetDb);
      console.log('[Electron] Migrated existing data to:', targetDb);
    } catch (e) {
      console.error('[Electron] Failed to migrate root db.json:', e);
    }
  } else if (fs.existsSync(backupDb)) {
    try {
      fs.copyFileSync(backupDb, targetDb);
      console.log('[Electron] Restored data from backup to:', targetDb);
    } catch (e) {
      console.error('[Electron] Failed to restore backup db.json:', e);
    }
  }
}

const PORT = process.env.PORT || 3001;
const APP_URL = `http://127.0.0.1:${PORT}`;

// Locate server.cjs inside packaged app or development mode
function getServerScriptPath() {
  const possiblePaths = [
    path.join(__dirname, '..', 'dist', 'server.cjs'),
    path.join(process.resourcesPath, 'app.asar', 'dist', 'server.cjs'),
    path.join(process.resourcesPath, 'app', 'dist', 'server.cjs'),
    path.join(app.getAppPath(), 'dist', 'server.cjs')
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }
  return possiblePaths[0];
}

function startBackendServer() {
  return new Promise((resolve) => {
    // Check if server is already running on this port
    checkServerReady(APP_URL, (alreadyRunning) => {
      if (alreadyRunning) {
        console.log(`[Electron] Local server already responding on ${APP_URL}`);
        return resolve();
      }

      const serverScript = getServerScriptPath();

      process.env.PORT = PORT.toString();
      process.env.APP_DATA_DIR = appDataDir;
      process.env.NODE_ENV = 'production';

      console.log(`[Electron] Starting server from: ${serverScript}`);

      // In packaged electron, we can run the server in-process via require or fork
      let started = false;
      try {
        if (isPackaged) {
          // Direct in-process load ensures zero external dependencies and 100% reliability
          require(serverScript);
          started = true;
          console.log('[Electron] Server loaded in-process successfully.');
        }
      } catch (err) {
        console.warn('[Electron] In-process server start failed, falling back to fork:', err);
      }

      if (!started) {
        try {
          serverProcess = fork(serverScript, [], {
            env: {
              ...process.env,
              PORT: PORT.toString(),
              APP_DATA_DIR: appDataDir,
              NODE_ENV: 'production'
            },
            stdio: 'inherit'
          });

          serverProcess.on('error', (err) => {
            console.error('[Electron] Failed to fork backend server:', err);
          });
        } catch (forkErr) {
          console.error('[Electron] Fork attempt failed:', forkErr);
        }
      }

      // Wait for server to become responsive
      waitForServer(APP_URL, 15000)
        .then(resolve)
        .catch(err => {
          console.error('[Electron] Server wait timeout:', err);
          resolve(); // Window will show error page if still unreachable
        });
    });
  });
}

function checkServerReady(url, callback) {
  let called = false;
  const done = (val) => {
    if (!called) {
      called = true;
      callback(val);
    }
  };
  const req = http.get(url, (res) => {
    res.resume();
    done(res.statusCode >= 200 && res.statusCode < 500);
  });
  req.on('error', () => done(false));
  req.setTimeout(1200, () => {
    req.destroy();
    done(false);
  });
}

function waitForServer(url, timeoutMs) {
  const startTime = Date.now();
  return new Promise((resolve, reject) => {
    const interval = setInterval(() => {
      checkServerReady(url, (ready) => {
        if (ready) {
          clearInterval(interval);
          resolve();
        } else if (Date.now() - startTime > timeoutMs) {
          clearInterval(interval);
          reject(new Error('Server start timed out'));
        }
      });
    }, 400);
  });
}

function createMainWindow() {
  const iconPath = path.join(__dirname, '..', 'public', 'zahi_logo.svg');

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'Zahi Ice Stock - Gestion Logistique & Distribution',
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    },
    show: false,
    backgroundColor: '#0f172a'
  });

  setupMenu();

  mainWindow.loadURL(APP_URL);

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.warn(`[Electron] Page failed to load: ${errorDescription} (${errorCode}). Retrying in 2 seconds...`);
    setTimeout(() => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.loadURL(APP_URL);
      }
    }, 2000);
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.maximize();
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function setupMenu() {
  const template = [
    {
      label: 'Fichier',
      submenu: [
        {
          label: 'Ouvrir le dossier des données locales',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            shell.openPath(appDataDir);
          }
        },
        {
          label: 'Sauvegarder les données maintenant',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            try {
              const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
              const backupFile = path.join(backupsDir, `backup-manuel-${timestamp}.json`);
              if (fs.existsSync(targetDb)) {
                fs.copyFileSync(targetDb, backupFile);
                dialog.showMessageBox(mainWindow, {
                  type: 'info',
                  title: 'Sauvegarde réussie',
                  message: `La sauvegarde a été créée avec succès dans:\n${backupFile}`
                });
              }
            } catch (err) {
              dialog.showErrorBox('Erreur de sauvegarde', err.message);
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Imprimer',
          accelerator: 'CmdOrCtrl+P',
          click: () => {
            if (mainWindow) mainWindow.webContents.print();
          }
        },
        { type: 'separator' },
        {
          label: 'Quitter',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Édition',
      submenu: [
        { role: 'undo', label: 'Annuler' },
        { role: 'redo', label: 'Rétablir' },
        { type: 'separator' },
        { role: 'cut', label: 'Couper' },
        { role: 'copy', label: 'Copier' },
        { role: 'paste', label: 'Coller' },
        { role: 'selectAll', label: 'Tout sélectionner' }
      ]
    },
    {
      label: 'Affichage',
      submenu: [
        { role: 'reload', label: 'Actualiser' },
        { role: 'forceReload', label: 'Actualiser (Forcé)' },
        { role: 'toggleDevTools', label: 'Outils de développement' },
        { type: 'separator' },
        { role: 'resetZoom', label: 'Taille normale' },
        { role: 'zoomIn', label: 'Zoom +' },
        { role: 'zoomOut', label: 'Zoom -' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Plein écran' }
      ]
    },
    {
      label: 'Aide & Stockage',
      submenu: [
        {
          label: 'Informations de stockage local',
          click: () => {
            let statsText = 'Fichier db.json non trouvé.';
            if (fs.existsSync(targetDb)) {
              const stat = fs.statSync(targetDb);
              statsText = `Taille : ${(stat.size / 1024).toFixed(1)} Ko\nDernière modification : ${stat.mtime.toLocaleString()}`;
            }
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'Stockage Local sur PC',
              message: `Données sauvegardées localement sur ce PC :\n\nEmplacement :\n${targetDb}\n\n${statsText}\n\nStockage 100% autonome et sécurisé.`
            });
          }
        },
        {
          label: 'À propos de Zahi Ice Stock',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'Zahi Ice Stock',
              message: 'Zahi Ice Stock - Application Windows\nVersion 1.0.0\nSystème de gestion de stock, de transport logistique et de distribution.'
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.whenReady().then(async () => {
  await startBackendServer();
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (serverProcess) {
    try {
      serverProcess.kill();
    } catch {}
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (serverProcess) {
    try {
      serverProcess.kill();
    } catch {}
  }
});
