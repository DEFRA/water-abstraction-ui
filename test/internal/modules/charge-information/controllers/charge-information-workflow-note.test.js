'use strict'

const { expect } = require('@hapi/code')
const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script()
const sinon = require('sinon')

const { v4: uuid } = require('uuid')

const sandbox = sinon.createSandbox()

const controller = require('internal/modules/charge-information/controllers/charge-information-workflow-note')
const session = require('internal/modules/notes/lib/session')
const routing = require('internal/modules/charge-information/lib/routing')

const NOTE_ID = uuid()
const LICENCE_ID = uuid()
const LICENCE_NUMBER = 'test/licence'
const CHARGE_VERSION_WORKFLOW_ID = uuid()
const LICENCE = { licenceNumber: LICENCE_NUMBER }
const NOTE_TEXT = 'note text'
const USER_NAME = 'test@test.defra.gov.uk'
const DRAFT_CHARGE_INFORMATION = { status: 'review', note: { text: NOTE_TEXT } }
const REDIRECT_PATH = '/redirect/path'
const BACK_PATH = '/back'
const CAPTION = `Licence ${LICENCE_NUMBER}`

experiment('internal/modules/charge-information/controllers/charge-information-workflow-note', () => {
  let request, h
  let sessionData

  beforeEach(async () => {
    request = {
      method: 'get',
      params: {
        licenceId: LICENCE_ID,
        noteId: NOTE_ID
      },
      query: {
        chargeVersionWorkflowId: CHARGE_VERSION_WORKFLOW_ID
      },
      pre: {
        draftChargeInformation: DRAFT_CHARGE_INFORMATION,
        licence: LICENCE
      },
      defra: {
        userName: USER_NAME
      },
      setDraftChargeInformation: sandbox.fake()
    }

    h = {
      view: sandbox.stub(),
      postRedirectGet: sandbox.stub(),
      redirect: sandbox.stub()
    }

    sandbox.stub(session, 'set').returns(sessionData)
    sandbox.replace(session, 'get', () => sessionData)
    sandbox.stub(session, 'clear')

    sandbox.stub(routing, 'getNote').returns(REDIRECT_PATH)
    sandbox.stub(routing, 'postReview')
    sandbox.stub(routing, 'getCheckData')
  })
  afterEach(() => sandbox.restore())

  experiment('.getNote', () => {
    let expectedOptions

    beforeEach(async () => {
      expectedOptions = {
        caption: CAPTION,
        back: BACK_PATH,
        chargeVersionWorkflowId: CHARGE_VERSION_WORKFLOW_ID,
        hint: 'Provide a short explanation about the setup of this charge.',
        note: NOTE_TEXT,
        pageTitle: 'Add a note',
        redirectPath: `${REDIRECT_PATH}/${NOTE_ID}`,
        status: DRAFT_CHARGE_INFORMATION.status
      }

      sessionData = {
        caption: 'Licence 01/234',
        back: BACK_PATH,
        note: NOTE_TEXT
      }
    })

    test('when redirecting to the notes module', async () => {
      routing.postReview = () => BACK_PATH
      await controller.getNote(request, h)
      const { args } = session.set.lastCall
      expect(args).to.equal([request, NOTE_ID, expectedOptions])
    })

    test('when returning from the notes module', async () => {
      sessionData.redirectPath = REDIRECT_PATH
      await controller.getNote(request, h)
      const { args } = routing.getCheckData.lastCall
      expect(args).to.equal([LICENCE_ID, { chargeVersionWorkflowId: CHARGE_VERSION_WORKFLOW_ID }])
    })

    test('when returning from the notes module and status is review', async () => {
      sessionData.redirectPath = REDIRECT_PATH
      sessionData.status = 'review'
      await controller.getNote(request, h)
      const { args } = routing.postReview.lastCall
      expect(args).to.equal([CHARGE_VERSION_WORKFLOW_ID, LICENCE_ID])
    })
  })

  experiment('.deleteNote', () => {
    test('the note is set to undefined', async () => {
      await controller.deleteNote(request, h)
      const { args } = request.setDraftChargeInformation.lastCall
      expect(args).to.equal([LICENCE_ID, CHARGE_VERSION_WORKFLOW_ID, { note: undefined }])
    })
  })
})
