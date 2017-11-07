'use strict'

const Lab = require('lab')
const lab = exports.lab = Lab.script()

const Code = require('code')
const DOMParser = require('xmldom').DOMParser

const server = require('../../index')
//const CookieService = require('../../src/services/cookie.service')

//let validateCookieStub

const routePath = '/reset_password_check_email'


lab.experiment('Check signout', () => {
  lab.test('The page should have a links', async () => {
    const request = {
      method: 'GET',
      url: routePath,
      headers: {},
      payload: {}
    }



    const res = await server.inject(request)
    Code.expect(res.statusCode).to.equal(200)

    const parser = new DOMParser()
    const doc = parser.parseFromString(res.payload, 'text/html')

    const elements = doc.getElementsByTagName('a')
    Code.expect(elements).to.exist()
  })


})
