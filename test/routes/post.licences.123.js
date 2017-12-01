'use strict'

const Lab = require('lab')
const lab = exports.lab = Lab.script()

const Code = require('code')
const DOMParser = require('xmldom').DOMParser

const server = require('../../index')
const user = { username : process.env.test_username}
const payload = { name : 'A new name'};

const guid = require('uuid/v1');
const routePath = `/licences/${ process.env.test_licence_id }`
const invalidPath = '/licences/123'
const notFoundPath = `/licences/${ guid() }`


lab.experiment('Update licence name', () => {
  lab.test('The page should redirect if unauthorised', async () => {
    const request = {
      method: 'POST',
      url: routePath,
      headers: {},
      payload
    }

    //not logged in redirects
    const res = await server.inject(request)
    Code.expect(res.statusCode).to.equal(302)
  })

  lab.test('The page should return 400 if licence number not GUID', async () => {
    const request = {
      method: 'POST',
      url: invalidPath,
      headers: {},
      payload,
      credentials : user
    }

    const res = await server.inject(request)
    Code.expect(res.statusCode).to.equal(400)
  })

  lab.test('The page should return 302 redirect if updated successfully', async () => {

    const request = {
      method: 'POST',
      url: routePath,
      headers: {},
      payload,
      credentials : user
    }
    const res = await server.inject(request)
    Code.expect(res.statusCode).to.equal(302)

  })

  lab.test('The page should return 404 if licence not found for user', async () => {

    const request = {
      method: 'POST',
      url: notFoundPath,
      headers: {},
      payload,
      credentials : user
    }
    const res = await server.inject(request)
    Code.expect(res.statusCode).to.equal(404)

  })

})
