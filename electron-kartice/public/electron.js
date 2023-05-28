const path = require('path');

const { app, BrowserWindow,globalShortcut,webContents, ipcMain, Notification } = require('electron');
const isDev = require('electron-is-dev');;

const { dirname } = require('path');
const currentWebContents = webContents.getFocusedWebContents();
function getIconFilePath() {
  if (process.platform === 'darwin') {
    return path.join(__dirname, 'electron-app-icon-mac.icns');
  } else if (process.platform === 'win32') {
    return path.join(__dirname, 'flaschcard1.ico');
  } else {
    return path.join(__dirname, 'flaschcard1.png');
  }
}

function createWindow() {
  // Create the browser window.
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: getIconFilePath(), // or icon.icns for macOS

    webPreferences: {
     // preload: path.join(__dirname, 'preload.js'), 
      nodeIntegration: true,
      contextIsolation: false
    },
  });

  // and load the index.html of the app.
  // win.loadFile("index.html");
  win.loadURL(
    isDev
      ? 'http://localhost:3000'
      : `file://${path.join(__dirname, '../build/index.html')}`
  ); 
  
  // Open the DevTools.
  if (isDev) {
    win.webContents.openDevTools({ mode: 'detach' });
  }
  return win;
}


ipcMain.on('show-create', (event, notificationData) => {
  const { title, body } = notificationData;
  const notification = new Notification({
    title: title,
    body: body
  });
  notification.show();
});
ipcMain.on('show-delete', (event, notificationData) => {
  const { title, body } = notificationData;
  const notification = new Notification({
    title: title,
    body: body
  });
  notification.show();
});
ipcMain.on('show-update', (event, notificationData) => {
  const { title, body } = notificationData;
  const notification = new Notification({
    title: title,
    body: body
  });
  notification.show();
});
ipcMain.on('show-error', (event, notificationData) => {
  const { title, body } = notificationData;
  const notification = new Notification({
    title: title,
    body: body
  });
  notification.show();
});
ipcMain.on('show-createdeck', (event, notificationData) => {
  const { title, body } = notificationData;
  const notification = new Notification({
    title: title,
    body: body
  });
  notification.show();
});
ipcMain.on('show-updatedeck', (event, notificationData) => {
  const { title, body } = notificationData;
  const notification = new Notification({
    title: title,
    body: body
  });
  notification.show();
});
ipcMain.on('show-deletedeck', (event, notificationData) => {
  const { title, body } = notificationData;
  const notification = new Notification({
    title: title,
    body: body
  });
  notification.show();
});
ipcMain.on('show-creategroup', (event, notificationData) => {
  const { title, body } = notificationData;
  const notification = new Notification({
    title: title,
    body: body
  });
  notification.show();
});
ipcMain.on('show-adddeck', (event, notificationData) => {
  const { title, body } = notificationData;
  const notification = new Notification({
    title: title,
    body: body
  });
  notification.show();
});
ipcMain.on('show-joingroup', (event, notificationData) => {
  const { title, body } = notificationData;
  const notification = new Notification({
    title: title,
    body: body
  });
  notification.show();
});
ipcMain.on('show-leavegroup', (event, notificationData) => {
  const { title, body } = notificationData;
  const notification = new Notification({
    title: title,
    body: body
  });
  notification.show();
});
ipcMain.on('show-sync', (event, notificationData) => {
  const { title, body } = notificationData;
  const notification = new Notification({
    title: title,
    body: body
  });
  notification.show();
});
ipcMain.on('show-nosync', (event, notificationData) => {
  const { title, body } = notificationData;
  const notification = new Notification({
    title: title,
    body: body
  });
  notification.show();
});
ipcMain.on('show-login', (event, notificationData) => {
  const { title, body } = notificationData;
  const notification = new Notification({
    title: title,
    body: body
  });
  notification.show();
});
ipcMain.on('show-register', (event, notificationData) => {
  const { title, body } = notificationData;
  const notification = new Notification({
    title: title,
    body: body
  });
  notification.show();
});
ipcMain.on('show-addtolibrary', (event, notificationData) => {
  const { title, body } = notificationData;
  const notification = new Notification({
    title: title,
    body: body
  });
  notification.show();
});
ipcMain.on('show-deletefromlibrary', (event, notificationData) => {
  const { title, body } = notificationData;
  const notification = new Notification({
    title: title,
    body: body
  });
  notification.show();
});
ipcMain.on('show-statisticssaved', (event, notificationData) => {
  const { title, body } = notificationData;
  const notification = new Notification({
    title: title,
    body: body
  });
  notification.show();
});
ipcMain.on('show-deletefromgroup', (event, notificationData) => {
  const { title, body } = notificationData;
  const notification = new Notification({
    title: title,
    body: body
  });
  notification.show();
});
ipcMain.on('show-updatecreatefromgroup', (event, notificationData) => {
  const { title, body } = notificationData;
  const notification = new Notification({
    title: title,
    body: body
  });
  notification.show();
});


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(()=>{
  const win=createWindow();
  // Register a global shortcut to run a function
globalShortcut.register('CommandOrControl+O', () => {
  win.webContents.executeJavaScript('document.querySelector("#popup-box").style.display="block"')
});
globalShortcut.register('CommandOrControl+X', () => {
  win.webContents.executeJavaScript('document.querySelector("#popup-box").style.display="none"')
});
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});


