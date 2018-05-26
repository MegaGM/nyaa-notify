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
// require('./vendors/notificationFx/snap.svg-min')
window.classie = require('./vendors/notificationFx/classie')
require('./vendors/notificationFx/notificationFx')

/**
 * Vue App
 */
import Vue from 'vue'
import Vuetify from 'vuetify'
import App from './App.vue'

Vue.use(Vuetify)
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
