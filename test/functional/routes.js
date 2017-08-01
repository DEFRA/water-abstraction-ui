'use strict'
// See Code API ref at https://github.com/hapijs/code/blob/HEAD/API.md

// requires for testing
const Code = require('code')

const expect = Code.expect
const Lab = require('lab')
const lab = exports.lab = Lab.script()

// use some BDD verbage instead of lab default
const describe = lab.describe
const it = lab.it
const after = lab.after

// require hapi server
const Server = require('../../index.js')

// tests
describe('Functional Tests - Server', () => {
  it('should be a HAPI server', (done) => {
        // make API call to self to test functionality end-to-end
      expect(Server).to.exist()
      expect(Server).to.be.a.object()
      expect(Server.connection).to.exist()
      expect(Server.registrations).to.be.an.object()
      expect(Server.registrations['hapi-server-session']).to.be.an.object()
      expect(Server.registrations['inert']).to.be.an.object()

      expect(Server.registrations['vision']).to.be.an.object()
      done()

  })

    after((done) => {
          // placeholder to do something post tests
      done()
    })
  })

describe('Functional Tests - Water Abstraction: Index Page', () => {
  it('should get the index page', (done) => {
        // make API call to self to test functionality end-to-end
    Server.inject({
      method: 'GET',
      url: '/'
    }, (response) => {
      expect(response).to.exist()
      expect(response).to.be.a.object()
      expect(response.payload).to.exist()
      expect(response.payload).to.be.a.string()
      expect(response.statusCode).to.exist()
      expect(response.statusCode).to.be.a.number()
      expect(response.statusCode).to.equal(200)
      done()
    })
  })

    after((done) => {
          // placeholder to do something post tests
      done()
    })
  })
  describe('Functional Tests - Water Abstraction: Signin Page', () => {

  it('should get the signin page', (done) => {
        // make API call to self to test functionality end-to-end
    Server.inject({
      method: 'GET',
      url: '/signin'
    }, (response) => {
      expect(response).to.exist()
      expect(response).to.be.a.object()
      expect(response.payload).to.exist()
      expect(response.payload).to.be.a.string()
      expect(response.statusCode).to.exist()
      expect(response.statusCode).to.be.a.number()
      expect(response.statusCode).to.equal(200)
      done()
    })
  })
  it('should login', (done) => {
            // make API call to self to test functionality end-to-end
    Server.inject({
      method: 'POST',
      url: '/signin',
      payload: {user_id: 'demouser', password: 'password'}
    }, (response) => {
      expect(response).to.exist()
      expect(response).to.be.a.object()
      expect(response.payload).to.exist()
      expect(response.payload).to.be.a.string()
      expect(response.statusCode).to.exist()
      expect(response.statusCode).to.be.a.number()
      expect(response.statusCode).to.equal(200)
      done()
    })
  })

  it('should not login', (done) => {
            // make API call to self to test functionality end-to-end
    Server.inject({
      method: 'POST',
      url: '/signin',
      payload: {user_id: 'bob', password: 'something'}
    }, (response) => {
      expect(response).to.exist()
      expect(response).to.be.a.object()
      expect(response.payload).to.exist()
      expect(response.payload).to.be.a.string()
      expect(response.statusCode).to.exist()
      expect(response.statusCode).to.be.a.number()
      expect(response.statusCode).to.equal(200)
      done()
    })
  })


  it('should NOT login', (done) => {
            // make API call to self to test functionality end-to-end
    Server.inject({
      method: 'POST',
      url: '/signin',
      payload: {user_id: 'bob'}
    }, (response) => {
      expect(response).to.exist()
      expect(response).to.be.a.object()
      expect(response.payload).to.exist()
      expect(response.payload).to.be.a.string()
      expect(response.statusCode).to.exist()
      expect(response.statusCode).to.be.a.number()
      expect(response.statusCode).to.equal(200)
      done()
    })
  })

  it('should NOT login', (done) => {
            // make API call to self to test functionality end-to-end
    Server.inject({
      method: 'POST',
      url: '/signin',
      payload: {password: 'bob'}
    }, (response) => {
      expect(response).to.exist()
      expect(response).to.be.a.object()
      expect(response.payload).to.exist()
      expect(response.payload).to.be.a.string()
      expect(response.statusCode).to.exist()
      expect(response.statusCode).to.be.a.number()
      expect(response.statusCode).to.equal(200)
      done()
    })
  })
  after((done) => {
        // placeholder to do something post tests
    done()
  })
})
describe('Functional Tests - Water Abstraction: Licences Page', () => {

  it('should get the licences page', (done) => {
            // make API call to self to test functionality end-to-end
    Server.inject({
      method: 'GET',
      url: '/licences'
    }, (response) => {
      expect(response).to.exist()
      expect(response).to.be.a.object()
      expect(response.payload).to.exist()
      expect(response.payload).to.be.a.string()
      expect(response.statusCode).to.exist()
      expect(response.statusCode).to.be.a.number()
      expect(response.statusCode).to.equal(200)
      done()
    })
  })
  after((done) => {
        // placeholder to do something post tests
    done()
  })
})
describe('Functional Tests - Water Abstraction: Licence Page', () => {

  it('should get the licence page', (done) => {
            // make API call to self to test functionality end-to-end
    Server.inject({
      method: 'GET',
      url: '/licences/1'
    }, (response) => {
      expect(response).to.exist()
      expect(response).to.be.a.object()
      expect(response.payload).to.exist()
      expect(response.payload).to.be.a.string()
      expect(response.statusCode).to.exist()
      expect(response.statusCode).to.be.a.number()
      expect(response.statusCode).to.equal(200)
      done()
    })
  })
  after((done) => {
        // placeholder to do something post tests
    done()
  })
})
describe('Functional Tests - Water Abstraction: Licence Contact Page', () => {

  it('should get the licence contact page', (done) => {
            // make API call to self to test functionality end-to-end
    Server.inject({
      method: 'GET',
      url: '/licences/1/contact'
    }, (response) => {
      expect(response).to.exist()
      expect(response).to.be.a.object()
      expect(response.payload).to.exist()
      expect(response.payload).to.be.a.string()
      expect(response.statusCode).to.exist()
      expect(response.statusCode).to.be.a.number()
      expect(response.statusCode).to.equal(200)
      done()
    })
  })
  after((done) => {
        // placeholder to do something post tests
    done()
  })
})
describe('Functional Tests - Water Abstraction: Map Page', () => {

  it('should get the licence map_of_abstraction_point page', (done) => {
            // make API call to self to test functionality end-to-end
    Server.inject({
      method: 'GET',
      url: '/licences/1/map_of_abstraction_point'
    }, (response) => {
      expect(response).to.exist()
      expect(response).to.be.a.object()
      expect(response.payload).to.exist()
      expect(response.payload).to.be.a.string()
      expect(response.statusCode).to.exist()
      expect(response.statusCode).to.be.a.number()
      expect(response.statusCode).to.equal(200)
      done()
    })
  })
  after((done) => {
        // placeholder to do something post tests
    done()
  })
})
describe('Functional Tests - Water Abstraction: Licence Terms Page', () => {

  it('should get the licence terms page', (done) => {
            // make API call to self to test functionality end-to-end
    Server.inject({
      method: 'GET',
      url: '/licences/1/terms'
    }, (response) => {
      expect(response).to.exist()
      expect(response).to.be.a.object()
      expect(response.payload).to.exist()
      expect(response.payload).to.be.a.string()
      expect(response.statusCode).to.exist()
      expect(response.statusCode).to.be.a.number()
      expect(response.statusCode).to.equal(200)
      done()
    })
  })

  after((done) => {
        // placeholder to do something post tests
    done()
  })
})

describe('Functional Tests - Water Abstraction: 404', () => {



  it('should return 404 for non existent files', (done) => {
            // make API call to self to test functionality end-to-end
    Server.inject({
      method: 'GET',
      url: '/public/this-file-0does-not-exist'
    }, (response) => {
      expect(response).to.exist()
      expect(response).to.be.a.object()
      expect(response.statusCode).to.exist()
      expect(response.statusCode).to.be.a.number()
      expect(response.statusCode).to.equal(404)
      done()
    })
  })

  after((done) => {
        // placeholder to do something post tests
    done()
  })
})
