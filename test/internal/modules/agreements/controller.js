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
    agreementId: 'test-agreement-id',
    licenceId: 'test-licence-id'
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
    sandbox.stub(helpers, 'endAgreementSessionManager').returns({ endDate: '2020-01-01' });
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
      expect(template).to.equal('nunjucks/agreements/confirm-end-or-delete');
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

    test('has the correct verb for the warning message', () => {
      const [, view] = h.view.lastCall.args;
      expect(view.verb).to.equal('delete');
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
      expect(template).to.equal('nunjucks/agreements/confirm-end-or-delete');
    });

    test('has the correct page title', () => {
      const [, view] = h.view.lastCall.args;
      expect(view.pageTitle).to.equal('You\'re about to end this agreement');
    });

    test('has the correct verb for the warning message', () => {
      const [, view] = h.view.lastCall.args;
      expect(view.verb).to.equal('end');
    });

    test('has the correct caption', () => {
      const [, view] = h.view.lastCall.args;
      expect(view.caption).to.equal('Licence 123/456/78');
    });

    test('has the correct back link', () => {
      const [, view] = h.view.lastCall.args;
      expect(view.back).to.equal('/licences/test-licence-id/agreements/test-agreement-id/end');
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

  experiment('create agreement flow', () => {
    let request, h;

    const documentId = uuid();
    const licenceId = uuid();

    beforeEach(async () => {
      request = {
        params: {
          licenceId
        },
        view: {
          csrfToken: uuid()
        },
        pre: {
          licence: {
            id: licenceId,
            licenceNumber: '01/234/ABC',
            startDate: '2020-02-01'
          },
          document: {
            document_id: documentId
          }
        },
        yar: {
          get: sandbox.stub(),
          set: sandbox.stub(),
          clear: sandbox.stub()
        }
      };

      h = {
        view: sandbox.stub(),
        redirect: sandbox.stub()
      };
    });

    experiment('.getSelectAgreementType', () => {
      beforeEach(async () => {
        await controller.getSelectAgreementType(request, h);
      });

      test('uses the correct template', async () => {
        expect(h.view.calledWith(
          'nunjucks/agreements/form'
        )).to.be.true();
      });

      test('sets the caption in the view', async () => {
        const [, { caption }] = h.view.lastCall.args;
        expect(caption).to.equal(`Licence 01/234/ABC`);
      });

      test('sets the page title in the view', async () => {
        const [, { pageTitle }] = h.view.lastCall.args;
        expect(pageTitle).to.equal(`Select agreement`);
      });

      test('sets the correct back link in the view', async () => {
        const [, { back }] = h.view.lastCall.args;
        expect(back).to.equal(`/licences/${documentId}#charge`);
      });

      test('defines a form', async () => {
        const [, { form }] = h.view.lastCall.args;
        expect(form).to.be.an.object();
      });

      test('the form has 3 radio options for each supported agreement type', async () => {
        const [, { form }] = h.view.lastCall.args;
        const field = form.fields.find(field => field.name === 'financialAgreementCode');

        expect(field.options.widget).to.equal('radio');
        expect(field.options.label).to.equal('Select agreement');

        expect(field.options.choices.length).to.equal(3);

        expect(field.options.choices[0].label).to.equal('Two-part tariff (S127)');
        expect(field.options.choices[0].value).to.equal('S127');

        expect(field.options.choices[1].label).to.equal('Canal and Rivers Trust, supported source (S130S)');
        expect(field.options.choices[1].value).to.equal('S130S');

        expect(field.options.choices[2].label).to.equal('Canal and Rivers Trust, unsupported source (S130S)');
        expect(field.options.choices[2].value).to.equal('S130U');
      });
    });

    experiment('.getDateSigned', () => {
      beforeEach(async () => {
        await controller.getDateSigned(request, h);
      });

      test('uses the correct template', async () => {
        expect(h.view.calledWith(
          'nunjucks/agreements/form'
        )).to.be.true();
      });

      test('sets the caption in the view', async () => {
        const [, { caption }] = h.view.lastCall.args;
        expect(caption).to.equal(`Licence 01/234/ABC`);
      });

      test('sets the page title in the view', async () => {
        const [, { pageTitle }] = h.view.lastCall.args;
        expect(pageTitle).to.equal(`Enter date agreement was signed`);
      });

      test('sets the correct back link in the view', async () => {
        const [, { back }] = h.view.lastCall.args;
        expect(back).to.equal(`/licences/${licenceId}/agreements/select-type`);
      });

      test('defines a form', async () => {
        const [, { form }] = h.view.lastCall.args;
        expect(form).to.be.an.object();
      });

      test('the form has a date field for the date signed', async () => {
        const [, { form }] = h.view.lastCall.args;
        const field = form.fields.find(field => field.name === 'dateSigned');

        expect(field.options.label).to.equal('Enter date agreement was signed');
        expect(field.options.widget).to.equal('date');
      });
    });

    experiment('.getCheckStartDate', () => {
      experiment('when the agreement start date = the licence start date', async () => {
        beforeEach(async () => {
          request.yar.get.onFirstCall().returns({
            startDate: '2020-02-01'
          });

          await controller.getCheckStartDate(request, h);
        });

        test('uses the correct template', async () => {
          expect(h.view.calledWith(
            'nunjucks/agreements/check-start-date'
          )).to.be.true();
        });

        test('sets the caption in the view', async () => {
          const [, { caption }] = h.view.lastCall.args;
          expect(caption).to.equal(`Licence 01/234/ABC`);
        });

        test('sets the page title in the view', async () => {
          const [, { pageTitle }] = h.view.lastCall.args;
          expect(pageTitle).to.equal(`Check agreement start date`);
        });

        test('sets the correct back link in the view', async () => {
          const [, { back }] = h.view.lastCall.args;
          expect(back).to.equal(`/licences/${licenceId}/agreements/date-signed`);
        });

        test('sets flags to indicate if the start date is significant', async () => {
          const [, { isLicenceStartDate, isFinancialYearStartDate }] = h.view.lastCall.args;
          expect(isLicenceStartDate).to.be.true();
          expect(isFinancialYearStartDate).to.be.false();
        });

        test('defines a form', async () => {
          const [, { form }] = h.view.lastCall.args;
          expect(form).to.be.an.object();
        });

        test('the form has 2 radio options for yes/no', async () => {
          const [, { form }] = h.view.lastCall.args;
          const field = form.fields.find(field => field.name === 'isCustomStartDate');

          expect(field.options.widget).to.equal('radio');
          expect(field.options.label).to.equal('Do you want to set a different agreement start date?');

          expect(field.options.choices.length).to.equal(2);

          expect(field.options.choices[0].label).to.equal('Yes');
          expect(field.options.choices[0].value).to.equal(true);

          expect(field.options.choices[1].label).to.equal('No');
          expect(field.options.choices[1].value).to.equal(false);
        });

        test('the "yes" radio option has a conditional disclosure field for the start date', async () => {
          const [, { form }] = h.view.lastCall.args;
          const field = form.fields.find(field => field.name === 'isCustomStartDate');

          const [dateField] = field.options.choices[0].fields;

          expect(dateField.options.label).to.equal('Start date');
          expect(dateField.options.widget).to.equal('date');
        });
      });

      experiment('when the agreement start date = the financial year start', async () => {
        beforeEach(async () => {
          request.yar.get.onFirstCall().returns({
            startDate: '2020-04-01'
          });

          await controller.getCheckStartDate(request, h);
        });

        test('sets flags to indicate if the start date is significant', async () => {
          const [, { isLicenceStartDate, isFinancialYearStartDate }] = h.view.lastCall.args;
          expect(isLicenceStartDate).to.be.false();
          expect(isFinancialYearStartDate).to.be.true();
        });
      });

      experiment('when the agreement start date is neither the financial year or licence start date', async () => {
        beforeEach(async () => {
          request.yar.get.onFirstCall().returns({
            startDate: '2020-04-02'
          });

          await controller.getCheckStartDate(request, h);
        });

        test('sets flags to indicate if the start date is significant', async () => {
          const [, { isLicenceStartDate, isFinancialYearStartDate }] = h.view.lastCall.args;
          expect(isLicenceStartDate).to.be.false();
          expect(isFinancialYearStartDate).to.be.false();
        });
      });
    });
  });
});
