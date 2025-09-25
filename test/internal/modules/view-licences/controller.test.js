const { expect } = require('@hapi/code')
const {
  experiment,
  test,
  beforeEach,
  after,
  before
} = exports.lab = require('@hapi/lab').script()

const moment = require('moment')
const sandbox = require('sinon').createSandbox()
const { v4: uuid } = require('uuid')

const controller = require('internal/modules/view-licences/controller')
const services = require('internal/lib/connectors/services')
const { scope } = require('internal/lib/constants')

const config = require('../../../../src/internal/config.js')

experiment('internal/modules/billing/controllers/bills-tab', () => {
  let request, h

  const licenceId = uuid()
  const documentId = uuid()

  before(async () => {
    h = {
      view: sandbox.stub(),
      response: sandbox.stub().returns(),
      redirect: sandbox.stub()
    }
    sandbox.stub(services.system.returns, 'supplementary').resolves()
    sandbox.stub(services.water.licences, 'getDocumentByLicenceId').resolves({
      metadata: {},
      system_external_id: 'test id'
    })
    sandbox.stub(services.crm.documentRoles, 'getDocumentRolesByDocumentRef').resolves({ data: [] })
  })

  after(async () => {
    sandbox.restore()
  })

  experiment('.getLicenceSummary', () => {
    beforeEach(() => {
      sandbox.stub(config.featureToggles, 'enableSystemReturnsView').value(false)

      request = {
        auth: {
          credentials: {
            scope: [
              scope.returns,
              scope.billing,
              scope.manageAgreements,
              scope.viewChargeVersions,
              scope.chargeVersionWorkflowEditor,
              scope.chargeVersionWorkflowReviewer
            ]
          }
        },
        params: {
          licenceId
        },
        pre: {
          gaugingStations: { data: [] },
          licence: {
            id: licenceId,
            licenceNumber: '01/123',
            startDate: '3000-01-01',
            isFutureDated: true
          },
          document: {
            document_id: documentId
          },
          chargeVersions: {
            data: [{
              id: 'test-charge-version-1',
              dateRange: {
                startDate: '2019-01-01'
              }
            }, {
              id: 'test-charge-version-2',
              dateRange: {
                startDate: '2020-01-01'
              },
              versionNumber: 1
            }, {
              id: 'test-charge-version-3',
              dateRange: {
                startDate: '2020-01-01'
              },
              versionNumber: 2
            }]
          },
          chargeVersionWorkflows: {
            data: [{
              id: 'test-charge-version-workflow-1'
            }]
          },
          agreements: [{
            id: uuid(),
            agreement: {
              code: 'S127'
            },
            dateRange: {
              startDate: '2020-01-01',
              endDate: null
            }
          }],
          returns: {
            data: [{
              id: 'test-return-id-1',
              status: 'due',
              endDate: '2021-03-31'
            }, {
              id: 'test-return-id-2',
              status: 'completed',
              endDate: '2021-03-31'
            }]
          }
        }
      }
    })

    test('uses the correct nunjucks template', async () => {
      await controller.getLicenceSummary(request, h)

      const [template] = h.view.lastCall.args
      expect(template).to.equal('nunjucks/view-licences/licence.njk')
    })

    test('calls the CRM to grab contact details', async () => {
      await controller.getLicenceSummary(request, h)

      expect(services.crm.documentRoles.getDocumentRolesByDocumentRef.called).to.be.true()
    })

    test('sets the correct page title in the view', async () => {
      await controller.getLicenceSummary(request, h)

      const [, { pageTitle }] = h.view.lastCall.args
      expect(pageTitle).to.equal('Licence 01/123')
    })

    test('includes the featureToggles config property', async () => {
      await controller.getLicenceSummary(request, h)

      const [, { featureToggles }] = h.view.lastCall.args
      expect(featureToggles).to.be.an.object()
    })

    test('includes the featureToggles config property', async () => {
      await controller.getLicenceSummary(request, h)

      const [, { featureToggles }] = h.view.lastCall.args
      expect(featureToggles).to.be.an.object()
    })

    test('includes the licenceId', async () => {
      await controller.getLicenceSummary(request, h)

      const [, view] = h.view.lastCall.args
      expect(view.licenceId).to.equal(licenceId)
    })

    test('includes the documentId', async () => {
      await controller.getLicenceSummary(request, h)

      const [, view] = h.view.lastCall.args
      expect(view.documentId).to.equal(documentId)
    })

    test('maps the gauging stations', async () => {
      await controller.getLicenceSummary(request, h)

      const [, { gaugingStationsData }] = h.view.lastCall.args
      expect(gaugingStationsData).to.equal([])
    })

    test('includes the licence, bills, notifications, primaryUser and summary from request.pre', async () => {
      await controller.getLicenceSummary(request, h)

      const [, view] = h.view.lastCall.args
      expect(view.licence).to.equal(request.pre.licence)
      expect(view.bills).to.equal(request.pre.bills)
      expect(view.notifications).to.equal(request.pre.notifications)
      expect(view.primaryUser).to.equal(request.pre.primaryUser)
      expect(view.summary).to.equal(request.pre.summary)
    })

    test('maps the charge versions, sorted by workflows then by data and version number', async () => {
      await controller.getLicenceSummary(request, h)

      const [, { chargeVersions }] = h.view.lastCall.args
      const ids = chargeVersions.map(row => row.id)
      expect(ids).to.equal([
        'test-charge-version-workflow-1',
        'test-charge-version-3',
        'test-charge-version-2',
        'test-charge-version-1'
      ])
    })

    test('maps the agreements, including a human-readable description', async () => {
      await controller.getLicenceSummary(request, h)

      const [, { agreements }] = h.view.lastCall.args
      expect(agreements).to.be.an.array().length(1)
      expect(agreements[0].agreement.description).to.equal('Two-part tariff')
    })

    test('maps the returns to include a view/edit link', async () => {
      await controller.getLicenceSummary(request, h)

      const [, { returns }] = h.view.lastCall.args
      expect(returns.data).to.equal([
        {
          id: 'test-return-id-1',
          status: 'due',
          endDate: '2021-03-31',
          badge: { text: 'open', status: 'todo' },
          path: '/return/internal?returnId=test-return-id-1',
          isEdit: true
        },
        {
          id: 'test-return-id-2',
          status: 'completed',
          endDate: '2021-03-31',
          badge: { text: 'complete', status: 'success' },
          path: '/returns/return?id=test-return-id-2',
          isEdit: false
        }
      ])
    })

    test('includes links', async () => {
      await controller.getLicenceSummary(request, h)

      const [, { links }] = h.view.lastCall.args
      expect(links.bills).to.equal(`/licences/${licenceId}/bills`)
      expect(links.returns).to.equal(`/licences/${documentId}/returns`)
      expect(links.addAgreement).to.equal(`/licences/${licenceId}/agreements/select-type`)
    })

    test('includes validity message', async () => {
      await controller.getLicenceSummary(request, h)

      const [, { validityMessage }] = h.view.lastCall.args
      expect(validityMessage).to.equal('This licence starts on 1 January 3000')
    })

    test('includes a back link', async () => {
      await controller.getLicenceSummary(request, h)

      const [, { back }] = h.view.lastCall.args
      expect(back).to.equal('/licences')
    })

    experiment('when the licence is not marked for supplementary billing', () => {
      test('does not include a marked for supplementary billing message', async () => {
        await controller.getLicenceSummary(request, h)

        const [, { includeInSupplementaryBillingMessage }] = h.view.lastCall.args
        expect(includeInSupplementaryBillingMessage).to.be.null()
      })
    })

    experiment('when the licence is marked for supplementary billing', () => {
      experiment('for the old (presroc) charge scheme', () => {
        beforeEach(() => {
          request.pre.licence.includeInSupplementaryBilling = 'yes'
        })

        test('includes the right marked for supplementary billing message', async () => {
          await controller.getLicenceSummary(request, h)

          const [, { includeInSupplementaryBillingMessage }] = h.view.lastCall.args
          expect(includeInSupplementaryBillingMessage).to.equal(
            'This licence has been marked for the next supplementary bill run for the old charge scheme.'
          )
        })
      })

      experiment('for the current (sroc) charge scheme', () => {
        beforeEach(() => {
          request.pre.licence.includeInSrocSupplementaryBilling = true
        })

        test('includes the right marked for supplementary billing message', async () => {
          await controller.getLicenceSummary(request, h)

          const [, { includeInSupplementaryBillingMessage }] = h.view.lastCall.args
          expect(includeInSupplementaryBillingMessage).to.equal(
            'This licence has been marked for the next supplementary bill run.'
          )
        })
      })

      experiment('for both (sroc & presroc) charge schemes', () => {
        beforeEach(() => {
          request.pre.licence.includeInSupplementaryBilling = 'yes'
          request.pre.licence.includeInSrocSupplementaryBilling = true
        })

        test('includes the right marked for supplementary billing message', async () => {
          await controller.getLicenceSummary(request, h)

          const [, { includeInSupplementaryBillingMessage }] = h.view.lastCall.args
          expect(includeInSupplementaryBillingMessage).to.equal(
            'This licence has been marked for the next supplementary bill runs for the current and old charge schemes.'
          )
        })
      })
    })

    experiment('when the licence has ended less than 6 years ago', () => {
      beforeEach(() => {
        request.pre.licence.endDate = moment().add(-5, 'years').format('YYYY-MM-DD')
      })

      test('links to manage charge versions and agreements are omitted', async () => {
        await controller.getLicenceSummary(request, h)

        const [, { links }] = h.view.lastCall.args
        expect(links.setupCharge).to.equal(`/licences/${licenceId}/charge-information/create`)
        expect(links.makeNonChargeable).to.equal(`/licences/${licenceId}/charge-information/non-chargeable-reason?start=1`)
        expect(links.addAgreement).to.equal(`/licences/${licenceId}/agreements/select-type`)
      })
    })

    experiment('when the licence has ended more than 6 years ago', () => {
      beforeEach(() => {
        request.pre.licence.endDate = moment().add(-7, 'years').format('YYYY-MM-DD')
      })

      test('createChargeVersions flag is false', async () => {
        await controller.getLicenceSummary(request, h)

        const [, { links }] = h.view.lastCall.args
        expect(links.setupCharge).to.be.false()
        expect(links.makeNonChargeable).to.be.false()
        expect(links.addAgreement).to.be.false()
      })
    })
  })

  experiment('.getBillsForLicence', () => {
    const tempLicenceId = uuid()
    const request = {
      view: {},
      params: {
        licenceId: tempLicenceId
      },
      pre: {
        document: {
          metadata: {
            Name: 'test-name'
          }
        },
        bills: []
      },
      query: {
        page: 1
      }
    }
    beforeEach(async () => {
      await controller.getBillsForLicence(request, h)
    })

    test('returns the correct view data objects', async () => {
      const keys = Object.keys(h.view.lastCall.args[1])

      expect(keys).to.include([
        'pageTitle',
        'caption',
        'tableCaption',
        'bills',
        'pagination',
        'licenceId',
        'back'])
    })
  })

  experiment('.getMarkLicenceForSupplementaryBilling', () => {
    const tempLicenceId = uuid()
    const request = {
      view: {},
      method: 'get',
      params: {
        licenceId: tempLicenceId
      },
      query: {
        returnId: 'some-return-id'
      },
      pre: {
        document: {
          system_external_id: '10/10/10'
        }
      },
      yar: { get: sandbox.spy() }
    }
    beforeEach(async () => {
      await controller.getMarkLicenceForSupplementaryBilling(request, h)
    })

    test('returns the correct view data objects', async () => {
      const keys = Object.keys(h.view.lastCall.args[1])

      expect(keys).to.include([
        'pageTitle',
        'caption',
        'form',
        'back'])
    })
  })

  experiment('.postMarkLicenceForSupplementaryBilling', () => {
    experiment('when passed a returnId', () => {
      const tempLicenceId = uuid()
      const tempReturnId = uuid()
      const request = {
        view: {},
        method: 'get',
        params: {
          licenceId: tempLicenceId
        },
        payload: {
          returnId: tempReturnId
        },
        pre: {
          document: {
            system_external_id: '10/10/10'
          }
        },
        yar: { get: sandbox.spy() }
      }

      beforeEach(async () => {
        await controller.postMarkLicenceForSupplementaryBilling(request, h)
      })

      test('calls system with the returnId', () => {
        expect(services.system.returns.supplementary.calledWith(tempReturnId)).to.be.true()
      })
    })

    experiment('when not passed a returnId', () => {
      const tempLicenceId = uuid()
      const request = {
        view: {},
        method: 'get',
        params: {
          licenceId: tempLicenceId
        },
        payload: {},
        pre: {
          document: {
            system_external_id: '10/10/10'
          }
        },
        yar: { get: sandbox.spy() }
      }

      beforeEach(async () => {
        await controller.postMarkLicenceForSupplementaryBilling(request, h)
      })

      test('returns the correct view data objects', async () => {
        const keys = Object.keys(h.view.lastCall.args[1])

        expect(keys).to.include([
          'pageTitle',
          'panelText',
          'licenceId'])
      })
    })
  })
})
