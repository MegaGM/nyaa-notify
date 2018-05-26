'use strict'

/**
 * CSS
 */
require('vuetify/dist/vuetify.min.css')
require('./vendors/notificationFx/ns-default.css')
require('./vendors/notificationFx/ns-style-attached.css')
require('./vendors/notificationFx/ns-style-bar.css')
require('./vendors/notificationFx/ns-style-growl.css')
// require('./vendors/notificationFx/ns-style-other.css')

/**
 * JS
 */
window.Promise = require('bluebird')
// require('./vendors/notificationFx/snap.svg-min')
window.classie = require('./vendors/notificationFx/classie')
require('./vendors/notificationFx/notificationFx')

/**
 * Vue App
 */
import Vue from 'vue'
import Vuetify from 'vuetify'
import VueTimeago from 'vue-timeago'
import App from './App.vue'

Vue.use(Vuetify)

Vue.use(VueTimeago, {
  name: 'Timeago', // Component name, `Timeago` by default
  locale: undefined, // Default locale
  // locales: {
  //   'zh-CN': require('date-fns/locale/zh_cn'),
  //   'ja': require('date-fns/locale/ja'),
  // },
})

/**
 * Init 1
 */
let app = new Vue({
  el: '#app',
  data: {},
  render: h => h(App),
})

window.app = app

console.info('Meow! ^_^')
