'use strict'
const conf = require('conf')

module.exports = makeStore

function makeStore(options = {}) {
  let { name, dir } = options
  if (!name)
    name = 'nyaa-ez-database'
  if (!dir)
    dir = process.platform === 'win32' ?
    'C:/gd/nyaa' : '/new/gd/nyaa'
  /**
  * platforms in Node.js are:
  'aix'
  'darwin'
  'freebsd'
  'linux'
  'openbsd'
  'sunos'
  'win32'
  */

  let store = new(conf)({
    suffix: '',
    cwd: dir,
    configName: name,
  })

  if (!store.has('db'))
    store.set('db', {})
  if (!store.has('db.anime'))
    store.set('db.anime', [])

  return store
}
