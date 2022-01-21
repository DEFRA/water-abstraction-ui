'use strict';

const { expect } = require('@hapi/code');
const {
  beforeEach,
  afterEach,
  experiment,
  test
} = exports.lab = require('@hapi/lab').script();

const { cloneDeep } = require('lodash');
const { v4: uuid } = require('uuid');

const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const controller = require('internal/modules/returns-notifications/controllers/paper-forms');
const services = require('internal/lib/connectors/services');
const helpers = require('../helpers');
const controllerLib = require('internal/modules/returns-notifications/lib/controller');

const DOCUMENT_ID = uuid();
const LICENCE_NUMBER = '01/123/ABC';

const apiResponse = [{
  licence: {
    id: '00000000-0000-0000-0000-000000000001',
    licenceNumber: LICENCE_NUMBER,
    isWaterUndertaker: false,
    startDate: '2020-01-01',
    expiredDate: null,
    lapsedDate: null,
    revokedDate: null,
    historicalArea: {
      type: 'EAAR',
      code: 'ARNA'
    },
    regionalChargeArea: {
      type: 'regionalChargeArea',
      name: 'Anglian'
    },
    region: {
      type: 'region',
      id: '00000000-0000-0000-0000-000000000002',
      name: 'Anglian',
      code: 'A',
      numericCode: 1,
      displayName: 'Anglian'
    },
    endDate: null
  },
  documents: [
    {
      document: {
        id: DOCUMENT_ID,
        roles: [
          helpers.createRole()
        ]
      },

      returns: [
        helpers.createReturn()
      ]
    }
  ]
}];

const createState = () => ({
  [DOCUMENT_ID]: {
    id: DOCUMENT_ID,
    selectedRole: 'licenceHolder',
    isSelected: true,
    document: {
      id: DOCUMENT_ID,
      roles: [
        helpers.createRole()
      ]
    },
    licence: {
      licenceNumber: '01/123/ABC'
    },
    returns: [{
      ...helpers.createReturn({ id: 'v1:1:01/123/ABC:1234:2018-04-01:2019-03-31' }),
      isSelected: false
    }, {
      ...helpers.createReturn({ id: 'v1:1:01/123/ABC:1234:2019-04-01:2020-03-31' }),
      isSelected: true
    }]
  }
});

experiment('internal/modules/returns-notifications/controllers/paper-forms', () => {
  let request;
  let h;

  beforeEach(async () => {
    request = {
      view: {
        csrfToken: '00000000-0000-0000-0000-000000000000'
      },
      yar: {
        set: sandbox.stub(),
        get: sandbox.stub(),
        clear: sandbox.stub()
      },
      payload: {
        csrf_token: '00000000-0000-0000-0000-000000000000'
      },
      pre: {},
      defra: {
        userName: 'mail@example.com'
      },
      params: {},
      query: {},
      getNewAddress: sandbox.stub()
    };

    h = {
      view: sandbox.spy(),
      postRedirectGet: sandbox.stub(),
      redirect: sandbox.stub()
    };

    sandbox.stub(services.water.returns, 'getIncompleteReturns');
    sandbox.stub(services.water.batchNotifications, 'preparePaperReturnForms').resolves({
      data: {
        id: 'test-event-id'
      }
    });
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.getEnterLicenceNumber', () => {
    beforeEach(async () => {
      request.path = '/returns-notifications/forms';
      await controller.getEnterLicenceNumber(request, h);
    });

    test('uses the correct template', async () => {
      const [template] = h.view.lastCall.args;
      expect(template).to.equal('nunjucks/returns-notifications/licence-numbers');
    });

    test('the back link is to the manage tab', async () => {
      const [, { back }] = h.view.lastCall.args;
      expect(back).to.equal('/manage');
    });

    test('defines a form object', async () => {
      const [, { form }] = h.view.lastCall.args;
      expect(form).to.be.an.object();
    });

    test('the form has a POST method', async () => {
      const [, { form }] = h.view.lastCall.args;
      expect(form.method).to.equal('POST');
    });

    test('the form action is /returns-notifications/forms', async () => {
      const [, { form }] = h.view.lastCall.args;
      expect(form.action).to.equal('/returns-notifications/forms');
    });

    test('the form has a text field with the correct properties', async () => {
      const [, { form }] = h.view.lastCall.args;
      const field = form.fields.find(field => field.name === 'licenceNumbers');
      expect(field.options.label).to.equal('Enter a licence number');
      expect(field.options.hint).to.equal('You can enter more than one licence. You can separate licence numbers using spaces, commas, or by entering them on different lines.');
      expect(field.options.heading).to.be.true();
    });

    test('The session data is cleared', async () => {
      expect(request.yar.clear.called).to.be.true();
    });
  });

  experiment('.postEnterLicenceNumber', () => {
    experiment('when the form has validation errors', () => {
      beforeEach(async () => {
        request.payload.licenceNumbers = '';
        await controller.postEnterLicenceNumber(request, h);
      });

      test('the water service api is not called', async () => {
        expect(services.water.returns.getIncompleteReturns.called).to.be.false();
      });

      test('the user is redirected to view the form in an error state', async () => {
        const [form] = h.postRedirectGet.lastCall.args;
        expect(form.errors[0].message).to.equal('Enter a licence number or licence numbers');
      });
    });

    experiment('when one of the licence numbers is not found via the api call', () => {
      beforeEach(async () => {
        request.payload.licenceNumbers = '01/123/ABC,02/456/BCD';
        const err = new Error();
        err.statusCode = 404;
        err.error = {
          validationDetails: {
            licenceNumbers: ['01/123/ABC']
          }
        };
        services.water.returns.getIncompleteReturns.throws(err);
        await controller.postEnterLicenceNumber(request, h);
      });

      test('the water service api is called with the licence numbers', async () => {
        expect(services.water.returns.getIncompleteReturns.calledWith(
          ['01/123/ABC', '02/456/BCD']
        )).to.be.true();
      });

      test('nothing is stored in the session', async () => {
        expect(request.yar.set.called).to.be.false();
      });

      test('the user is redirected to view the form in an error state', async () => {
        const [form] = h.postRedirectGet.lastCall.args;
        expect(form.errors[0].summary).to.equal('The licence number 01/123/ABC could not be found');
        expect(form.errors[0].message).to.equal('Enter a real licence number');
      });
    });

    experiment('when two or more of the licence numbers is not found via the api call', () => {
      beforeEach(async () => {
        request.payload.licenceNumbers = '01/123/ABC,02/456/BCD';
        const err = new Error();
        err.statusCode = 404;
        err.error = {
          validationDetails: {
            licenceNumbers: ['01/123/ABC', '02/456/BCD']
          }
        };
        services.water.returns.getIncompleteReturns.throws(err);
        await controller.postEnterLicenceNumber(request, h);
      });

      test('the water service api is called with the licence numbers', async () => {
        expect(services.water.returns.getIncompleteReturns.calledWith(
          ['01/123/ABC', '02/456/BCD']
        )).to.be.true();
      });

      test('nothing is stored in the session', async () => {
        expect(request.yar.set.called).to.be.false();
      });

      test('the user is redirected to view the form in an error state', async () => {
        const [form] = h.postRedirectGet.lastCall.args;
        expect(form.errors[0].summary).to.equal('The licence numbers 01/123/ABC, 02/456/BCD could not be found');
        expect(form.errors[0].message).to.equal('Enter a real licence number');
      });
    });

    experiment('when all of the licences has no returns due', () => {
      beforeEach(async () => {
        request.payload.licenceNumbers = '01/123/ABC,02/456/BCD';
        const data = apiResponse.documents = [];
        services.water.returns.getIncompleteReturns.resolves(data);
        await controller.postEnterLicenceNumber(request, h);
      });

      test('the licence numbers are stored in the session', () => {
        expect(request.yar.set.called).to.be.true();
      });

      test('the user is redirected to enter licences form with the correct query params', () => {
        const data = h.redirect.lastCall.args;
        expect(data[0]).to.equal('/returns-notifications/forms');
      });
    });

    experiment('when a single requested licence is found', () => {
      beforeEach(async () => {
        request.payload.licenceNumbers = '01/123/ABC';
        services.water.returns.getIncompleteReturns.resolves(apiResponse);
        await controller.postEnterLicenceNumber(request, h);
      });

      test('the water service api is called with the licence numbers', async () => {
        expect(services.water.returns.getIncompleteReturns.calledWith(
          ['01/123/ABC']
        )).to.be.true();
      });

      test('the session is updated', async () => {
        expect(request.yar.set.called).to.be.true();
      });

      test('the user is redirected to the "check answers" page', async () => {
        expect(h.redirect.calledWith('/returns-notifications/check-answers')).to.be.true();
      });
    });

    experiment('when some of the licences have multiple documents', () => {
      beforeEach(async () => {
        const apiResponseWithMultipleDocuments = cloneDeep(apiResponse);
        apiResponseWithMultipleDocuments[0].documents.push(
          apiResponseWithMultipleDocuments[0].documents[0]
        );
        request.payload.licenceNumbers = '01/123/ABC';
        services.water.returns.getIncompleteReturns.resolves(apiResponseWithMultipleDocuments);
        await controller.postEnterLicenceNumber(request, h);
      });

      test('the user is redirected to the "select licence holders" page', async () => {
        expect(h.redirect.calledWith('/returns-notifications/select-licence-holders')).to.be.true();
      });
    });
  });

  experiment('.getCheckAnswers', () => {
    experiment('when the documents are selected', () => {
      beforeEach(async () => {
        request.pre.state = createState();
        await controller.getCheckAnswers(request, h);
      });

      test('maps selected documents in the state object to an array in the view', async () => {
        const [, { documents }] = h.view.lastCall.args;
        expect(documents).to.be.an.array().length(1);
      });

      test('maps the document properties to the view', async () => {
        const [, { documents: [document] }] = h.view.lastCall.args;

        expect(document.id).to.equal(DOCUMENT_ID);
        expect(document.licenceNumber).to.equal(LICENCE_NUMBER);
        expect(document.returns).to.be.an.array().length(1);
        expect(document.licenceHolderRole).to.be.an.object();
        expect(document.address).to.be.an.array();
        expect(document.selectReturnsLink).to.equal(`/returns-notifications/${DOCUMENT_ID}/select-returns`);
        expect(document.selectAddressLink).to.equal(`/returns-notifications/${DOCUMENT_ID}/select-address`);
      });

      test('maps selected returns to the view', async () => {
        const [, { documents: [document] }] = h.view.lastCall.args;
        expect(document.returns[0].legacyId).to.equal(1234);
        expect(document.returns[0].details).to.equal('Due 28 April 2021');
      });

      test('includes a confirm form object', async () => {
        const [, { form }] = h.view.lastCall.args;
        expect(form).to.be.an.object();
      });

      test('includes a back link', async () => {
        const [, { back }] = h.view.lastCall.args;
        expect(back).to.equal('/returns-notifications/forms');
      });

      test('uses the correct template', async () => {
        const [template] = h.view.lastCall.args;
        expect(template).to.equal('nunjucks/returns-notifications/check-answers');
      });
    });

    experiment('when the documents are not selected', () => {
      beforeEach(async () => {
        request.pre.state = createState();
        request.pre.state[DOCUMENT_ID].isSelected = false;
        await controller.getCheckAnswers(request, h);
      });

      test('they are omitted from the view model', async () => {
        const [, { documents }] = h.view.lastCall.args;
        expect(documents).to.be.an.array().length(0);
      });
    });

    experiment('when licences with no returns due are included', () => {
      beforeEach(async () => {
        request.pre.state = { ...createState(), testId: '01/987/ZYX' };
        await controller.getCheckAnswers(request, h);
      });

      test('the licence refs are included in the licencesWithNoReturns in the view model', async () => {
        const [, { licencesWithNoReturns }] = h.view.lastCall.args;
        expect(licencesWithNoReturns[0]).to.equal('01/987/ZYX');
      });

      test('only the licences with no returns due are incluced in licencesWithNoReturns in the view model', async () => {
        const [, { licencesWithNoReturns, documents }] = h.view.lastCall.args;
        expect(licencesWithNoReturns.length).to.equal(1);
        expect(documents).to.be.an.array().length(1);
      });
    });
  });

  experiment('.postCheckAnswers', () => {
    experiment('when a document is selected', () => {
      beforeEach(async () => {
        request.pre.state = createState();
        await controller.postCheckAnswers(request, h);
      });

      test('calls the water batch notifications service with the expected issuer', async () => {
        const [issuer, data] = services.water.batchNotifications.preparePaperReturnForms.lastCall.args;
        expect(issuer).to.equal('mail@example.com');

        expect(data.forms).to.be.an.array().length(1);
        expect(Object.keys(data.forms[0])).to.only.include([
          'address',
          'company',
          'contact',
          'returns'
        ]);
      });

      test('calls the water batch notifications service with the expected data shape', async () => {
        const [, data] = services.water.batchNotifications.preparePaperReturnForms.lastCall.args;

        expect(data.forms).to.be.an.array().length(1);
        expect(Object.keys(data.forms[0])).to.only.include([
          'address',
          'company',
          'contact',
          'returns'
        ]);
        expect(data.forms[0].returns).to.be.an.array().length(1);
      });

      test('only selected returns are included', async () => {
        const [, data] = services.water.batchNotifications.preparePaperReturnForms.lastCall.args;
        expect(data.forms[0].returns).to.only.include({
          returnId: 'v1:1:01/123/ABC:1234:2019-04-01:2020-03-31'
        });
      });

      test('the user is redirected to the sending page with the event id', async () => {
        expect(h.redirect.calledWith(
          '/returns-notifications/test-event-id/send'
        )).to.be.true();
      });
    });

    experiment('when a document is not selected', () => {
      beforeEach(async () => {
        request.pre.state = createState();
        request.pre.state[DOCUMENT_ID].isSelected = false;
        await controller.postCheckAnswers(request, h);
      });

      test('the document is not included', async () => {
        const [, data] = services.water.batchNotifications.preparePaperReturnForms.lastCall.args;
        expect(data.forms).to.be.an.array().length(0);
      });
    });
  });

  experiment('.getAcceptOneTimeAddress', () => {
    beforeEach(async () => {
      sandbox.stub(controllerLib, 'processAction');

      request.params.documentId = DOCUMENT_ID;
      request.getNewAddress.returns({
        addressLine1: 'Test Farm'
      });

      await controller.getAcceptOneTimeAddress(request, h);
    });

    test('creates and processes an action', async () => {
      const { args } = controllerLib.processAction.lastCall;
      expect(args[0]).to.equal(request);
      expect(args[1]).to.be.an.object();
      expect(args[1].type).to.equal('setOneTimeAddress');
      expect(args[1].payload.documentId).to.equal(DOCUMENT_ID);
      expect(args[1].payload.address).to.equal({
        addressLine1: 'Test Farm'
      });
    });

    test('redirects to check answers page', async () => {
      expect(h.redirect.calledWith('/returns-notifications/check-answers')).to.be.true();
    });
  });

  experiment('.getSend', () => {
    beforeEach(async () => {
      request.pre.event = {
        event_id: 'test-event-id',
        type: 'notification',
        subtype: 'paperReturnForms',
        status: 'processing'
      };
    });

    test('returns a Boom not found error if the event is of an unexpected type', async () => {
      request.pre.event.type = 'not-a-notification';
      const result = await controller.getSend(request);
      expect(result.isBoom).to.be.true();
      expect(result.output.statusCode).to.equal(404);
    });

    test('displays waiting page if event is processing', async () => {
      request.pre.event.status = 'processing';
      await controller.getSend(request, h);
      const [template, view] = h.view.lastCall.args;
      expect(template).to.equal('nunjucks/returns-notifications/waiting');
      expect(view.pageTitle).to.equal('Sending paper return forms');
    });

    test('returns a Boom 500 error if the event status is "error"', async () => {
      request.pre.event.status = 'error';
      const result = await controller.getSend(request);
      expect(result.isBoom).to.be.true();
      expect(result.output.statusCode).to.equal(500);
    });

    test('shows a confirmation page otherwise', async () => {
      request.pre.event.status = 'processed';
      await controller.getSend(request, h);
      const [template, view] = h.view.lastCall.args;
      expect(template).to.equal('nunjucks/returns-notifications/confirmation');
      expect(view.pageTitle).to.equal('Paper return forms sent');
    });
  });
});
