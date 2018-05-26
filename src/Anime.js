'use strict'
const timeSince = require('./timeSince')

export default class Anime {
  constructor(o, opts) {
    this.title = o.title
    this.link = o.link
    this.time = (new Date(o.pubDate)).getTime()
    this.seeds = o['nyaa:seeders']
    this.size = o['nyaa:size']
    this.q = opts.q
    this.new = opts.new
    this.downloaded = opts.downloaded
    this.timesince = timeSince(this.time)
  }
}
