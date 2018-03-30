'use strict'

const
  Promise = require('bluebird'),
  fs = require('fs-extra'),
  axios = require('axios'),
  fastXmlParser = require('fast-xml-parser')

let API = { fetchQuery }
export default API

export function fetchQuery(q) {
  let uri = 'https://nyaa.si/?f=0&c=1_2&page=rss&q=' + q
  return axios.get(uri)
    .then(r => fastXmlParser.parse(r.data))
    .then(json => {
      let items = json.rss.channel.item
      return items
    })
}
