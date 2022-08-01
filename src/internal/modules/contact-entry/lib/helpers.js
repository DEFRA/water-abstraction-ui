'use strict'

const { get } = require('lodash')
const session = require('../lib/session')

const getContactFromSession = request =>
  get(session.get(request, request.params.key), 'data', {})

exports.getContactFromSession = getContactFromSession
