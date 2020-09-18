'use strict';

const { expect } = require('@hapi/code');
const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const sinon = require('sinon');

const uuid = require('uuid/v4');

const sandbox = sinon.createSandbox();

const controller = require('internal/modules/contact-entry/controllers');

let contactId = uuid();

const createRequest = (tempSessionKey) => ({
  query: {
    sessionKey: tempSessionKey,
    back: '/some/return/url'
  },
  params: {
    regionId: uuid(),
    companyId: uuid()
  },
  view: {
    foo: 'bar',
    csrfToken: uuid()
  },
  pre: {
    companiesHouseResults: [],
    companiesHouseAddresses: [],
    addressSearchResults: [],
    contactSearchResults: [{
      id: contactId,
      name: 'some name'
    }]
  },
  yar: {
    get: sandbox.stub().resolves({
      back: 'someplace',
      sessionKey: tempSessionKey,
      originalCompanyId: uuid(),
      regionId: uuid(),
      searchQuery: 'testco'
    }),
    set: sandbox.stub(),
    clear: sandbox.stub()
  },
  server: {
    methods: {
      setDraftChargeInformation: sandbox.stub()
    }
  }
});

experiment('internal/modules/contact-entry/controllers', () => {
  let request, h;

  beforeEach(async () => {
    h = {
      view: sandbox.stub(),
      postRedirectGet: sandbox.stub(),
      redirect: sandbox.stub()
    };
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.getSelectContactController', () => {
    beforeEach(async () => {
      request = createRequest(uuid());
      await controller.getSelectContactController(request, h);
    });

    test('uses the correct template', async () => {
      const [template] = h.view.lastCall.args;
      expect(template).to.equal('nunjucks/contact-entry/basic-form');
    });

    test('has the page title', async () => {
      const { pageTitle } = h.view.lastCall.args[1];
      expect(pageTitle).to.equal('Does this contact already exist?');
    });

    test('passes through request.view', async () => {
      const { foo } = h.view.lastCall.args[1];
      expect(foo).to.equal(request.view.foo);
    });

    test('has a form', async () => {
      const { form } = h.view.lastCall.args[1];
      expect(form).to.be.an.object();
    });
  });

  experiment('.postSelectContactController', () => {
    let tempSessionKey;

    experiment('when a the contact id is null or "new"', () => {
      beforeEach(async () => {
        tempSessionKey = uuid();
        request = createRequest(tempSessionKey);
        await controller.postSelectContactController({ ...request, payload: { id: 'new', sessionKey: tempSessionKey, searchQuery: 'something', regionId: uuid(), csrf_token: uuid() } }, h);
      });
      test('the client is redirected to select a contact type for the new contact', async () => {
        expect(h.redirect.lastCall.args[0]).to.equal(
          `/contact-entry/new/account-type?sessionKey=${tempSessionKey}`
        );
      });
    });
    experiment('when a valid contact is posted', () => {
      beforeEach(async () => {
        tempSessionKey = uuid();
        request = createRequest(tempSessionKey);
        await controller.postSelectContactController({ ...request, payload: { id: contactId, sessionKey: tempSessionKey, searchQuery: 'something', regionId: uuid(), csrf_token: uuid() } }, h);
      });
      test('the client is redirected to select an address for the contact', async () => {
        expect(h.redirect.lastCall.args[0]).to.equal(
          `/contact-entry/select-address?sessionKey=${tempSessionKey}`
        );
      });
    });
  });
});
