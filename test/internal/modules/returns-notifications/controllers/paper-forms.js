'use strict';

const { expect } = require('@hapi/code');
const {
  beforeEach,
  afterEach,
  experiment,
  test
} = exports.lab = require('@hapi/lab').script();

const { cloneDeep } = require('lodash');
const uuid = require('uuid/v4');

const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const controller = require('internal/modules/returns-notifications/controllers/paper-forms');
const services = require('internal/lib/connectors/services');
const helpers = require('../helpers');

const DOCUMENT_ID = uuid();
const LICENCE_NUMBER = '01/123/ABC';

const createRole = () => ({
  'id': '00000000-0000-0000-0000-000000000003',
  'roleName': 'licenceHolder',
  'dateRange': {
    'startDate': '2020-01-01',
    'endDate': null
  },
  'company': {
    'companyAddresses': [],
    'companyContacts': [],
    'name': 'TEST WATER CO LTD',
    'id': '00000000-0000-0000-0000-000000000004'
  },
  'contact': {},
  'address': {
    'town': 'TESTINGTON',
    'county': 'TESTINGSHIRE',
    'postcode': 'TT1 1TT',
    'country': null,
    'id': '00000000-0000-0000-0000-000000000005',
    'addressLine1': 'BUTTERCUP ROAD',
    'addressLine2': 'DAISY LANE',
    'addressLine3': 'TESTINGLY',
    'addressLine4': null
  }
});

const apiResponse = [{
  'licence': {
    'id': '00000000-0000-0000-0000-000000000001',
    'licenceNumber': LICENCE_NUMBER,
    'isWaterUndertaker': false,
    'startDate': '2020-01-01',
    'expiredDate': null,
    'lapsedDate': null,
    'revokedDate': null,
    'historicalArea': {
      'type': 'EAAR',
      'code': 'ARNA'
    },
    'regionalChargeArea': {
      'type': 'regionalChargeArea',
      'name': 'Anglian'
    },
    'region': {
      'type': 'region',
      'id': '00000000-0000-0000-0000-000000000002',
      'name': 'Anglian',
      'code': 'A',
      'numericCode': 1,
      'displayName': 'Anglian'
    },
    'endDate': null
  },
  'documents': [
    {
      'document': {
        id: DOCUMENT_ID,
        'roles': [
          createRole()
        ]
      },

      'returns': [
        helpers.createReturn()
      ]
    }
  ]
}];

const createState = () => ({
  [DOCUMENT_ID]: {
    selectedRole: 'licenceHolder',
    document: {
      id: DOCUMENT_ID,
      roles: [
        createRole()
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
      }
    };

    h = {
      view: sandbox.spy(),
      postRedirectGet: sandbox.stub(),
      redirect: sandbox.stub()
    };

    sandbox.stub(services.water.returns, 'getIncompleteReturns');
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
      expect(template).to.equal('nunjucks/form');
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
    beforeEach(async () => {
      request.yar.get.returns(createState());
      await controller.getCheckAnswers(request, h);
    });

    test('loads data from the session with the expected key', async () => {
      expect(request.yar.get.calledWith(
        'returns.paper-forms'
      )).to.be.true();
    });

    test('maps the documents object from the state to an array in the view', async () => {
      const [, { documents }] = h.view.lastCall.args;
      expect(documents).to.be.an.array().length(1);
    });

    test('maps the document properties to the view', async () => {
      const [, { documents: [document] }] = h.view.lastCall.args;

      expect(document.id).to.equal(DOCUMENT_ID);
      expect(document.licenceNumber).to.equal(LICENCE_NUMBER);
      expect(document.returns).to.be.an.array().length(1);
      expect(document.licenceHolderRole).to.be.an.object();
      expect(document.selectedRole).to.be.an.object();
      expect(document.selectReturnsLink).to.equal(`/returns-notifications/${DOCUMENT_ID}/select-returns`);
      expect(document.selectAddressLink).to.equal(`/returns-notifications/${DOCUMENT_ID}/select-address`);
    });

    test('maps selected returns to the view', async () => {
      const [, { documents: [document] }] = h.view.lastCall.args;
      expect(document.returns[0].legacyId).to.equal(1234);
      expect(document.returns[0].details).to.equal(`Due 28 April 2021`);
    });

    test('includes a confirm form object', async () => {
      const [, { form }] = h.view.lastCall.args;
      expect(form).to.be.an.object();
    });

    test('includes a back link', async () => {
      const [, { back }] = h.view.lastCall.args;
      expect(back).to.equal('/returns-notifications/paper-forms');
    });

    test('uses the correct template', async () => {
      const [template] = h.view.lastCall.args;
      expect(template).to.equal('nunjucks/returns-notifications/check-answers');
    });
  });
});
