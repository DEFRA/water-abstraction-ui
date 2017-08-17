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
describe('VML getRoot', () => {
  it('has methods', (done) => {


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
})

describe('Functional Tests - Water Abstraction: Signin Page', () => {
  it('should load', (done) => {
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
})
describe('Functional Tests - Water Abstraction: Signin Page', () => {
  it('should login with correct credentials', (done) => {
            // make API call to self to test functionality end-to-end
    Server.inject({
      method: 'POST',
      url: '/signin',
      payload: {user_id: 'demouser', password: 'wat3r1sl1fe'}
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

  it('should not login with incorrect credentials', (done) => {
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

  it('should not login with midssing password', (done) => {
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

  it('should not login with missing user id', (done) => {
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
  it('should load', (done) => {
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
  it('should load', (done) => {
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
  it('should load', (done) => {
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
  it('should load', (done) => {
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
  it('should load', (done) => {
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
