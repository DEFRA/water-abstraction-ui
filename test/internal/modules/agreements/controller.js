'use strict';

const { expect } = require('@hapi/code');
const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const sandbox = require('sinon').createSandbox();
const uuid = require('uuid');
const water = require('internal/lib/connectors/services').water;
const helpers = require('internal/modules/agreements/lib/helpers');
const { logger } = require('internal/logger');
const controller = require('internal/modules/agreements/controller');
const { assign } = require('lodash');

const createRequest = () => ({
  view: {
    csrf_token: 'csrf-token'
  },
  params: {
    agreementId: 'test-agreement-id'
  },
  yar: {
    get: sandbox.stub(),
    set: sandbox.stub()
  },
  pre: {
    agreement: {
      id: 'test-agreement-id',
      code: 'S127',
      description: 'Two-part tariff',
      dateRange: {
        startDate: '2019-01-01'
      }
    },
    document: {
      document_id: 'test-document-id'
    },
    licence: {
      id: 'test-licence-id',
      licenceNumber: '123/456/78'
    }
  }
});

const h = {
  view: sandbox.stub(),
  redirect: sandbox.stub(),
  postRedirectGet: sandbox.stub()
};

experiment('internal/modules/agreements/controller', () => {
  let request;
  beforeEach(() => {
    sandbox.stub(water.agreements, 'deleteAgreement');
    sandbox.stub(water.agreements, 'endAgreement');
    sandbox.stub(helpers, 'sessionManager').returns({ endDate: '2020-01-01' });
    sandbox.stub(logger, 'info');
  });

  afterEach(() => sandbox.restore());

  experiment('.getDeleteAgreement', () => {
    beforeEach(() => {
      request = createRequest();
      controller.getDeleteAgreement(request, h);
    });

    test('uses the correct template', () => {
      const [template] = h.view.lastCall.args;
      expect(template).to.equal('nunjucks/agreements/delete');
    });

    test('has the correct page title', () => {
      const [, view] = h.view.lastCall.args;
      expect(view.pageTitle).to.equal('You\'re about to delete this agreement');
    });

    test('has the correct caption', () => {
      const [, view] = h.view.lastCall.args;
      expect(view.caption).to.equal('Licence 123/456/78');
    });

    test('has the correct back link', () => {
      const [, view] = h.view.lastCall.args;
      expect(view.back).to.equal('/licences/test-document-id#charge');
    });

    test('contains the agreement', () => {
      const [, view] = h.view.lastCall.args;
      expect(view.agreement).to.equal(request.pre.agreement);
    });

    test('has the licence id', () => {
      const [, view] = h.view.lastCall.args;
      expect(view.licenceId).to.equal(request.pre.licence.id);
    });
  });

  experiment('.postDeleteAgreement', () => {
    beforeEach(async () => {
      request = createRequest();
      await controller.postDeleteAgreement(request, h);
    });

    test('deletes the agreement', () => {
      const [agreementId] = water.agreements.deleteAgreement.lastCall.args;
      expect(agreementId).to.equal(request.params.agreementId);
    });

    test('redirects back to the licence page', () => {
      const [redirectPath] = h.redirect.lastCall.args;
      expect(redirectPath).to.equal('/licences/test-document-id#charge');
    });

    experiment('when an error occurs', () => {
      test('logs an error', async () => {
        water.agreements.deleteAgreement.throws(new Error('oops!'));
        await controller.postDeleteAgreement(request, h);
        const [errMsg] = logger.info.lastCall.args;
        expect(errMsg).to.equal('Did not successfully delete agreement test-agreement-id');
      });

      test('redirects back to licence page', () => {
        const [redirectPath] = h.redirect.lastCall.args;
        expect(redirectPath).to.equal('/licences/test-document-id#charge');
      });
    });
  });

  experiment('.getEndAgreement', () => {
    beforeEach(() => {
      request = createRequest();
      controller.getEndAgreement(request, h);
    });

    test('uses the correct template', () => {
      const [template] = h.view.lastCall.args;
      expect(template).to.equal('nunjucks/form');
    });

    test('has the correct page title', () => {
      const [, view] = h.view.lastCall.args;
      expect(view.pageTitle).to.equal('Set agreement end date');
    });

    test('has the correct caption', () => {
      const [, view] = h.view.lastCall.args;
      expect(view.caption).to.equal('Licence 123/456/78');
    });

    test('has the correct back link', () => {
      const [, view] = h.view.lastCall.args;
      expect(view.back).to.equal('/licences/test-document-id#charge');
    });

    test('contains the agreement', () => {
      const [, view] = h.view.lastCall.args;
      expect(view.agreement).to.equal(request.pre.agreement);
    });

    test('has the licence id', () => {
      const [, view] = h.view.lastCall.args;
      expect(view.licenceId).to.equal(request.pre.licence.id);
    });
  });

  experiment('.postEndAgreement', () => {
    experiment('when the form is valid', async () => {
      let modifiedRequest;
      beforeEach(async () => {
        request = createRequest();
        modifiedRequest = assign({}, request, {
          payload: {
            'csrf_token': uuid(),
            'endDate-year': '2020',
            'endDate-month': '01',
            'endDate-day': '01'
          }
        });
        await controller.postEndAgreement(modifiedRequest, h);
      });
      test('redirects back to the confirmation page', async () => {
        expect(h.redirect.calledWith(`/licences/${modifiedRequest.pre.licence.id}/agreements/${modifiedRequest.params.agreementId}/end/confirm`));
      });
    });
    experiment('when the form is invalid', async () => {
      let modifiedRequest;
      beforeEach(async () => {
        request = createRequest();
        modifiedRequest = assign({}, request, {
          payload: {
            'csrf_token': uuid(),
            'endDate-year': null,
            'endDate-month': null,
            'endDate-day': null
          }
        });
        await controller.postEndAgreement(modifiedRequest, h);
      });
      test('redirects back to the form', async () => {
        expect(h.redirect.calledWith(`/licences/${modifiedRequest.pre.licence.id}/agreements/${modifiedRequest.params.agreementId}/end`));
      });
    });
  });

  experiment('.getConfirmEndAgreement', () => {
    beforeEach(() => {
      request = createRequest();
      controller.getConfirmEndAgreement(request, h);
    });

    test('uses the correct template', () => {
      const [template] = h.view.lastCall.args;
      expect(template).to.equal('nunjucks/agreements/end');
    });

    test('has the correct page title', () => {
      const [, view] = h.view.lastCall.args;
      expect(view.pageTitle).to.equal('You\'re about to end this agreement');
    });

    test('has the correct caption', () => {
      const [, view] = h.view.lastCall.args;
      expect(view.caption).to.equal('Licence 123/456/78');
    });

    test('has the correct back link', () => {
      const [, view] = h.view.lastCall.args;
      expect(view.back).to.equal('/licences/test-document-id/agreements/test-agreement-id/end');
    });

    test('contains the agreement', () => {
      const [, view] = h.view.lastCall.args;
      expect(view.agreement).to.equal(request.pre.agreement);
    });

    test('has the licence id', () => {
      const [, view] = h.view.lastCall.args;
      expect(view.licenceId).to.equal(request.pre.licence.id);
    });

    test('has the end date', () => {
      const [, view] = h.view.lastCall.args;
      expect(view.endDate).to.equal('2020-01-01');
    });

    test('returns h.view', () => {
      expect(h.view.called).to.be.true();
    });
  });

  experiment('.postConfirmEndAgreement', () => {
    experiment(`when the service method is successful`, () => {
      beforeEach(() => {
        request = createRequest();
        controller.postConfirmEndAgreement(request, h);
        water.agreements.endAgreement.resolves();
      });
      test('redirects the client', () => {
        expect(h.redirect.calledWith(`/licences/test-document-id#charge`)).to.be.true();
      });
    });
  });
});
