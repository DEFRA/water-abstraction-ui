const Hapi = require('@hapi/hapi')

const plugin = require('shared/plugins/no-robots')

const { expect } = require('@hapi/code')
const { experiment, test } = exports.lab = require('@hapi/lab').script()

experiment('no robots plugin', () => {
  test('/robots.txt returns the expected response', async () => {
    const server = new Hapi.Server()
    server.register({ plugin })

    const response = await server.inject('/robots.txt')

    expect(response.payload).to.equal('User-agent: * Disallow: /')
    expect(response.statusCode).to.equal(200)
  })
})
