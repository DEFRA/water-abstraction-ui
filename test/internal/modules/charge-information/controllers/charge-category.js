'use strict'

const { expect } = require('@hapi/code')
const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script()
const sinon = require('sinon')
const moment = require('moment')
const { v4: uuid } = require('uuid')
const sandbox = sinon.createSandbox()

const controller = require('../../../../../src/internal/modules/charge-information/controllers/charge-category')
const services = require('../../../../../src/internal/lib/connectors/services')
const { ROUTING_CONFIG } = require('../../../../../src/internal/modules/charge-information/lib/charge-categories/constants')

const PURPOSE_USE_ID = uuid()

const licenceId = 'test-licence-id'
const elementId = 'test-element-id'

const createRequest = ({ step }, payload = undefined) => ({
  params: {
    licenceId,
    step,
    elementId
  },
  payload: {
    csrf_token: uuid(),
    ...payload
  },
  query: {
  },
  view: {
    foo: 'bar',
    csrfToken: uuid()
  },
  pre: {
    licence: {
      id: 'test-licence-id',
      licenceNumber: '01/123',
      regionalChargeArea: { name: 'Test Region' },
      startDate: moment().subtract(2, 'years').format('YYYY-MM-DD'),
      isWaterUndertaker: true
    },
    draftChargeInformation: {
      dateRange: { startDate: '2022-04-01' },
      chargeElements: [{
        id: elementId,
        scheme: 'sroc'
      }],
      scheme: 'sroc'
    }
  },
  yar: {
    get: sandbox.stub()
  },
  setDraftChargeInformation: sandbox.stub(),
  clearDraftChargeInformation: sandbox.stub()
})

const validPayload = {
  source: { purpose: PURPOSE_USE_ID },
  description: { description: 'test-description' },
  loss: { loss: 'high' },
  isAdjustments: { isAdjustments: 'false' },
  adjustments: { adjustments: ['aggregate'], aggregateFactor: '0.5' },
  isSupportedSource: { isSupportedSource: 'true' },
  whichElement: { selectedElementIds: [uuid()] }
}

const chargeCategory = {
  billingChargeCategoryId: 'test-reference-id',
  reference: '1.0',
  shortDescription: 'test-charge-category-description'
}

const prefixUrl = `/licences/${licenceId}/charge-information`

experiment('internal/modules/charge-information/controllers/charge-category', () => {
  let request, h

  beforeEach(async () => {
    h = {
      view: sandbox.stub(),
      postRedirectGet: sandbox.stub(),
      redirect: sandbox.stub()
    }
    sandbox.stub(services.water.chargeCategories, 'getChargeCategory').resolves(chargeCategory)
  })
  afterEach(() => sandbox.restore())

  experiment('.getChargeCategporyStep', () => {
    experiment('enter a description', () => {
      beforeEach(async () => {
        request = createRequest(ROUTING_CONFIG.description)
        await controller.getChargeCategoryStep(request, h)
      })

      test('uses the correct template', async () => {
        const [template] = h.view.lastCall.args
        expect(template).to.equal('nunjucks/form')
      })

      test('sets a back link to the previous page in the flow', async () => {
        const { back } = h.view.lastCall.args[1]
        expect(back).to.equal(`${prefixUrl}/check`)
      })

      test('has the page title', async () => {
        const { pageTitle } = h.view.lastCall.args[1]
        expect(pageTitle).to.equal(ROUTING_CONFIG.description.pageTitle)
      })

      test('has a caption', async () => {
        const { caption } = h.view.lastCall.args[1]
        expect(caption).to.equal('Licence 01/123')
      })

      test('passes through request.view', async () => {
        const { foo } = h.view.lastCall.args[1]
        expect(foo).to.equal(request.view.foo)
      })

      test('defines a form object', async () => {
        const [, view] = h.view.lastCall.args
        expect(view.form).to.be.an.object()
        expect(view.form.method).to.equal('POST')
        expect(view.form.action).to.equal(`${prefixUrl}/charge-category/${elementId}/description`)
      })
    })

    experiment('when the step is description and the returnToCheckData query param is set', () => {
      beforeEach(async () => {
        request = createRequest(ROUTING_CONFIG.description)
        request.query.returnToCheckData = true
        await controller.getChargeCategoryStep(request, h)
      })

      test('the back link is to the check answers page', async () => {
        const { back } = h.view.lastCall.args[1]
        expect(back).to.equal(`${prefixUrl}/check`)
      })
    })

    experiment('when the step is isSupplyPublicWater and the supportedSourceName has not been set', () => {
      beforeEach(async () => {
        request = createRequest(ROUTING_CONFIG.isSupplyPublicWater)
        await controller.getChargeCategoryStep(request, h)
      })

      test('the back link is the supported source page', async () => {
        const { back } = h.view.lastCall.args[1]
        expect(back).to.equal(`${prefixUrl}/charge-category/${elementId}/${ROUTING_CONFIG.isSupportedSource.step}`)
      })
    })

    experiment('when the step is isSupplyPublicWater and the supportedSourceName has been set', () => {
      beforeEach(async () => {
        request = createRequest(ROUTING_CONFIG.isSupplyPublicWater)
        request.pre.draftChargeInformation.chargeElements[0].supportedSourceName = 'test-supported-source-name'
        await controller.getChargeCategoryStep(request, h)
      })

      test('the back link is the supported source name page', async () => {
        const { back } = h.view.lastCall.args[1]
        expect(back).to.equal(`${prefixUrl}/charge-category/${elementId}/${ROUTING_CONFIG.supportedSourceName.step}`)
      })
    })

    experiment('when the step is isSupplyPublicWater and isWaterUndertaker is false', () => {
      beforeEach(async () => {
        request = createRequest(ROUTING_CONFIG.isSupplyPublicWater)
        request.pre.licence.isWaterUndertaker = false
        await controller.getChargeCategoryStep(request, h)
      })

      test('we are redirected', async () => {
        const [result] = h.redirect.lastCall.args
        expect(result).to.equal(`${prefixUrl}/charge-category/${elementId}/${ROUTING_CONFIG.isAdjustments.step}`)
      })
    })

    experiment('for a step mid-way through the flow', () => {
      beforeEach(async () => {
        request = createRequest(ROUTING_CONFIG.loss)
        await controller.getChargeCategoryStep(request, h)
      })

      test('sets a back link to the previous step', async () => {
        const { back } = h.view.lastCall.args[1]
        expect(back).to.equal(`${prefixUrl}/charge-category/${elementId}/${ROUTING_CONFIG.source.step}`)
      })
    })

    experiment('.postChargeCategoryStep', () => {
      experiment('when a valid payload is posted', () => {
        beforeEach(async () => {
          request = createRequest(ROUTING_CONFIG.loss, validPayload.loss)
          await controller.postChargeCategoryStep(request, h)
        })

        test('the draft charge information is updated with the step data', async () => {
          const [id, cvWorkflowId, data] = request.setDraftChargeInformation.lastCall.args
          expect(cvWorkflowId).to.equal(undefined)
          expect(id).to.equal('test-licence-id')
          expect(data.loss).to.equal(request.pre.draftChargeInformation.loss)

          // Check element updated
          const chargeElement = data.chargeElements.find(row => row.id === elementId)
          expect(chargeElement.loss).to.equal(validPayload.loss.loss)
        })

        test('the user is redirected to the expected page', async () => {
          expect(h.redirect.calledWith(
            `${prefixUrl}/charge-category/${elementId}/${ROUTING_CONFIG.volume.step}`
          )).to.be.true()
        })
      })

      experiment('when the last charge category step in the flow is reached', () => {
        beforeEach(async () => {
          request = createRequest(ROUTING_CONFIG.adjustments, validPayload.adjustments)
          request.pre.draftChargeInformation.chargeElements[0].isAdjustments = true
          request.pre.draftChargeInformation.chargeElements = [{ id: 'test-element-id' }]
          await controller.postChargeCategoryStep(request, h)
        })

        test('the draft charge information is updated with the charge reference', async () => {
          const [id, cvWorkflowId] = request.setDraftChargeInformation.lastCall.args
          expect(cvWorkflowId).to.equal(undefined)
          expect(id).to.equal('test-licence-id')
        })

        test('the draft charge information is updated with the adjustments data', async () => {
          const mappedAdjustments = {
            aggregate: '0.5',
            charge: null,
            s126: null,
            s127: false,
            s130: false,
            winter: false
          }
          const args = request.setDraftChargeInformation.lastCall.args
          expect(args[2].chargeElements[0].adjustments).to.equal(mappedAdjustments)
        })

        test('the user is redirected to the check your answers page', async () => {
          expect(h.redirect.calledWith(
            `${prefixUrl}/check`
          )).to.be.true()
        })
      })

      experiment('when the step is isAdjustments', () => {
        beforeEach(async () => {
          validPayload.isAdjustments.isAdjustments = 'true'
          request = createRequest(ROUTING_CONFIG.isAdjustments, validPayload.isAdjustments)
          request.pre.draftChargeInformation.chargeElements = [{ id: 'test-element-id' }]
          await controller.postChargeCategoryStep(request, h)
        })

        test('the user is redirected to adjustments page if adjustments = true', async () => {
          expect(h.redirect.calledWith(
            `${prefixUrl}/charge-category/test-element-id/adjustments`
          )).to.be.true()
        })

        test('the user is redirected to the check your answers page if adjustments = false', async () => {
          validPayload.isAdjustments.isAdjustments = 'false'
          request = createRequest(ROUTING_CONFIG.isAdjustments, validPayload.isAdjustments)
          await controller.postChargeCategoryStep(request, h)
          expect(h.redirect.calledWith(
            `${prefixUrl}/check`
          )).to.be.true()
        })
      })

      experiment('when the step is whichElement', () => {
        beforeEach(async () => {
          const chargePurposes = validPayload.whichElement.selectedElementIds.map(id => ({ id }))
          request = createRequest(ROUTING_CONFIG.whichElement, validPayload.whichElement)
          request.pre.draftChargeInformation.chargeElements = [{ id: 'test-element-id', scheme: 'sroc', chargePurposes }]
          await controller.postChargeCategoryStep(request, h)
        })

        test('the user is redirected to the description', async () => {
          expect(h.redirect.calledWith(
            `${prefixUrl}/charge-category/test-element-id/description`
          )).to.be.true()
        })
      })

      experiment('when the step is isAdditionalCharges', () => {
        test('the additional charges session data is updated correctly when isAdditionalCharges is false', async () => {
          request = createRequest(ROUTING_CONFIG.isAdditionalCharges, { isAdditionalCharges: 'false' })
          await controller.postChargeCategoryStep(request, h)
          const args = request.setDraftChargeInformation.lastCall.args
          expect(args[2].chargeElements[0].isAdditionalCharges).to.equal(false)
        })

        test('the additional charges session data is updated correctly when isAdditionalCharges is true', async () => {
          request = createRequest(ROUTING_CONFIG.isAdditionalCharges, { isAdditionalCharges: 'true' })
          await controller.postChargeCategoryStep(request, h)
          const args = request.setDraftChargeInformation.lastCall.args
          expect(args[2].chargeElements[0].isAdditionalCharges).to.equal(true)
        })
      })

      experiment('when the step is isSupportedSource', () => {
        test('the supported source session data is updated correctly is isSupportedSource is false', async () => {
          request = createRequest(ROUTING_CONFIG.isSupportedSource, { isSupportedSource: 'false' })
          request.pre.draftChargeInformation.chargeElements[0].supportedSourceName = 'test name'
          await controller.postChargeCategoryStep(request, h)
          const args = request.setDraftChargeInformation.lastCall.args
          expect(args[2].chargeElements[0].isSupportedSource).to.equal(false)
          expect(args[2].chargeElements[0].supportedSourceName).to.equal(undefined)
        })

        test('the supported source session data is updated correctly is isSupportedSource is true', async () => {
          request = createRequest(ROUTING_CONFIG.isSupportedSource, { isSupportedSource: 'true' })
          request.pre.draftChargeInformation.chargeElements[0].supportedSourceName = 'test name'
          await controller.postChargeCategoryStep(request, h)
          const args = request.setDraftChargeInformation.lastCall.args
          expect(args[2].chargeElements[0].isSupportedSource).to.equal(true)
          expect(args[2].chargeElements[0].supportedSourceName).to.equal('test name')
        })
      })

      experiment('when the step is isSupportedSource and the payload isSupportedSource is false', () => {
        test('the back link is the supported source page', async () => {
          request = createRequest(ROUTING_CONFIG.isSupportedSource, { isSupportedSource: 'false' })
          await controller.postChargeCategoryStep(request, h)
          const args = h.redirect.lastCall.args
          expect(args[0]).to.equal(`${prefixUrl}/charge-category/${elementId}/${ROUTING_CONFIG.isSupplyPublicWater.step}`)
        })
      })

      experiment('when the charge category step in the flow is supportedSourceName', () => {
        const supportedSource = { id: uuid(), name: 'test-supported-source-name' }

        beforeEach(async () => {
          request = createRequest(ROUTING_CONFIG.supportedSourceName, { supportedSourceId: supportedSource.id })
          request.pre.supportedSources = [supportedSource]
          request.pre.draftChargeInformation.chargeElements = [{ id: 'test-element-id' }]
          await controller.postChargeCategoryStep(request, h)
        })

        test('the draft charge information is updated with the charge reference', async () => {
          const [id, cvWorkflowId] = request.setDraftChargeInformation.lastCall.args
          expect(cvWorkflowId).to.equal(undefined)
          expect(id).to.equal('test-licence-id')
        })

        test('the draft charge information is updated with the charge reference', async () => {
          const args = request.setDraftChargeInformation.lastCall.args
          expect(args[2].chargeElements[0].supportedSourceName).to.equal(supportedSource.name)
        })

        test('the user is redirected to the check your answers page', async () => {
          expect(h.redirect.calledWith(
            `${prefixUrl}/charge-category/${elementId}/${ROUTING_CONFIG.isSupplyPublicWater.step}`
          )).to.be.true()
        })
      })
    })

    experiment('when the redirect path is called', () => {
      let request, chargeElement, query

      beforeEach(() => {
        chargeElement = { id: elementId }
        query = { returnToCheckData: true }
        request = {
          params: { licenceId, elementId },
          pre: { draftChargeInformation: { chargeElements: [chargeElement] } },
          query
        }
      })

      experiment('and the step is isAdditionalCharges', () => {
        test('and the isAdditionalCharges flag has not been set', () => {
          const redirectPath = controller.getRedirectPath(request, 'isAdditionalCharges')
          expect(redirectPath).to.equal(`${prefixUrl}/check`)
        })

        test('and the isAdditionalCharges flag has been set', () => {
          chargeElement.isAdditionalCharges = true
          const redirectPath = controller.getRedirectPath(request, 'isAdditionalCharges')
          expect(redirectPath).to.equal(`${prefixUrl}/charge-category/${elementId}/${ROUTING_CONFIG.isSupportedSource.step}?returnToCheckData=true&additionalChargesAdded=true`)
        })
      })

      experiment('and the step is isSupportedSource', () => {
        test('and the isSupportedSource flag has not been set', () => {
          const redirectPath = controller.getRedirectPath(request, 'isSupportedSource')
          expect(redirectPath).to.equal(`${prefixUrl}/check`)
        })

        test('and the isSupportedSource flag has been set', () => {
          chargeElement.isSupportedSource = true
          const redirectPath = controller.getRedirectPath(request, 'isSupportedSource')
          expect(redirectPath).to.equal(`${prefixUrl}/charge-category/${elementId}/${ROUTING_CONFIG.supportedSourceName.step}?returnToCheckData=true`)
        })
      })

      experiment('and the step is supportedSourceName', () => {
        beforeEach(() => {
          chargeElement.supportedSourceName = 'test-supported-source-name'
        })

        test('the returnToCheckData param is passed on to supply-of-public-water route step', () => {
          request.query.additionalChargesAdded = true
          const redirectPath = controller.getRedirectPath(request, 'supportedSourceName')
          expect(redirectPath).to.equal(`${prefixUrl}/charge-category/${elementId}/${ROUTING_CONFIG.isSupplyPublicWater.step}?returnToCheckData=true`)
        })

        test('the redirect is back to check your answers', () => {
          const redirectPath = controller.getRedirectPath(request, 'supportedSourceName')
          expect(redirectPath).to.equal(`${prefixUrl}/check`)
        })
      })

      test('and the step is isSupplyPublicWater', () => {
        const redirectPath = controller.getRedirectPath(request, 'isSupplyPublicWater')
        expect(redirectPath).to.equal(`${prefixUrl}/check`)
      })

      test('and the step is volume and the returnToCheckData is set', () => {
        const redirectPath = controller.getRedirectPath(request, 'volume')
        expect(redirectPath).to.equal(`${prefixUrl}/check`)
      })
    })
  })
})
