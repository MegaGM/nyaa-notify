const version = require('../package.json').version
import { ipcRenderer } from 'electron'
import _ from 'lodash'
import distanceInWordsStrict from 'date-fns/distance_in_words_strict'
import { fetchQuery } from '../api'
import Anime from './Anime'
const timeSince = require('./timeSince')

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
      searchQuality: ['720p'],
      availableQuality: ['1440p', '1080p', '720p', '480p'],
      searchResults: [],
      initialUpdatePercents: 0,
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

    if (this.db.currentTab)
      this.currentTab = this.db.currentTab

    this.searchQuality = this.db.searchQuality || ['720p']
    this.pagination.sortBy = 'time'

    ipcRenderer.on('update-random-anime', this.updateRandomAnime)
    ipcRenderer.on('update-sequential-anime', this.updateAllAnimeSequential)

    this.updateAnimeInitial()
  },
  filters: {
    humanizeTime(timestamp) {
      let d = new Date(timestamp)
      // return d.toDateString() + ' ' + d.toLocaleTimeString()
      return d.toLocaleString()
    },
    stripOutSubsTeamFromTitle(title) {
      return (title || '').replace(/^\[[^\]]+\] /, '')
    },
  },
  methods: {
    updateAnimeInitial() {
      let l = this.db.anime.length
      if (!l)
        return

      let
        now = (new Date()).getTime(),
        lastTimestamp = +localStorage.getItem('last-timestamp')

      // if have passed less than 2 mins since last call
      // FIXME: /10
      if (lastTimestamp && (lastTimestamp + (1000 * 60 * 2) > now))
        return

      // if have passed more
      localStorage.setItem('last-timestamp', now)
      this.initialUpdatePercents = 0
      let piece = 100 / l
      this.db.anime.forEach((animeQ, index) => {
        setTimeout(() => {
          this.updateAnime(animeQ.q)
          this.initialUpdatePercents += piece
          if (index === l - 1) {
            this.initialUpdatePercents = 0
            let notification = new NotificationFx({
              message: `<p><span class="icon"><i class="material-icons">verified_user</i></span> AnimeDB is up to date o/</p>`,
              // layout type: growl|attached|bar|other
              layout: 'growl',

              // for growl layout: scale|slide|genie|jelly
              // for attached layout: flip|bouncyflip
              // for other layout: boxspinner|cornerexpand|loadingcircle|thumbslider
              effect: 'jelly',

              // notice, warning, error, success
              // will add class ns-type-warning, ns-type-error or ns-type-success
              type: 'success', // notice, warning or error
              ttl: 2077,
              onClose: function () {
                console.info('AnimeDB is up to date o/')
                return false
              },
              onOpen: function () { return false }
            })
            notification.show()
          }
        }, ((index + 1) * 500))
      })
    },
    updateAllAnimeSequential() {
      if (!this.db.anime.length)
        return

      let i = +localStorage.getItem('last-updated-anime-index')
      if (!i && i !== 0)
        i = -1

      if (++i >= this.db.anime.length)
        i = 0

      localStorage.setItem('last-updated-anime-index', i)
      this.updateAnime(this.db.anime[i].q)
    },
    updateRandomAnime(event, data) {
      if (this.db.anime.length > 0)
        this.updateAnime(this.db.anime[this.random(0, this.db.anime.length)].q)
    },
    isTabActive(title) {
      return this.currentTab === _.findIndex(this.tabs, { title }) + ''
    },
    switchTabs() {
      setTimeout(() => {
        console.info('this.currentTab', this.currentTab)
        this.db.currentTab = this.currentTab
        this.dbSaveToHDD()
      }, 1000)
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
      ipcRenderer.sendSync('download-torrent', anime.link)
      this.markDownloaded(anime, true)
    },
    markDownloaded(anime, downloaded) {
      let
        qIndex = _.findIndex(this.db.anime, { q: anime.q }),
        aIndex = _.findIndex(this.db.anime[qIndex].items, { link: anime.link })

      anime.size = anime.size + ''
      anime.downloaded = !!downloaded
      this.db.anime[qIndex].items[aIndex] = anime
      this.dbSaveToHDD()
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

      if (this.searchQuality.length) {
        return Promise
          .map(this.searchQuality, quality => {
            let qs = this.q + ' ' + quality
            return fetchQuery(qs)
              .then(fetchedItems => fetchedItems.map(
                i => new Anime(i, {
                  q: this.q,
                  new: true,
                })))
          })
          .then(fetchedAnimeArray => {
            let searchResults = []
            fetchedAnimeArray.forEach(fetchedAnime =>
              Array.prototype.push.apply(searchResults, fetchedAnime))

            this.searchResults = searchResults
          })
      } else {
        let qs = this.q
        return fetchQuery(qs).then(fetchedItems => {
          let fetchedAnime = fetchedItems.map(i => new Anime(i, { q: qs }))
          this.searchResults = fetchedAnime
        })
      }
    },
    addAnime(e) {
      this.q = (this.q || '').toLowerCase().trim()
      /**
       * if empty search query
       */
      if (!this.q.length)
        return

      /**
       * gracefully refuse to add anime with no quality choosen
       * it
       * displays an error
       * doesn't actually add anything
       */
      if (!this.searchQuality.length) {
        let notification = new NotificationFx({
          message: `<p><span class="icon"><i class="material-icons">error_outline</i></span> Error: at least one quality options should be present</p>`,
          // layout type: growl|attached|bar|other
          layout: 'growl',

          // for growl layout: scale|slide|genie|jelly
          // for attached layout: flip|bouncyflip
          // for other layout: boxspinner|cornerexpand|loadingcircle|thumbslider
          effect: 'jelly',

          // notice, warning, error, success
          // will add class ns-type-warning, ns-type-error or ns-type-success
          type: 'error', // notice, warning or error
          ttl: 4088,
        })
        notification.show()
        return
      }

      // if such animeQ already present in db
      let qIndex = _.findIndex(this.db.anime, { q: this.q })
      if (qIndex >= 0)
        return

      let animeQ = {
        q: this.q,
        quality: this.searchQuality,
        items: [],
      }

      return Promise.map(this.searchQuality, quality => {
          return fetchQuery(this.q + ' ' + quality)
            .then(fetchedItems => {
              if (!fetchedItems.length) {
                if (fetchedItems['nyaa:seeders'])
                  fetchedItems = [fetchedItems]
                else
                  return console.error('No items are found', fetchedItems)
              }

              let fetchedAnime = fetchedItems.map(i => new Anime(i, { q: this.q, new: true }))
              Array.prototype.push.apply(animeQ.items, fetchedAnime)
            })
        })
        .then(() => {
          this.db.anime.push(animeQ)

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
        })
    },
    updateAnime(qs) {
      let
        foundIndex = _.findIndex(this.db.anime, { q: qs }),
        animeQ = this.db.anime[foundIndex]

      if (!animeQ)
        throw new Error(`no animeQ in database, while updateAnime()`)

      console.info('updateAnime() animeQ', animeQ)
      return Promise
        .map(animeQ.quality || ['720p'], quality => {
          // console.info('qs+quality', qs.replace(/480p|720p|1080p/gi, '') + ' ' + quality)

          return fetchQuery(qs.replace(/480p|720p|1080p/gi, '') + ' ' + quality)
            .then(fetchedItems => {
              const now = (new Date()).getTime()
              // TODO: show in gui

              if (!fetchedItems.length) {
                if (fetchedItems['nyaa:seeders'])
                  fetchedItems = [fetchedItems]
                else
                  return console.error('No items are found', fetchedItems)
              }

              let latest = (_.maxBy(animeQ.items, a => a.time) || { time: 0 }).time

              fetchedItems.forEach(i => {
                let a = new Anime(i, { q: qs, new: true })
                if (a.time > latest)
                  animeQ.items.push(a)

                let itemIndex = _.findIndex(animeQ.items, { link: a.link })
                if (+itemIndex > -1) {
                  animeQ.items[itemIndex].seeds = a.seeds
                  let timesince = timeSince(a.time)
                  animeQ.items[itemIndex].timesince = a.timesince || timesince
                }
              })
            })
        })
        .then(() => {
          this.db.anime[foundIndex] = animeQ
          this.dbSaveToHDD()
        })
    },
  },
  watch: {
    q(newVal, oldVal) {
      if (!newVal)
        return
      this.q = newVal.toLowerCase().trim()
    },
    searchQuality(newVal, oldVal) {
      if (newVal.length) {
        this.db.searchQuality = newVal
        this.dbSaveToHDD()
      } else {
        let notification = new NotificationFx({
          message: `<p><span class="icon"><i class="material-icons">error_outline</i></span> Error: at least one quality options should be present</p>`,
          // layout type: growl|attached|bar|other
          layout: 'growl',

          // for growl layout: scale|slide|genie|jelly
          // for attached layout: flip|bouncyflip
          // for other layout: boxspinner|cornerexpand|loadingcircle|thumbslider
          effect: 'jelly',

          // notice, warning, error, success
          // will add class ns-type-warning, ns-type-error or ns-type-success
          type: 'error', // notice, warning or error
          ttl: 4088,
        })
        notification.show()
      }
    },
  },
}
