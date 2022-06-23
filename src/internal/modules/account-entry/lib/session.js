'use strict'

const SessionSlice = require('shared/lib/SessionSlice')

const SESSION_KEY = 'accountEntryPlugin'
module.exports = new SessionSlice(SESSION_KEY)
