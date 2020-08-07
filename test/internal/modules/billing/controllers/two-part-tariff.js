'use strict';

const { expect } = require('@hapi/code');
const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();

const sandbox = require('sinon').createSandbox();
const uuid = require('uuid/v4');

const services = require('internal/lib/connectors/services');
const controller = require('internal/modules/billing/controllers/two-part-tariff');

const batchData = {
  id: 'test-batch-id',
  dateCreated: '2000-01-01T00:00:00.000Z',
  type: 'two-part-tariff',
  region: {
    id: 'test-region-1',
    name: 'Anglian',
    code: 'A'
  }
};

const batchLicences = [
  {
    billingInvoiceLicenceId: 'invoice-licence-id-1',
    licenceRef: 'test-licence-ref-1',
    licenceId: 'test-licence-id-1',
    licenceHolder: {
      id: 'licence-holder-2',
      initials: 'F S',
      lastName: 'surname',
      firstName: 'forename',
      salutation: null
    },
    twoPartTariffError: true,
    twoPartTariffStatuses: [10, 20, 30]
  },
  {
    billingInvoiceLicenceId: 'invoice-licence-id-2',
    licenceRef: 'test-licence-ref-2',
    licenceId: 'test-licence-id-2',
    licenceHolder: {
      id: 'licence-holder-2',
      initials: 'A B',
      lastName: 'Last',
      firstName: 'First',
      salutation: null
    },
    twoPartTariffError: true,
    twoPartTariffStatuses: [10]
  },
  {
    billingInvoiceLicenceId: 'invoice-licence-id-3',
    licenceRef: 'test-licence-ref-3',
    licenceId: 'test-licence-id-3',
    licenceHolder: {
      id: 'licence-holder-3'
    },
    twoPartTariffError: false,
    twoPartTariffStatuses: []
  },
  {
    billingInvoiceLicenceId: 'invoice-licence-id-4',
    licenceRef: 'test-licence-ref-4',
    licenceId: 'test-licence-id-4',
    licenceHolder: {
      id: 'licence-holder-4'
    },
    twoPartTariffError: false,
    twoPartTariffStatuses: [20, 30]
  }
];
const secondHeader = sandbox.stub();
const header = sandbox.stub().returns({ header: secondHeader });

const getBillingVolumeReviewRequest = payload => (
  {
    view: {
      csrfToken: '00000000-0000-0000-0000-000000000000'
    },
    pre: {
      batch: {
        id: 'test-batch-id',
        status: 'review'
      },
      licence: {
        id: 'test-licence-id',
        licenceNumber: '01/123/ABC'
      },
      billingVolume: {
        id: 'test-billing-volume-id',
        volume: 2.5,
        calculatedVolume: 3.5,
        twoPartTariffError: true,
        twoPartTariffStatus: 20,
        chargeElement: {
          id: 'test-charge-element-id',
          description: 'Test description',
          authorisedAnnualQuantity: 25.3,
          billableAnnualQuantity: 8.5,
          purposeUse: {
            id: 'test-purpose-use-id',
            name: 'Spritzing leeks'
          }
        }
      }
    },
    params: {
      batchId: 'test-batch-id',
      licenceId: 'test-licence-id',
      billingVolumeId: 'test-billing-volume-id'
    },
    payload
  }
);

experiment('internal/modules/billing/controller/two-part-tariff', () => {
  let h, request;
  h = {
    view: sandbox.stub(),
    response: sandbox.stub().returns({ header }),
    redirect: sandbox.stub()
  };

  request = {
    pre: { batch: batchData },
    params: {
      batchId: 'test-batch-id'
    }
  };

  beforeEach(async () => {
    sandbox.stub(services.water.billingBatches, 'getBatchLicences');
    sandbox.stub(services.water.billingBatches, 'approveBatchReview').resolves({ data: {
      batch: {
        id: 'test-batch-id',
        status: 'processing'
      }
    } });
    sandbox.stub(services.crm.documents, 'getWaterLicence');
    sandbox.stub(services.water.licences, 'getSummaryByDocumentId');
    sandbox.stub(services.water.billingInvoiceLicences, 'getInvoiceLicence');
    sandbox.stub(services.water.billingInvoiceLicences, 'deleteInvoiceLicence');
    sandbox.stub(services.water.billingVolumes, 'updateVolume');
    sandbox.stub(services.water.billingBatches, 'getBatchLicenceBillingVolumes');
    sandbox.stub(services.water.billingBatches, 'deleteBatchLicence');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.getTwoPartTariffReview', () => {
    beforeEach(async () => {
      services.water.billingBatches.getBatchLicences.resolves(batchLicences);
      await controller.getTwoPartTariffReview(request, h);
    });

    test('uses the correct view template', async () => {
      const [templateName] = h.view.lastCall.args;
      expect(templateName).to.equal('nunjucks/billing/two-part-tariff-review');
    });

    test('returns the correct view data objects', async () => {
      const keys = Object.keys(h.view.lastCall.args[1]);
      expect(keys).to.include(['batch', 'reviewLink', 'readyLink', 'licences', 'totals', 'back']);
    });

    test('the links are correct', async () => {
      const { readyLink, reviewLink } = h.view.lastCall.args[1];
      expect(readyLink).to.equal('/billing/batch/test-batch-id/two-part-tariff-ready');
      expect(reviewLink).to.equal('/billing/batch/test-batch-id/two-part-tariff-review');
    });

    test('returns the correct batch data to the view', async () => {
      const [, view] = h.view.lastCall.args;
      expect(view.batch.id).to.equal('test-batch-id');
      expect(view.batch.dateCreated).to.equal('2000-01-01T00:00:00.000Z');
      expect(view.batch.type).to.equal('two-part-tariff');
      expect(view.batch.region.name).to.equal('Anglian');
    });

    test('returns the 2 licences with errors to the view', async () => {
      const [, view] = h.view.lastCall.args;
      expect(view.licences).to.be.array().length(2);

      expect(view.licences[0].licenceRef).to.equal('test-licence-ref-1');
      expect(view.licences[1].licenceRef).to.equal('test-licence-ref-2');
    });

    test('maps the first licence correctly', async () => {
      const [licence] = h.view.lastCall.args[1].licences;
      expect(licence.licenceRef).to.equal('test-licence-ref-1');
      expect(licence.licenceId).to.equal('test-licence-id-1');
      expect(licence.licenceHolder).to.be.an.object();
      expect(licence.licenceHolder.salutation).to.equal(null);
      expect(licence.licenceHolder.initials).to.equal('F S');
      expect(licence.licenceHolder.firstName).to.equal('forename');
      expect(licence.licenceHolder.lastName).to.equal('surname');
      expect(licence.twoPartTariffStatuses).to.equal('Multiple errors');
      expect(licence.link).to.equal('/billing/batch/test-batch-id/two-part-tariff/licence/test-licence-id-1');
    });

    test('maps the second licence correctly', async () => {
      const [, licence] = h.view.lastCall.args[1].licences;
      expect(licence.twoPartTariffStatuses).to.equal('No returns received');
    });

    test('returns the correct totals to the view', async () => {
      const [, view] = h.view.lastCall.args;
      expect(view.totals.errors).to.equal(2);
      expect(view.totals.ready).to.equal(2);
      expect(view.totals.total).to.equal(4);
    });

    test('returns the correct back link to the view', async () => {
      const [, view] = h.view.lastCall.args;
      expect(view.back).to.equal('/billing/batch/list');
    });

    experiment('when there are no errors', () => {
      beforeEach(async () => {
        const licencesWithoutErrors = batchLicences.filter(licence => !licence.twoPartTariffError);
        services.water.billingBatches.getBatchLicences.resolves(licencesWithoutErrors);
        await controller.getTwoPartTariffReview(request, h);
      });

      test('returns ready view template', () => {
        const [templateName] = h.view.lastCall.args;
        expect(templateName).to.equal('nunjucks/billing/two-part-tariff-ready');
      });
    });
  });

  experiment('.getTwoPartTariffReady', () => {
    beforeEach(async () => {
      services.water.billingBatches.getBatchLicences.resolves(batchLicences);
      await controller.getTwoPartTariffViewReady(request, h);
    });

    test('uses the correct view template', async () => {
      const [templateName] = h.view.lastCall.args;
      expect(templateName).to.equal('nunjucks/billing/two-part-tariff-ready');
    });

    test('returns the correct view data objects', async () => {
      const keys = Object.keys(h.view.lastCall.args[1]);
      expect(keys).to.include(['batch', 'reviewLink', 'readyLink', 'licences', 'totals', 'back']);
    });

    test('the links are correct', async () => {
      const { readyLink, reviewLink } = h.view.lastCall.args[1];
      expect(readyLink).to.equal('/billing/batch/test-batch-id/two-part-tariff-ready');
      expect(reviewLink).to.equal('/billing/batch/test-batch-id/two-part-tariff-review');
    });

    test('returns the correct batch data to the view', async () => {
      const [, view] = h.view.lastCall.args;
      expect(view.batch.id).to.equal('test-batch-id');
      expect(view.batch.dateCreated).to.equal('2000-01-01T00:00:00.000Z');
      expect(view.batch.type).to.equal('two-part-tariff');
      expect(view.batch.region.name).to.equal('Anglian');
    });

    test('returns the correct licences to the view', async () => {
      const [, view] = h.view.lastCall.args;
      expect(view.licences).to.be.array().length(2);
      expect(view.licences[0].licenceRef).to.equal('test-licence-ref-3');
      expect(view.licences[1].licenceRef).to.equal('test-licence-ref-4');
    });

    test('returns the correct totals to the view', async () => {
      const [, view] = h.view.lastCall.args;
      expect(view.totals.errors).to.equal(2);
      expect(view.totals.ready).to.equal(2);
      expect(view.totals.total).to.equal(4);
    });

    test('returns the correct back link to the view', async () => {
      const [, view] = h.view.lastCall.args;
      expect(view.back).to.equal('/billing/batch/list');
    });
  });

  experiment('.getLicenceReview', () => {
    const abstractionPeriods = {
      allYear: {
        startDay: 1,
        startMonth: 1,
        endDay: 31,
        endMonth: 12
      },
      summer: {
        startDay: 1,
        startMonth: 5,
        endDay: 31,
        endMonth: 10
      }
    };

    const purposes = {
      a: {
        code: '400',
        name: 'Watering sunflowers'
      },
      b: {
        code: '401',
        name: 'Washing patios'
      }
    };

    const billingVolumes = [{
      id: uuid(),
      twoPartTariffError: true,
      twoPartTariffStatus: 20,
      chargeElement: {
        description: 'Purpose A - borehole A',
        purposeUse: purposes.a,
        abstractionPeriod: abstractionPeriods.allYear
      }
    },
    {
      id: uuid(),
      twoPartTariffError: false,
      twoPartTariffStatus: null,
      chargeElement: {
        description: 'Purpose A - borehole B',
        purposeUse: purposes.a,
        abstractionPeriod: abstractionPeriods.allYear
      }
    },
    {
      id: uuid(),
      twoPartTariffError: false,
      twoPartTariffStatus: null,
      chargeElement: {
        description: 'Purpose A - borehole c',
        purposeUse: purposes.a,
        abstractionPeriod: abstractionPeriods.summer
      }
    },
    {
      id: uuid(),
      twoPartTariffError: false,
      twoPartTariffStatus: null,
      chargeElement: {
        description: 'Purpose B - borehole d',
        purposeUse: purposes.b,
        abstractionPeriod: abstractionPeriods.summer
      }
    }];

    const request = {
      pre: {
        batch: {
          id: 'test-batch-id'
        },
        licence: {
          id: 'test-licence-id',
          licenceNumber: '01/123/ABC'
        }
      },
      params: {
        batchId: 'test-batch-id',
        licenceId: 'test-licence-id'
      },
      view: {
        foo: 'bar'
      }
    };

    beforeEach(async () => {
      services.water.billingBatches.getBatchLicenceBillingVolumes.resolves(billingVolumes);
      await controller.getLicenceReview(request, h);
    });

    test('the correct template is used', async () => {
      const [template] = h.view.lastCall.args;
      expect(template).to.equal('nunjucks/billing/two-part-tariff-licence-review');
    });

    test('the billing volumes are loaded from the water service for the current batch and selected licence', async () => {
      expect(services.water.billingBatches.getBatchLicenceBillingVolumes.calledWith(
        request.params.batchId, request.params.licenceId
      )).to.be.true();
    });

    test('the page title is set', async () => {
      const [, { pageTitle }] = h.view.lastCall.args;
      expect(pageTitle).to.equal('Review returns data issues for 01/123/ABC');
    });

    test('other params on request.view are passed through unchanged', async () => {
      const [, { foo }] = h.view.lastCall.args;
      expect(foo).to.equal('bar');
    });

    test('the batch is set', async () => {
      const [, { batch }] = h.view.lastCall.args;
      expect(batch).to.equal(request.pre.batch);
    });

    test('transactions with same purpose and abstraction period are grouped', async () => {
      const [, { billingVolumeGroups }] = h.view.lastCall.args;
      expect(billingVolumeGroups).to.be.an.array().length(3);

      const groups = billingVolumeGroups.map(group => group.map(tx => tx.chargeElement.description));

      expect(groups[0]).to.only.include(['Purpose A - borehole A', 'Purpose A - borehole B']);
      expect(groups[1]).to.only.include(['Purpose A - borehole c']);
      expect(groups[2]).to.only.include(['Purpose B - borehole d']);
    });

    test('grouped transactions have an edit link', async () => {
      const [, { billingVolumeGroups: [[{ editLink }]] }] = h.view.lastCall.args;
      const expectedLink = [
        `/billing/batch/${request.pre.batch.id}`,
        `/two-part-tariff/licence/${request.params.licenceId}`,
        `/billing-volume/${billingVolumes[0].id}`
      ].join('');
      expect(editLink).to.equal(expectedLink);
    });

    test('grouped transactions have a two-part tariff error message', async () => {
      const [, { billingVolumeGroups: [[{ error }]] }] = h.view.lastCall.args;
      expect(error).to.equal('Investigating query');
    });

    test('a back link is set', async () => {
      const [, { back }] = h.view.lastCall.args;
      expect(back).to.equal(`/billing/batch/${request.pre.batch.id}/two-part-tariff-review`);
    });
  });

  experiment('.getBillingVolumeReview', () => {
    let request;

    beforeEach(async () => {
      request = getBillingVolumeReviewRequest();
    });

    experiment('when the billingVolume is present in the request', async () => {
      beforeEach(async () => {
        services.crm.documents.getWaterLicence.resolves({
          document_id: 'test-document_id'
        });
        services.water.licences.getSummaryByDocumentId.resolves({
          data: {
            'conditions': [
              {
                'code': 'AGG',
                'subCode': 'LLL',
                'displayTitle': 'Aggregate condition link between licences',
                'parameter1Label': 'Linked licence number',
                'parameter2Label': 'Aggregate quantity',
                'points': [
                  {
                    'points': [
                      {
                        'ngr1': 'AB 111 111',
                        'ngr2': 'AB 222 222',
                        'ngr3': null,
                        'ngr4': null,
                        'name': 'Test point'
                      }
                    ],
                    'conditions': [
                      {
                        'parameter1': '01/123/ABC',
                        'parameter2': '20,000M3/YEAR',
                        'text': 'AGGREGATE QTY SHALL NOT EXCEED 20,000M3/YEAR'
                      },
                      {
                        'parameter1': '02/345/ABC',
                        'parameter2': '800M3/DAY',
                        'text': 'AGGREGATE QTY SHALL NOT EXCEED 800M3/DAY'
                      }
                    ]
                  }
                ],
                'purpose': 'Spray Irrigation - Direct'
              },
              {
                'code': 'EEL',
                'subCode': 'REGS',
                'displayTitle': 'Fish pass/screen - eel regs',
                'parameter1Label': 'Type of pass or screen',
                'parameter2Label': 'Location of pass or screen',
                'points': [
                  {
                    'points': [
                      {
                        'ngr1': 'AB 111 111',
                        'ngr2': 'AB 123 456',
                        'ngr3': null,
                        'ngr4': null,
                        'name': 'Test point'
                      }
                    ],
                    'conditions': [
                      {
                        'parameter1': null,
                        'parameter2': '2MM',
                        'text': 'SCREEN APERATURE NO LESS THAN 2MM'
                      }
                    ]
                  }
                ],
                'purpose': 'Spray Irrigation - Direct'
              }
            ]
          } });
        await controller.getBillingVolumeReview(request, h);
      });

      test('uses the correct template', async () => {
        const [template] = h.view.lastCall.args;
        expect(template).to.equal('nunjucks/billing/two-part-tariff-quantities');
      });

      test('sets an error message in the view', async () => {
        const [, { error }] = h.view.lastCall.args;
        expect(error).to.equal('Investigating query');
      });

      test('sets the invoice licence in the view', async () => {
        const [, { invoiceLicence }] = h.view.lastCall.args;
        expect(invoiceLicence).to.equal(request.pre.invoiceLicence);
      });

      test('existing properties in request.view are passed through', async () => {
        const [, { csrfToken }] = h.view.lastCall.args;
        expect(csrfToken).to.equal(request.view.csrfToken);
      });

      test('sets the page title', async () => {
        const [, { pageTitle }] = h.view.lastCall.args;
        expect(pageTitle).to.equal('Review billable quantity Test description');
      });

      test('sets a link to view returns', async () => {
        const [, { returnsLink }] = h.view.lastCall.args;
        expect(returnsLink).to.equal('/licences/test-document_id/returns');
      });

      experiment('view.aggregateConditions', () => {
        let aggregateConditions;
        beforeEach(async () => {
          aggregateConditions = h.view.lastCall.args[1].aggregateConditions;
        });

        test('have non-aggregate conditions filtered out', async () => {
          expect(aggregateConditions).to.be.an.array().length(2);
        });

        test('have a displayTitle with "Aggregate condition" removed and sentence-cased', async () => {
          expect(aggregateConditions[0].title).to.equal('Link between licences');
          expect(aggregateConditions[1].title).to.equal('Link between licences');
        });

        test('have a parameter1Label with "licence number" replaced with "licence"', async () => {
          expect(aggregateConditions[0].parameter1Label).to.equal('Linked licence');
          expect(aggregateConditions[1].parameter1Label).to.equal('Linked licence');
        });

        test('have the correct parameter1 value', async () => {
          expect(aggregateConditions[0].parameter1).to.equal('01/123/ABC');
          expect(aggregateConditions[1].parameter1).to.equal('02/345/ABC');
        });

        test('have the correct parameter2Label value', async () => {
          expect(aggregateConditions[0].parameter2Label).to.equal('Aggregate quantity');
          expect(aggregateConditions[1].parameter2Label).to.equal('Aggregate quantity');
        });

        test('have the correct parameter2 value', async () => {
          expect(aggregateConditions[0].parameter2).to.equal('20,000M3/YEAR');
          expect(aggregateConditions[1].parameter2).to.equal('800M3/DAY');
        });

        test('have the correct text', async () => {
          expect(aggregateConditions[0].text).to.equal('AGGREGATE QTY SHALL NOT EXCEED 20,000M3/YEAR');
          expect(aggregateConditions[1].text).to.equal('AGGREGATE QTY SHALL NOT EXCEED 800M3/DAY');
        });
      });

      test('has the correct billingVolume', async () => {
        const [, { billingVolume }] = h.view.lastCall.args;
        expect(billingVolume).to.equal(request.pre.billingVolume);
      });

      test('has a back link', async () => {
        const [, { back }] = h.view.lastCall.args;
        expect(back).to.equal('/billing/batch/test-batch-id/two-part-tariff/licence/test-licence-id');
      });

      experiment('view.form', () => {
        let form;
        beforeEach(async () => {
          form = h.view.lastCall.args[1].form;
        });

        test('is an object', async () => {
          expect(form).to.be.an.object();
        });

        test('is a POST form', async () => {
          expect(form.method).to.equal('POST');
        });

        test('has the correct action path', async () => {
          expect(form.action).to.equal('/billing/batch/test-batch-id/two-part-tariff/licence/test-licence-id/billing-volume/test-billing-volume-id');
        });

        test('has a CSRF token', async () => {
          const field = form.fields.find(row => row.name === 'csrf_token');
          expect(field.value).to.equal(request.view.csrfToken);
        });

        experiment('has a radio field', async () => {
          let field;
          beforeEach(async () => {
            field = form.fields.find(row => row.name === 'quantity');
          });

          test('with the correct UI widget', async () => {
            expect(field.options.widget).to.equal('radio');
          });

          test('the first radio option is the annual auth quantity', async () => {
            expect(field.options.choices[0].label).to.equal('Authorised (25.3ML)');
            expect(field.options.choices[0].value).to.equal('authorised');
          });

          test('the second radio option is for a custom quantity', async () => {
            expect(field.options.choices[1].label).to.equal('Custom (ML)');
            expect(field.options.choices[1].value).to.equal('custom');
          });

          test('the custom option has a conditionally revealed field', async () => {
            const subField = field.options.choices[1].fields[0];
            expect(subField.name).to.equal('customQuantity');
            expect(subField.options.label).to.equal('Billable quantity');
            expect(subField.options.type).to.equal('number');
            expect(subField.options.controlClass).to.equal('govuk-!-width-one-third');
            expect(subField.value).to.be.undefined();
          });
        });

        test('has a submit button', async () => {
          const submit = form.fields.find(row => row.options.widget === 'button');
          expect(submit.options.label).to.equal('Continue');
        });
      });
    });
  });
  experiment('.postBillingVolumeReview', () => {
    let request;

    experiment('when no radio button is selected', async () => {
      beforeEach(async () => {
        request = getBillingVolumeReviewRequest({
          csrf_token: '00000000-0000-0000-0000-000000000000'
        });
        await controller.postBillingVolumeReview(request, h);
      });

      test('the form is redisplayed', async () => {
        const [template] = h.view.lastCall.args;
        expect(template).to.equal('nunjucks/billing/two-part-tariff-quantities');
      });

      test('the form has an error', async () => {
        const [, { form }] = h.view.lastCall.args;
        expect(form.errors).to.equal([{
          name: 'quantity',
          message: 'Select the billable quantity',
          summary: 'Select the billable quantity'
        }]);
      });
    });

    experiment('when a custom quantity is <0', async () => {
      beforeEach(async () => {
        request = getBillingVolumeReviewRequest({
          csrf_token: '00000000-0000-0000-0000-000000000000',
          quantity: 'custom',
          customQuantity: -4.42
        });
        await controller.postBillingVolumeReview(request, h);
      });

      test('the form is redisplayed', async () => {
        const [template] = h.view.lastCall.args;
        expect(template).to.equal('nunjucks/billing/two-part-tariff-quantities');
      });

      test('the form has an error', async () => {
        const [, { form }] = h.view.lastCall.args;
        expect(form.errors).to.equal([{
          name: 'customQuantity',
          message: 'The quantity must be zero or higher',
          summary: 'The quantity must be zero or higher'
        }]);
      });
    });

    experiment('when a custom quantity is > annual authorised volume', async () => {
      beforeEach(async () => {
        request = getBillingVolumeReviewRequest({
          csrf_token: '00000000-0000-0000-0000-000000000000',
          quantity: 'custom',
          customQuantity: 100.3
        });
        await controller.postBillingVolumeReview(request, h);
      });

      test('the form is redisplayed', async () => {
        const [template] = h.view.lastCall.args;
        expect(template).to.equal('nunjucks/billing/two-part-tariff-quantities');
      });

      test('the form has an error', async () => {
        const [, { form }] = h.view.lastCall.args;
        expect(form.errors).to.equal([{
          name: 'customQuantity',
          message: 'The quantity must be the same as or less than the authorised amount',
          summary: 'The quantity must be the same as or less than the authorised amount'
        }]);
      });
    });

    experiment('when the annual authorised quantity is selected', async () => {
      beforeEach(async () => {
        request = getBillingVolumeReviewRequest({
          csrf_token: '00000000-0000-0000-0000-000000000000',
          quantity: 'authorised'
        });
        await controller.postBillingVolumeReview(request, h);
      });

      test('the user is redirected to a confirmation page', async () => {
        const [path] = h.redirect.lastCall.args;
        expect(path).to.equal('/billing/batch/test-batch-id/two-part-tariff/licence/test-licence-id/billing-volume/test-billing-volume-id/confirm?quantity=25.3');
      });
    });

    experiment('when a valid custom quantity is selected', async () => {
      beforeEach(async () => {
        request = getBillingVolumeReviewRequest({
          csrf_token: '00000000-0000-0000-0000-000000000000',
          quantity: 'custom',
          customQuantity: 12.43
        });
        await controller.postBillingVolumeReview(request, h);
      });

      test('the user is redirected to a confirmation page', async () => {
        const [path] = h.redirect.lastCall.args;
        expect(path).to.equal('/billing/batch/test-batch-id/two-part-tariff/licence/test-licence-id/billing-volume/test-billing-volume-id/confirm?quantity=12.43');
      });
    });
  });

  experiment('.getConfirmQuantity', () => {
    let request;

    beforeEach(async () => {
      request = getBillingVolumeReviewRequest();
      request.query = { quantity: 10.4 };
      await controller.getConfirmQuantity(request, h);
    });

    test('renders the correct template', async () => {
      const [template] = h.view.lastCall.args;
      expect(template).to.equal('nunjucks/billing/two-part-tariff-quantities-confirm');
    });

    test('outputs the correct page title to the view', async () => {
      const [, { pageTitle }] = h.view.lastCall.args;
      expect(pageTitle).to.equal('You are about to set the billable quantity to 10.4ML');
    });

    test('outputs the correct back link to the view', async () => {
      const [, { back }] = h.view.lastCall.args;
      expect(back).to.equal('/billing/batch/test-batch-id/two-part-tariff/licence/test-licence-id/billing-volume/test-billing-volume-id');
    });

    test('outputs the quantity to the view', async () => {
      const [, { quantity }] = h.view.lastCall.args;
      expect(quantity).to.equal(request.query.quantity);
    });

    test('outputs the licence to the view', async () => {
      const [, { licence }] = h.view.lastCall.args;
      expect(licence).to.be.an.object();
      expect(licence.id).to.equal('test-licence-id');
    });

    experiment('the form', () => {
      let form;

      beforeEach(async () => {
        form = h.view.lastCall.args[1].form;
      });

      test('is an object', async () => {
        expect(form).to.be.an.object();
      });

      test('has a hidden field for the CSRF token', async () => {
        const field = form.fields.find(field => field.name === 'csrf_token');
        expect(field.value).to.equal(request.view.csrfToken);
      });

      test('has a hidden field containing the quantity', async () => {
        const field = form.fields.find(field => field.name === 'quantity');
        expect(field.options.widget).to.equal('text');
        expect(field.options.type).to.equal('hidden');
        expect(field.value).to.equal(10.4);
      });

      test('has a continue button', async () => {
        const field = form.fields.find(field => field.options.widget === 'button');
        expect(field.options.label).to.equal('Continue');
      });
    });
  });

  experiment('.postConfirmQuantity', () => {
    let request;

    experiment('when the quantity is valid', () => {
      beforeEach(async () => {
        request = getBillingVolumeReviewRequest({
          quantity: 10.4,
          csrf_token: '00000000-0000-0000-0000-000000000000'
        });
      });

      experiment('when there are still other transactions with two-part tariff errors', () => {
        beforeEach(async () => {
          services.water.billingBatches.getBatchLicenceBillingVolumes.resolves([{
            twoPartTariffError: false
          }, {
            twoPartTariffError: true
          }]);

          await controller.postConfirmQuantity(request, h);
        });

        test('the transaction is updated', async () => {
          expect(services.water.billingVolumes.updateVolume.calledWith(
            request.params.billingVolumeId, request.payload.quantity
          )).to.be.true();
        });

        test('the user is redirected back to the licence review screen', async () => {
          expect(h.redirect.calledWith(
            '/billing/batch/test-batch-id/two-part-tariff/licence/test-licence-id'
          )).to.be.true();
        });
      });

      experiment('when all the two-part tariff errors have been resolved', () => {
        beforeEach(async () => {
          services.water.billingBatches.getBatchLicenceBillingVolumes.resolves([{
            twoPartTariffError: false
          }, {
            twoPartTariffError: false
          }]);

          await controller.postConfirmQuantity(request, h);
        });

        test('the transaction is updated', async () => {
          expect(services.water.billingVolumes.updateVolume.calledWith(
            request.params.billingVolumeId, request.payload.quantity
          )).to.be.true();
        });

        test('the user is redirected back to the licence review screen', async () => {
          expect(h.redirect.calledWith(
            '/billing/batch/test-batch-id/two-part-tariff-review'
          )).to.be.true();
        });
      });
    });

    experiment('when the quantity is invalid', async () => {
      let result;

      beforeEach(async () => {
        request = getBillingVolumeReviewRequest({
          quantity: -24,
          csrf_token: '00000000-0000-0000-0000-000000000000'
        });

        result = await controller.postConfirmQuantity(request, h);
      });

      test('the transaction is not updated', async () => {
        expect(services.water.billingVolumes.updateVolume.called).to.be.false();
      });

      test('a bad request response is returned', async () => {
        expect(result.isBoom).to.be.true();
        expect(result.output.statusCode).to.equal(400);
      });
    });
  });

  experiment('.getRemoveLicence', () => {
    let request;

    beforeEach(async () => {
      request = {
        params: {
          licenceId: 'test-licence-id'
        },
        pre: {
          batch: {
            id: 'test-batch-id'
          },
          licence: {
            id: 'test-licence-id'
          }
        },
        view: {
          crsfToken: 'test-token'
        }
      };
      await controller.getRemoveLicence(request, h);
    });

    test('the correct template is used', async () => {
      const [template] = h.view.lastCall.args;
      expect(template).to.equal('nunjucks/billing/confirm-page-with-metadata');
    });

    test('passes through data from request.view', async () => {
      const [, view] = h.view.lastCall.args;
      expect(view.csrfToken).to.equal(request.view.csrfToken);
    });

    test('passes through data from request.pre', async () => {
      const [, { batch, invoiceLicence }] = h.view.lastCall.args;
      expect(batch).to.equal(request.pre.batch);
      expect(invoiceLicence).to.equal(request.pre.invoiceLicence);
    });

    test('the form method and action is correct', async () => {
      const [, { form }] = h.view.lastCall.args;
      expect(form.method).to.equal('POST');
      expect(form.action).to.equal('/billing/batch/test-batch-id/two-part-tariff/licence/test-licence-id/remove');
    });

    test('the form has a hidden field with the CSRF token', async () => {
      const [, { form }] = h.view.lastCall.args;
      const field = form.fields.find(field => field.name === 'csrf_token');
      expect(field.value).to.equal(request.view.csrfToken);
      expect(field.options.type).to.equal('hidden');
    });

    test('the form has a button with the text "Remove licence"', async () => {
      const [, { form }] = h.view.lastCall.args;
      const field = form.fields.find(field => field.options.widget === 'button');
      expect(field.options.label).to.equal('Remove licence');
    });

    test('the page title is set correctly', async () => {
      const [, { pageTitle }] = h.view.lastCall.args;
      expect(pageTitle).to.equal('You are about to remove this licence from the bill run');
    });

    test('sets the back link correctly', async () => {
      const [, { back }] = h.view.lastCall.args;
      expect(back).to.equal(`/billing/batch/test-batch-id/two-part-tariff/licence/test-licence-id`);
    });
  });

  experiment('.postRemoveLicence', () => {
    let request;

    beforeEach(async () => {
      request = {
        params: {
          batchId: 'test-batch-id',
          licenceId: 'test-licence-id'
        }
      };
      await controller.postRemoveLicence(request, h);
    });

    test('calls the correct water API method to delete the licence from the batch', async () => {
      expect(services.water.billingBatches.deleteBatchLicence.calledWith(
        'test-batch-id', 'test-licence-id'
      )).to.be.true();
    });

    test('redirects back to the two-part tariff review page', async () => {
      expect(h.redirect.calledWith(
        `/billing/batch/test-batch-id/two-part-tariff-review`
      )).to.be.true();
    });
  });

  experiment('.getApproveReview', () => {
    let request;

    beforeEach(() => {
      request = {
        pre: { batch: { id: 'test-batch-id' } },
        view: { foo: 'bar' }
      };

      controller.getApproveReview(request, h);
    });

    test('uses the correct template', () => {
      const [template] = h.view.lastCall.args;
      expect(template).to.equal('nunjucks/billing/confirm-page-with-metadata');
    });

    test('passes the form to the view context', () => {
      const [, view] = h.view.lastCall.args;
      expect(view.form).to.be.an.object();
    });

    test('passes the correct page title to the view context', () => {
      const [, view] = h.view.lastCall.args;
      expect(view.pageTitle).to.equal('You are about to generate the two-part tariff bills');
    });

    test('passes metadata type to the view context', () => {
      const [, view] = h.view.lastCall.args;
      expect(view.metadataType).to.equal('batch');
    });

    test('passes back link to the view context', () => {
      const [, view] = h.view.lastCall.args;
      expect(view.back).to.equal(`/billing/batch/${request.pre.batch.id}/two-part-tariff-ready`);
    });
  });

  experiment('.postApproveReview', () => {
    let request;

    beforeEach(async () => {
      request = {
        params: {
          batchId: 'test-batch-id'
        }
      };
      await controller.postApproveReview(request, h);
    });

    test('calls the correct water API method to approve batch reviewzs', async () => {
      expect(services.water.billingBatches.approveBatchReview.calledWith(
        'test-batch-id'
      )).to.be.true();
    });

    test('redirects back to the waiting page', async () => {
      expect(h.redirect.calledWith(
        '/billing/batch/test-batch-id/processing?back=1'
      ));
    });
  });
});
