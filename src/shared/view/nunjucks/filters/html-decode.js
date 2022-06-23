'use strict'

const Entities = require('html-entities').AllHtmlEntities
const htmlEntityEncoder = new Entities()

/**
 * Handle special characters e.g.
 * Convert &amp; &#39; to ampersand and single quote
 */

const htmlDecode = str => {
  return htmlEntityEncoder.decode(str)
}

exports.htmlDecode = htmlDecode
