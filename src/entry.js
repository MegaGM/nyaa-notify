'use strict'
console.info('Hey, Start!')

/**
 * CSS
 */
require('vuetify/dist/vuetify.min.css')

/**
 * Vue App
 */
import Vue from 'vue'
import Vuetify from 'vuetify'
import App from './App'

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

console.info('meow! ^_^')
