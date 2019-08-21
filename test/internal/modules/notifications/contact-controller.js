'use strict';

const { expect } = require('@hapi/code');
const { experiment, test, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script();
const sinon = require('sinon');
const { set } = require('lodash');
const sandbox = sinon.createSandbox();
const formTest = require('../../../lib/form-test');
const contactDetailsStorage = require('internal/modules/notifications/lib/contact-details-storage');
const controller = require('internal/modules/notifications/contact-controller');
const csrfToken = 'csrfToken';

const createRequest = () => ({
  view: {
    csrfToken
  },
  yar: {
    get: sandbox.stub(),
    set: sandbox.stub()
  }
});

const contact = {
  name: 'Test Person',
  jobTitle: 'Environment officer',
  tel: '01234 567890',
  email: 'test@example.com',
  address: '1 River Lane, Borehole Lane, Splashbury, SS1 1PB'
};

experiment('internal/modules/notifications/contact-controller.js', () => {
  let request, h;

  beforeEach(async () => {
    sandbox.stub(contactDetailsStorage, 'get').returns(contact);
    sandbox.stub(contactDetailsStorage, 'set');
    sandbox.stub(contactDetailsStorage, 'submit');

    request = createRequest();

    h = {
      view: sandbox.stub(),
      redirect: sandbox.stub()
    };
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.getNameAndJob', () => {
    experiment('for GET requests', () => {
      beforeEach(async () => {
        set(request, 'query.redirect', 'some/path');
        await controller.getNameAndJob(request, h);
      });

      test('stores the redirect path in the users session', async () => {
        const [key, value] = request.yar.set.firstCall.args;
        expect(key).to.equal('redirect');
        expect(value).to.equal('some/path');
      });

      test('gets contact details from the current request', async () => {
        expect(contactDetailsStorage.get.calledWith(request)).to.be.true();
      });

      test('the form is populated with the contact details', async () => {
        const [, { form }] = h.view.lastCall.args;

        const name = formTest.findField(form, 'name');
        expect(name.value).to.equal(contact.name);

        const jobTitle = formTest.findField(form, 'jobTitle');
        expect(jobTitle.value).to.equal(contact.jobTitle);
      });

      test('sets the correct view data', async () => {
        const [, view] = h.view.lastCall.args;
        expect(view.back).to.equal('/manage');
        expect(view.form).to.be.an.object();
      });

      test('renders the correct template', async () => {
        const [template] = h.view.lastCall.args;
        expect(template).to.equal('nunjucks/form.njk');
      });
    });

    experiment('for POST requests', () => {
      const form = { foo: 'bar' };

      beforeEach(async () => {
        await controller.getNameAndJob(request, h, form);
      });

      test('the rediret path is not stored', async () => {
        expect(request.yar.set.called).to.be.false();
      });

      test('the supplied form object is passed directly to the view', async () => {
        const [, view] = h.view.lastCall.args;
        expect(view.form).to.equal(form);
      });
    });
  });
});
