'use strict';

const { expect } = require('@hapi/code');
const { experiment, test, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script();
const sinon = require('sinon');
const { set, pick } = require('lodash');
const sandbox = sinon.createSandbox();
const formTest = require('../../../lib/form-test');
const contactDetailsStorage = require('internal/modules/notifications/lib/contact-details-storage');
const controller = require('internal/modules/notifications/contact-controller');
const csrfToken = 'bbf9c296-be8b-404b-92b9-43e69eb9644d';

const createRequest = () => ({
  view: {
    csrfToken
  },
  yar: {
    get: sandbox.stub().returns(redirectPath),
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

const redirectPath = '/some/path';

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
        set(request, 'query.redirect', redirectPath);
        await controller.getNameAndJob(request, h);
      });

      test('stores the redirect path in the users session', async () => {
        const [key, value] = request.yar.set.firstCall.args;
        expect(key).to.equal('redirect');
        expect(value).to.equal(redirectPath);
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
        expect(template).to.equal('nunjucks/form');
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

  experiment('.postNameAndJob', () => {
    experiment('when the form is invalid', () => {
      beforeEach(async () => {
        request.payload = {};
        await controller.postNameAndJob(request, h);
      });

      test('the form is re-rendered', async () => {
        expect(h.view.called).to.be.true();
      });

      test('contact details are not updated in the session', async () => {
        expect(contactDetailsStorage.set.called).to.be.false();
      });
    });

    experiment('when the form is valid', () => {
      beforeEach(async () => {
        request.payload = {
          name: contact.name,
          jobTitle: contact.jobTitle,
          csrf_token: csrfToken
        };
        await controller.postNameAndJob(request, h);
      });

      test('contact details are updated in the session', async () => {
        expect(contactDetailsStorage.set.calledWith(
          request, { name: contact.name, jobTitle: contact.jobTitle }
        )).to.be.true();
      });

      test('the user is redirected to the next page', async () => {
        expect(h.redirect.calledWith('/notifications/contact-details'))
          .to.be.true();
      });
    });
  });

  experiment('.getDetails', () => {
    experiment('for GET requests', () => {
      beforeEach(async () => {
        await controller.getDetails(request, h);
      });

      test('gets contact details from the current request', async () => {
        expect(contactDetailsStorage.get.calledWith(request)).to.be.true();
      });

      test('the form is populated with the contact details', async () => {
        const [, { form }] = h.view.lastCall.args;

        const address = formTest.findField(form, 'address');
        expect(address.value).to.equal(contact.address);

        const email = formTest.findField(form, 'email');
        expect(email.value).to.equal(contact.email);

        const tel = formTest.findField(form, 'tel');
        expect(tel.value).to.equal(contact.tel);
      });

      test('sets the correct view data', async () => {
        const [, view] = h.view.lastCall.args;
        expect(view.back).to.equal('/notifications/contact');
        expect(view.form).to.be.an.object();
      });

      test('renders the correct template', async () => {
        const [template] = h.view.lastCall.args;
        expect(template).to.equal('nunjucks/form');
      });
    });

    experiment('for POST requests', () => {
      const form = { foo: 'bar' };

      beforeEach(async () => {
        await controller.getDetails(request, h, form);
      });

      test('the supplied form object is passed directly to the view', async () => {
        const [, view] = h.view.lastCall.args;
        expect(view.form).to.equal(form);
      });
    });
  });

  experiment('.postDetails', () => {
    experiment('when the form is invalid', () => {
      beforeEach(async () => {
        request.payload = {};
        await controller.postDetails(request, h);
      });

      test('the form is re-rendered', async () => {
        expect(h.view.called).to.be.true();
      });

      test('contact details are not submitted', async () => {
        expect(contactDetailsStorage.submit.called).to.be.false();
      });
    });

    experiment('when the form is valid', () => {
      beforeEach(async () => {
        request.payload = {
          tel: contact.tel,
          email: contact.email,
          address: contact.address,
          csrf_token: csrfToken
        };
        await controller.postDetails(request, h);
      });

      test('contact details are submitted to the IDM', async () => {
        const data = pick(contact, ['tel', 'address', 'email']);
        expect(contactDetailsStorage.submit.calledWith(request, data))
          .to.be.true();
      });

      test('the user is redirected to the path stored in the session', async () => {
        expect(h.redirect.calledWith(redirectPath))
          .to.be.true();
      });
    });
  });
});
