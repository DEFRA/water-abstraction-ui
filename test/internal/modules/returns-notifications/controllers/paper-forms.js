'use strict';

const { expect } = require('@hapi/code');
const {
  beforeEach,
  afterEach,
  experiment,
  test
} = exports.lab = require('@hapi/lab').script();

const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const controller = require('internal/modules/returns-notifications/controllers/paper-forms');
const services = require('internal/lib/connectors/services');

experiment('internal/modules/returns-notifications/controllers/paper-forms', () => {
  let request;
  let h;

  beforeEach(async () => {
    request = {
      view: {
      },
      yar: {
        set: sandbox.stub(),
        get: sandbox.stub(),
        clear: sandbox.stub()
      }
    };

    h = {
      view: sandbox.spy()
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
});
