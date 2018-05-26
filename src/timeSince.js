'use strict '

module.exports = timeSince

function timeSince(date) {

  let
    seconds = Math.floor((new Date() - date) / 1000),
    interval = Math.floor(seconds / 31536000),
    phrase = ''

  if (interval > 1)
    phrase += interval + ' years '

  interval = Math.floor(seconds / 2592000)
  if (interval > 1)
    phrase += interval + ' months '

  interval = Math.floor(seconds / 86400)
  if (interval > 1)
    phrase += interval + ' days '

  interval = Math.floor(seconds / 3600)
  if (interval > 1)
    phrase += interval + ' hours '

  interval = Math.floor(seconds / 60)
  if (interval > 1)
    phrase += interval + ' minutes '

  phrase += Math.floor(seconds) + ' seconds'
  return phrase
}
