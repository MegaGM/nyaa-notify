'use strict'

let hwnd
const
  path = require('path'),
  url = require('url'),
  { app, BrowserWindow } = require('electron')

app.on('ready', createWindow)
app.on('window-all-closed', () => process.platform !== 'darwin' && app.quit())
app.on('activate', () => hwnd === null && createWindow())

function createWindow() {
  hwnd = new BrowserWindow({
    // frame: false,
    // transparent: true,
    autoHideMenuBar: true,
    skipTaskbar: false,
    // kiosk: true,
    // icon: 'sf',
    width: 700,
    height: 640,
  })

  hwnd.maximize()
  hwnd.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true,
  }))

  hwnd.webContents.openDevTools()

  hwnd.on('closed', () => hwnd = null)
}
console.info('MAINJS')
