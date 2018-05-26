const version = require('../package.json').version
import { ipcRenderer } from 'electron'
import _ from 'lodash'
import { fetchQuery } from '../api'
import Anime from './Anime'

let store = require('./makeStore')()
console.info(`NyaaNotify v${version}`)
console.info('store.path: ', store.path)
console.info('db: ', store.get('db'))
console.info('process.platform: ', process.platform)
console.info('process.env.NODE_ENV: ', process.env.NODE_ENV)

export default {
  name: 'App',
  data() {
    return {
      q: '',
      db: { anime: [] },
      currentTab: null,
      currentQuality: null,
      qualityA: ['1440p', '1080p', '720p', '480p'],
      searchResults: [],
      tabs: [
        { title: 'new' },
        { title: 'all' },
        { title: 'search' },
      ],
      pagination: {
        sortBy: 'time',
        descending: true,
        'rppi': [12, 25, { text: 'Show All', value: -1 }],
      },
    }
  },
  computed: {
    allAnime() {
      let anime = []
      this.db.anime.forEach(animeQ => animeQ.items.forEach(a => anime.push(a)))
      anime = _.orderBy(anime, ['time'], ['desc'])
      return anime
    },
    newAnime() {
      return this.allAnime.filter(a => a.new)
    },
    animeQueries() {
      return this.db.anime
    },
  },
  created() {
    this.db = store.get('db')
    if (!this.db.anime)
      this.db.anime = []
    this.currentQuality = this.db.currentQuality || '720p'
    this.pagination.sortBy = 'time'

    ipcRenderer.on('update-random-anime', this.updateRandomAnime)
    ipcRenderer.on('update-sequential-anime', this.updateSequentialAnime)
    let l = this.db.anime.length
    if (l > 0) {
      this.db.anime.forEach((animeQ, index) => {
        setTimeout(() => {
          this.updateAnime(animeQ.q)
          if (index === l - 1) {
            let notification = new NotificationFx({
              message: `<span class="icon"><i class="material-icons">verified_user</i></span>
        <p>All anime have been updated!</p>`,
              // layout type: growl|attached|bar|other
              layout: 'bar',

              // for growl layout: scale|slide|genie|jelly
              // for attached layout: flip|bouncyflip
              // for other layout: boxspinner|cornerexpand|loadingcircle|thumbslider
              effect: 'slidetop',

              // notice, warning, error, success
              // will add class ns-type-warning, ns-type-error or ns-type-success
              type: 'success', // notice, warning or error
              ttl: 1488,
              onClose: function () { return false; },
              onOpen: function () { return false; }
            })
            notification.show()
          }
        }, ((index + 1) * 1000))
      })
    }
  },
  filters: {
    humanizeTime(timestamp) {
      let d = new Date(timestamp)
      // return d.toDateString() + ' ' + d.toLocaleTimeString()
      return d.toLocaleString()
    },
  },
  methods: {
    updateSequentialAnime() {
      if (!this.db.anime.length)
        return

      if (!this.lastUpdatedAnimeIndex && this.lastUpdatedAnimeIndex !== 0)
        this.lastUpdatedAnimeIndex = -1

      {++this.lastUpdatedAnimeIndex }
      if (this.lastUpdatedAnimeIndex > this.db.anime.length)
        this.lastUpdatedAnimeIndex = 0

      this.updateAnime(this.db.anime[this.lastUpdatedAnimeIndex].q)
    },
    updateRandomAnime(event, data) {
      if (this.db.anime.length > 0)
        this.updateAnime(this.db.anime[this.random(0, 1)].q)
    },
    isTabActive(title) {
      return this.currentTab === _.findIndex(this.tabs, { title }) + ''
    },
    random(min, max) {
      return Math.floor(Math.random() * max)
    },
    getAnime(type) {
      if (type === 'queries')
        return this.animeQueries
      if (type === 'all')
        return this.allAnime
      if (type === 'new')
        return this.newAnime
      if (type === 'search')
        return this.searchResults
    },
    getAnimeTableHeaders(type) {
      let animeTableHeaders
      if (type === 'new' || type === 'all' || type === 'search') {
        animeTableHeaders = [{
            text: 'Title',
            align: 'left',
            sortable: true,
            value: 'title'
          },
          { text: 'Size', value: 'size' },
          { text: 'Date', value: 'time' },
        ]
      }

      if (type === 'queries') {
        animeTableHeaders = [{
          text: 'AnimeQuery',
          align: 'left',
          sortable: true,
          value: 'q'
        }]
      }

      if (type !== 'search') {
        animeTableHeaders.push({
          text: 'Actions',
          align: 'center',
          value: 'actions',
          sortable: false
        })
      }

      return animeTableHeaders
    },
    dev() {
      return process.env.NODE_ENV && process.env.NODE_ENV.startsWith('dev')
    },
    resetAnimeDB() {
      this.db.anime = []
      this.dbSaveToHDD()
    },
    onChangeQuality(e) {
      this.db.currentQuality = this.currentQuality
      this.dbSaveToHDD()
      this.searchAnime()
    },
    dbSaveToHDD() {
      store.set('db', this.db)
    },
    downloadAndOpenTorrent(anime) {
      const downloaded = ipcRenderer.sendSync('download-torrent', anime.link)
      if (downloaded) {
        anime.downloaded = true
        this.dbSaveToHDD()
      }
    },
    toggleMark(anime) {
      anime.new = !anime.new
      this.dbSaveToHDD()
    },
    markAll(anime) {
      anime.items.forEach(i => i.new = false)
      this.dbSaveToHDD()
    },
    removeAnime(anime) {
      console.info(anime)
      let i = _.findIndex(this.db.anime, { q: anime.q })
      this.db.anime.splice(i, 1)
      this.dbSaveToHDD()
    },
    searchAnime(e) {
      this.q = (this.q || '').toLowerCase().trim()
      if (!this.q.length)
        return
      let qs = this.q + ' ' + this.currentQuality

      return fetchQuery(qs)
        .then(fetchedItems => {
          this.searchResults = fetchedItems.map(i => new Anime(i, { q: qs }))
        })
    },
    addAnime(e) {
      this.q = (this.q || '').toLowerCase().trim()
      if (!this.q.length)
        return
      let qs = this.q + ' ' + this.currentQuality
      this.updateAnime(qs)

      let notification = new NotificationFx({
        message: `<span class="icon"><i class="material-icons">verified_user</i></span>
        <p>${this.q} has been added!</p>`,
        // layout type: growl|attached|bar|other
        layout: 'bar',

        // for growl layout: scale|slide|genie|jelly
        // for attached layout: flip|bouncyflip
        // for other layout: boxspinner|cornerexpand|loadingcircle|thumbslider
        effect: 'slidetop',

        // notice, warning, error, success
        // will add class ns-type-warning, ns-type-error or ns-type-success
        type: 'success', // notice, warning or error
        ttl: 1488,
        onClose: function () { return false; },
        onOpen: function () { return false; }
      })
      notification.show()
    },
    updateAnime(qs) {
      console.info('what is qs: ', qs)
      if (this.isTabActive('search'))
        this.searchAnime()

      return fetchQuery(qs)
        .then(fetchedItems => {
          const now = (new Date()).getTime()
          // TODO: show in gui
          if (!fetchedItems.length)
            return console.error('No items are found')

          let
            animeQ,
            foundIndex = _.findIndex(this.db.anime, { q: qs })

          if (foundIndex > -1) {
            animeQ = this.db.anime[foundIndex]
          } else {
            animeQ = {
              q: qs,
              items: fetchedItems.map(i => new Anime(i, { q: qs, new: true }))
            }
            this.db.anime.push(animeQ)
            this.dbSaveToHDD()
            foundIndex = _.findIndex(this.db.anime, { q: qs })
          }

          let latest = (_.maxBy(animeQ.items, a => a.time)).time

          fetchedItems.forEach(i => {
            let a = new Anime(i, { q: qs, new: true })
            if (a.time > latest) {
              animeQ.items.push(a)
              this.db.anime[foundIndex] = animeQ
              this.dbSaveToHDD()
            }
          })
        })
    },
  },
  watch: {
    q(newVal, oldVal) {
      if (!newVal)
        return
      this.q = newVal.toLowerCase().trim()
    },
  },
}
