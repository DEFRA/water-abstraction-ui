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

const controller = require('internal/modules/address-entry/controller');
const session = require('internal/modules/address-entry/lib/session');

const KEY = 'test-key';
const POSTCODE = 'TT1 1TT';
const ADDRESS_ID = uuid();
const UPRN = 1234;
const CSRF_TOKEN = uuid();
const REDIRECT_PATH = '/redirect/path';

const ADDRESS = {
  addressLine1: '',
  addressLine2: '125',
  addressLine3: 'Test Street',
  addressLine4: '',
  town: 'Testington',
  county: 'Testingshire',
  postcode: 'TT1 1TT',
  country: 'United Kingdom'
};

experiment('src/internal/modules/address-entry/pre-handlers .searchForAddressesByPostcode', () => {
  let request, h;

  beforeEach(async () => {
    request = {
      method: 'get',
      params: {
        key: KEY
      },
      view: {
        csrfToken: CSRF_TOKEN
      },
      pre: {
        sessionData: {
          caption: 'Licence 01/234',
          back: '/back/path',
          redirectPath: REDIRECT_PATH
        },
        addressSearchResults: [{
          id: ADDRESS_ID,
          uprn: UPRN
        }]
      },
      payload: {},
      query: {},
      yar: {
        get: sandbox.stub().returns(),
        set: sandbox.stub(),
        clear: sandbox.stub()
      }
    };

    h = {
      view: sandbox.stub(),
      redirect: sandbox.stub(),
      postRedirectGet: sandbox.stub()
    };

    sandbox.stub(session, 'merge').returns({
      redirectPath: REDIRECT_PATH
    });
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.getPostcode', () => {
    beforeEach(async () => {
      request.path = `/address-entry/${KEY}/postcode`;
    });

    experiment('when the postcode form is not submitted', async () => {
      beforeEach(async () => {
        await controller.getPostcode(request, h);
      });

      test('the correct template is used', async () => {
        const [template] = h.view.lastCall.args;
        expect(template).to.equal('nunjucks/address-entry/enter-uk-postcode');
      });

      test('the correct data is output to the view', async () => {
        const [, { pageTitle, caption, back, form }] = h.view.lastCall.args;
        expect(pageTitle).to.equal('Enter the UK postcode');
        expect(caption).to.equal(request.pre.sessionData.caption);
        expect(back).to.equal(request.pre.sessionData.back);
        expect(form).to.be.an.object();
      });
    });

    experiment('when the postcode form is valid', async () => {
      beforeEach(async () => {
        request.query.postcode = POSTCODE;
        await controller.getPostcode(request, h);
      });

      test('the correct template is used', async () => {
        const [template] = h.view.lastCall.args;
        expect(template).to.equal('nunjucks/address-entry/select-address');
      });

      test('the correct data is output to the view', async () => {
        const [, { pageTitle, caption, back, form }] = h.view.lastCall.args;
        expect(pageTitle).to.equal('Select the address');
        expect(caption).to.equal(request.pre.sessionData.caption);
        expect(back).to.equal(`/address-entry/${KEY}/postcode`);
        expect(form).to.be.an.object();
      });
    });
  });

  experiment('.postSelectAddress', () => {
    beforeEach(async () => {
      request.method = 'post';
      request.path = `/address-entry/${KEY}/postcode`;
    });

    experiment('when the form is invalid', async () => {
      beforeEach(async () => {
        await controller.postSelectAddress(request, h);
      });

      test('the user is redirected to the get page with errors', async () => {
        expect(h.postRedirectGet.called).to.be.true();
      });
    });

    experiment('when the form is valid', async () => {
      beforeEach(async () => {
        request.payload = {
          uprn: UPRN,
          csrf_token: CSRF_TOKEN,
          postcode: POSTCODE
        };
        await controller.postSelectAddress(request, h);
      });

      test('the address is stored in the session', async () => {
        expect(session.merge.calledWith(
          request, KEY, {
            data: {
              id: ADDRESS_ID,
              uprn: UPRN
            }
          }
        )).to.be.true();
      });

      test('redirects to the redirect path', async () => {
        expect(h.redirect.calledWith(REDIRECT_PATH)).to.be.true();
      });
    });
  });

  experiment('.getManualAddressEntry', () => {
    beforeEach(async () => {
      await controller.getManualAddressEntry(request, h);
    });

    test('the correct template is used', async () => {
      const [template] = h.view.lastCall.args;
      expect(template).to.equal('nunjucks/form');
    });

    test('the correct data is output to the view', async () => {
      const [, { pageTitle, caption, back, form }] = h.view.lastCall.args;
      expect(pageTitle).to.equal('Enter the address');
      expect(caption).to.equal(request.pre.sessionData.caption);
      expect(back).to.equal(`/address-entry/${KEY}/postcode`);
      expect(form).to.be.an.object();
    });
  });

  experiment('.postManualAddressEntry', () => {
    beforeEach(async () => {
      request.method = 'post';
    });

    experiment('when the form is invalid', async () => {
      beforeEach(async () => {
        await controller.postManualAddressEntry(request, h);
      });

      test('the user is redirected to the get page with errors', async () => {
        expect(h.postRedirectGet.called).to.be.true();
      });
    });

    experiment('when the form is valid', async () => {
      beforeEach(async () => {
        request.payload = {
          ...ADDRESS,
          csrf_token: CSRF_TOKEN
        };
        await controller.postManualAddressEntry(request, h);
      });

      test('the address is stored in the session with empty strings converted to null', async () => {
        expect(session.merge.calledWith(
          request, KEY, {
            data: {
              ...ADDRESS,
              source: 'wrls',
              uprn: null,
              addressLine1: null,
              addressLine4: null
            }
          }
        )).to.be.true();
      });

      test('redirects to the redirect path', async () => {
        expect(h.redirect.calledWith(REDIRECT_PATH)).to.be.true();
      });
    });
  });
});
