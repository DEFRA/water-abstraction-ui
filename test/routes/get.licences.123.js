'use strict'

const Lab = require('lab')
const lab = exports.lab = Lab.script()

const Code = require('code')
const DOMParser = require('xmldom').DOMParser

const server = require('../../index')
//const CookieService = require('../../src/services/cookie.service')

//let validateCookieStub

const routePath = '/licences/123'


lab.experiment('Check licences', () => {
  lab.test('The page should have a links', async () => {
    const request = {
      method: 'GET',
      url: routePath,
      headers: {},
      payload: {}
    }

    //mnot logged in redirects

    const res = await server.inject(request)
    Code.expect(res.statusCode).to.equal(302)

  })


})
