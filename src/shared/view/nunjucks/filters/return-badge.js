'use strict'

const { statusBadge } = require('../../../lib/returns/badge')

/**
 * Gets badge object to render for return row
 * @param  {Object}  ret    - return row
 * @return {Object}         - badge text and style
 */
const returnBadge = ret => {
  return statusBadge(ret)
}

exports.returnBadge = returnBadge
