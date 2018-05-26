'use strict'
const Promise = require('bluebird')
const qualityRegex = /(.+) (480p|720p|1080p|1440p)/
const _ = require('lodash')

const
  path = require('path'),
  { exec } = require('child_process'),
  store = require('./src/makeStore')()

console.info('store.path: ', store.path)

class DBMixer {
  constructor() {
    this.db = store.get('db')
  }

  dbSaveToHDD() {
    store.set('db', this.db)
  }

  mess() {
    let
      animeHash = {},
      anime = this.db.anime

    anime.map(animeQ => {
      // console.info(animeQ.q)
      animeQ.q = animeQ.q.replace(qualityRegex, (input, q, quality) => {
        q = q.trim()
        quality = quality.trim()
        // console.info(quality, q)
        // console.info(q)
        // console.info(animeHash[q])

        if (!animeHash[q]) {
          animeHash[q] = {
            q: q,
            quality: [quality],
            items: [],
          }
        } else {
          if (!animeHash[q].quality.includes(quality))
            animeHash[q].quality.push(quality)
        }

        return q
      })
    })
    // console.info(animeHash)

    anime.map(animeQ => {
      if (!animeHash[animeQ.q]) {
        animeHash[animeQ.q] = animeQ
        return
      }

      animeQ.items.map(a => animeHash[animeQ.q].items.push(a))
    })

    this.db.anime = []
    for (let q in animeHash)
      this.db.anime.push(animeHash[q])

    console.info('DBBB: ', this.db)
    this.dbSaveToHDD()
  }

  removeDuplicates() {
    let
      anime = this.db.anime

    this.db.anime = anime.map(animeQ => {
      animeQ.items = animeQ.items.map((a, i) => {
        let
          foundIndex = _.findIndex(animeQ.items, { link: a.link }),
          duplicate = i !== foundIndex

        if (duplicate)
          console.info('duplicate: ', a.title)
        if (!duplicate)
          return a
      })
      animeQ.items = _.compact(animeQ.items)

      return animeQ
    })
    console.info(this.db.anime)

    this.dbSaveToHDD()
  }
}

const db = new DBMixer()
