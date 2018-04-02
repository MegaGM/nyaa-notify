'use strict'

const
  path = require('path'),
  url = require('url'),
  qCycle = require('q-cycle'),
  { exec } = require('child_process'),
  { download } = require('electron-dl'),
  { app, BrowserWindow, ipcMain } = require('electron')
let
  w, // BrowserWindow
  cycle = new qCycle({ stepTime: 5, debug: false }),
  store = new(require('conf'))({
    // cwd: app.getPath('userData'),
    configName: 'database',
    suffix: '',
  })
if (!store.has('db'))
  store.set('db', {})
if (!store.has('db.anime'))
  store.set('db.anime', [])

app.commandLine.appendSwitch('ignore-gpu-blacklist')
app.on('ready', () => {
  app.makeSingleInstance(() => {})
  // require('devtron').install()
  // console.info('appData: ', app.getPath('appData'))
  // console.info('getGPUFeatureStatus: ', app.getGPUFeatureStatus())
  // console.info('userData: ', app.getPath('userData'))
  // console.info('getAppPath: ', app.getAppPath())
  // console.info('getVersion: ', app.getVersion())
  // console.info('getLocale: ', app.getLocale())
  // console.info('getAppMetrics: ', app.getAppMetrics())
  createWindow()
  ipcMain.on('download-torrent', (event, link) => {
    return download(BrowserWindow.getFocusedWindow(), link)
      .then(dl => dl.getSavePath())
      .then(torrentFile => execAsync(`./src/downloadAndOpenTorrent.sh "${torrentFile}"`))
      .then(exitCode => {
        event.returnValue = !exitCode
      })
      .catch(console.error);
  })
  cycle.setJob(updateRandomAnime)
  cycle.start()
})
app.on('window-all-closed', () => process.platform !== 'darwin' && app.quit())
app.on('activate', () => w === null && createWindow())

function updateRandomAnime() {
  w.webContents.send('update-random-anime')
}

function createWindow() {
  let wOptions = {
    center: false,
    // frame: false,
    // transparent: true,
    autoHideMenuBar: true,
    // skipTaskbar: true,
    // kiosk: true,
    // icon: 'sf',
    scrollBounce: true,
  }

  let wBounds = store.get('db.mainWindowBounds') || {
    x: void 0,
    y: void 0,
    width: 1000,
    height: 640,
  }

  w = new BrowserWindow(Object.assign(wOptions, wBounds))

  function handleBounds() {
    store.set('db.mainWindowBounds', w.getBounds())
  }
  w.on('resize', handleBounds)
  w.on('move', handleBounds)

  w.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true,
  }))

  w.once('ready-to-show', () => {
    w.show()
  })

  if (process.env.NODE_ENV && process.env.NODE_ENV.toLowerCase().startsWith('dev'))
    w.webContents.openDevTools()

  w.on('closed', () => w = null)
}

async function execAsync(command) {
  let child = exec(command)
  return new Promise((resolve, reject) => {
    let { stdout, stderr } = child
    stdout.on('data', console.info)
    stderr.on('data', console.error)
    // child.on('close', code => console.info('closing code: ' + code))
    child.addListener('error', reject)
    child.addListener('exit', resolve)
  })
}
