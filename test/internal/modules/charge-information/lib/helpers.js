'use strict';

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();

const { expect } = require('@hapi/code');
const sandbox = require('sinon').createSandbox();

const sessionForms = require('shared/lib/session-forms');
const helpers = require('internal/modules/charge-information/lib/helpers');

experiment('internal/modules/charge-information/lib/helpers', () => {
  experiment('getDefaultView', () => {
    let request;
    let formContainer;

    afterEach(async () => {
      sandbox.restore();
    });

    beforeEach(async () => {
      sandbox.stub(sessionForms, 'get').returns('test-form');

      formContainer = {
        form: sandbox.spy()
      };

      request = {
        view: {
          pageTitle: 'test page title'
        },
        pre: {
          licence: {
            licenceNumber: '123/123'
          }
        }
      };
    });

    test('includes the existing request view', async () => {
      const defaultView = helpers.getDefaultView(request, formContainer, 'test-back');
      expect(defaultView.pageTitle).to.equal(request.view.pageTitle);
    });

    test('if the back link is a string it is used', async () => {
      const defaultView = helpers.getDefaultView(request, formContainer, 'test-back');
      expect(defaultView.back).to.equal('test-back');
    });

    test('if the back link is a function it is called and the return value used', async () => {
      const routingLink = sandbox.stub().returns('test-link');
      const defaultView = helpers.getDefaultView(request, formContainer, routingLink);

      expect(defaultView.back).to.equal('test-link');
      expect(routingLink.calledWith(request.pre.licence)).to.equal(true);
    });

    test('adds a caption using the licence number', async () => {
      const defaultView = helpers.getDefaultView(request, formContainer, 'test-back');
      expect(defaultView.caption).to.equal('Licence 123/123');
    });

    test('adds the form to the view', async () => {
      const defaultView = helpers.getDefaultView(request, formContainer, 'test-back');
      expect(defaultView.form).to.equal('test-form');
      expect(formContainer.form.calledWith(request)).to.equal(true);
    });
  });
});
