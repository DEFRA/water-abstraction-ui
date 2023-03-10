'use strict'

const { decode } = require('html-entities')
// const htmlEntityEncoder = new Entities()

/**
 * Handle special characters e.g.
 * Convert &amp; &#39; to ampersand and single quote
 */

const htmlDecode = str => {
  return decode(str)
}

exports.htmlDecode = htmlDecode
