'use strict'

const { expect } = require('@hapi/code')
const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script()
const sandbox = require('sinon').createSandbox()
const { v4: uuid } = require('uuid')

const controller = require('internal/modules/notes/controller')
const session = require('internal/modules/notes/lib/session')

const CSRF_TOKEN = uuid()
const NOTE_ID = uuid()
const VALID_TEXT = 'Some valid text'
const REDIRECT_PATH = '/redirect/path'
const BACK_PATH = '/back'

experiment('src/internal/modules/contact-entry/controller', () => {
  let request, h
  let sessionData

  beforeEach(async () => {
    sessionData = {
      caption: 'Licence 01/234',
      back: BACK_PATH,
      redirectPath: REDIRECT_PATH
    }

    request = {
      method: 'get',
      params: {
        noteId: NOTE_ID
      },
      view: {
        csrfToken: CSRF_TOKEN
      },
      pre: {
        sessionData
      },
      payload: {},
      query: {},
      yar: {
        get: sandbox.stub().returns(),
        set: sandbox.stub(),
        clear: sandbox.stub()
      }
    }

    h = {
      view: sandbox.stub(),
      redirect: sandbox.stub(),
      postRedirectGet: sandbox.stub()
    }

    sandbox.stub(session, 'merge').returns(sessionData)
    sandbox.stub(session, 'get').returns(sessionData)
  })

  afterEach(async () => {
    sandbox.restore()
  })

  experiment('.getNote', () => {
    beforeEach(async () => {
      await controller.getNote(request, h)
    })

    test('the correct template is used', async () => {
      const [template] = h.view.lastCall.args
      expect(template).to.equal('nunjucks/form')
    })
  })

  experiment('.postNote', () => {
    beforeEach(async () => {
      request.method = 'post'
      request.path = `/note/${NOTE_ID}`
    })

    experiment('when the form is invalid', () => {
      beforeEach(async () => {
        await controller.postNote(request, h)
      })

      test('the user is redirected to the get page with errors', async () => {
        expect(h.postRedirectGet.called).to.be.true()
      })
    })

    experiment('when the form is valid', () => {
      beforeEach(async () => {
        request.payload = {
          note: VALID_TEXT,
          csrf_token: CSRF_TOKEN
        }
        await controller.postNote(request, h)
      })

      test('the note text is stored in the session', async () => {
        expect(session.merge.calledWith(
          request, NOTE_ID, {
            note: VALID_TEXT
          }
        )).to.be.true()
      })

      test('redirects to the redirect path', async () => {
        expect(h.redirect.calledWith(REDIRECT_PATH)).to.be.true()
      })
    })
  })
})
