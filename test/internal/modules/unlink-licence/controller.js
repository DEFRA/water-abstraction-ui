const { experiment, test, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sandbox = require('sinon').createSandbox();
const controller = require('internal/modules/unlink-licence/controller');
const forms = require('shared/lib/forms');
const services = require('internal/lib/connectors/services');

const request = {
  defra: {
    userId: 'calling-user'
  },
  licence: {
    company: {
      licenceNumber: 'lic-no'
    },
    licence: {
      licence_ref: 'lic-ref'
    }
  },
  params: {
    documentId: 'doc-id'
  },
  query: {
    userId: 'user-id',
    companyName: 'company-name'
  },
  view: {}
};

const h = {
  view: sandbox.stub(),
  redirect: sandbox.stub()
};

experiment('modules/unlink-licence/controller', () => {
  beforeEach(async () => {
    sandbox.stub(forms, 'handleRequest');
    sandbox.stub(services.water.licences, 'patchUnlinkLicence');
  });

  afterEach(async () => { sandbox.restore(); });

  experiment('.getUnlinkLicence', async () => {
    beforeEach(async () => {
      await controller.getUnlinkLicence(request, h);
    });

    test('passes the expected template', async () => {
      const [template] = h.view.lastCall.args;
      expect(template).to.equal('nunjucks/unlink-licence/confirm-unlink-licence.njk');
    });

    test('view object contains the correct pageTitle', async () => {
      const [, view] = h.view.lastCall.args;
      expect(view.pageTitle).to.equal(`Unlink licence ${request.licence.company.licenceNumber}`);
    });

    test('view object contains the correct back link url', async () => {
      const [, view] = h.view.lastCall.args;
      expect(view.back).to.equal(`/user/${request.query.userId}/status`);
    });

    test('view object contains the licenceData', async () => {
      const [, view] = h.view.lastCall.args;
      expect(view.licenceData).to.equal(request.licence.company);
    });

    test('view object contains the form object', async () => {
      const [, view] = h.view.lastCall.args;
      expect(view.form).to.be.an.object();
    });

    test('view object contains the form object to be the formFromPost, if provided', async () => {
      const testForm = { test: { form: 'object' } };
      await controller.getUnlinkLicence(request, h, testForm);
      const [, view] = h.view.lastCall.args;
      expect(view.form).to.equal(testForm);
    });
  });

  experiment('.postUnlinkLicence', async () => {
    test('calls handleRequest with the expected arguments', async () => {
      forms.handleRequest.returns({ isValid: true });
      await controller.postUnlinkLicence(request, h);
      const [form, req, schema] = forms.handleRequest.lastCall.args;
      expect(form).to.be.an.object();
      expect(req).to.equal(request);
      expect(schema).to.be.an.object();
    });

    experiment('when the form is valid', async () => {
      beforeEach(async () => {
        forms.handleRequest.returns({ isValid: true });
        await controller.postUnlinkLicence(request, h);
      });
      test('calls patchUnlinkLicence', async () => {
        expect(services.water.licences.patchUnlinkLicence.calledWith(
          request.params.documentId,
          request.defra.userId
        )).to.be.true();
      });

      test('redirects to expected path', async () => {
        const [path] = h.redirect.lastCall.args;
        expect(path).to.equal(
          `/licences/${request.params.documentId}/unlink-licence/success` +
          `?userId=${request.query.userId}` +
          `&companyName=${request.licence.company.companyName}`
        );
      });
    });

    experiment('when the form is not valid', async () => {
      test('the confirm unlink licence template is replayed', async () => {
        const [template] = h.view.lastCall.args;
        expect(template).to.equal('nunjucks/unlink-licence/confirm-unlink-licence.njk');
      });
    });
  });

  experiment('.getUnlinkLicenceSuccess', async () => {
    beforeEach(async () => {
      await controller.getUnlinkLicenceSuccess(request, h);
    });

    test('passes the expected template', async () => {
      const [template] = h.view.lastCall.args;
      expect(template).to.equal('nunjucks/unlink-licence/unlink-licence-success.njk');
    });

    test('view object contains the correct pageTitle', async () => {
      const [, view] = h.view.lastCall.args;
      expect(view.pageTitle).to.equal(`Unlinked licence ${request.licence.licence.licence_ref}`);
    });

    test('view object contains the licenceNumber', async () => {
      const [, view] = h.view.lastCall.args;
      expect(view.licenceNumber).to.equal(request.licence.licence.licence_ref);
    });

    test('view object contains the companyName', async () => {
      const [, view] = h.view.lastCall.args;
      expect(view.companyName).to.equal(request.query.companyName);
    });

    test('view object contains the correct userPageUrl url', async () => {
      const [, view] = h.view.lastCall.args;
      expect(view.userPageUrl).to.equal(`/user/${request.query.userId}/status`);
    });
  });
});
