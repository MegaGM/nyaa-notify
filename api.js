const
  Promise = require('bluebird'),
  fs = require('fs-extra'),
  axios = require('axios'),
  fastXmlParser = require('fast-xml-parser'),
  version = require('./package.json').version,
  headers = {
    'User-Agent': `NyaaNotify v${version}`,
  }

console.info(`NyaaNotify v${version}`)

export function fetchQuery(q) {
  let uri = 'https://nyaa.si/?f=0&c=1_2&q=' + q
  return axios.get(uri, { headers })
    .then(r => fastXmlParser.parse(r.data))
    .then(json => {
      console.info('what is data: ', json)
      return json
    })
}
