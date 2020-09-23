'use strict';

const { expect } = require('@hapi/code');
const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const sandbox = require('sinon').createSandbox();

const water = require('internal/lib/connectors/services').water;
const { logger } = require('internal/logger');

const { deleteAgreementForm } = require('internal/modules/agreements/forms/delete-agreement');
const controller = require('internal/modules/agreements/controller');

const createRequest = () => ({
  view: {
    csrf_token: 'csrf-token'
  },
  params: {
    agreementId: 'test-agreement-id'
  },
  pre: {
    agreement: {
      id: 'test-agreement-id',
      code: 'S127',
      description: 'Two-part tariff'
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
  redirect: sandbox.stub()
};

experiment('internal/modules/agreements/controller', () => {
  let request;
  beforeEach(() => {
    sandbox.stub(water.agreements, 'deleteAgreement');
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

    test('has the correct form', () => {
      const [, view] = h.view.lastCall.args;
      expect(view.form).to.equal(deleteAgreementForm(request));
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
});
