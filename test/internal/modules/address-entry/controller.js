'use strict';

const { expect } = require('@hapi/code');
const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const sandbox = require('sinon').createSandbox();

const queryString = require('querystring');

const sessionForms = require('shared/lib/session-forms');
const forms = require('shared/lib/forms');
const newAddress = require('internal/lib/new-address');
const addressEntryForms = require('internal/modules/address-entry/forms');
const addressEntryHelpers = require('internal/modules/address-entry/lib/helpers');
const controller = require('internal/modules/address-entry/controller');

const POSTCODE = 'TT1 1TT';
const addressFlowData = {
  back: '/back/link',
  redirectPath: '/redirect/path',
  licenceNumber: '12/34/56'
};

const addressSearchResults = [{
  address2: '123',
  address3: 'Test Place',
  town: 'Testington',
  postcode: POSTCODE,
  country: 'United Kingdom',
  uprn: 123456
}, {
  address2: '456',
  address3: 'Test Place',
  town: 'Testington',
  postcode: POSTCODE,
  country: 'United Kingdom',
  uprn: 987654
}];

const createRequest = (options = {}) => ({
  query: options.query || {},
  payload: options.payload || {
    postcode: POSTCODE
  },
  view: {
    foo: 'bar'
  },
  yar: {
    get: sandbox.stub().returns(addressFlowData),
    clear: sandbox.stub()
  }
});

const h = {
  view: sandbox.stub(),
  redirect: sandbox.stub(),
  postRedirectGet: sandbox.stub()
};

experiment('internal/modules/address-entry', () => {
  beforeEach(() => {
    sandbox.stub(sessionForms, 'get').returns({ form: 'object' });
    sandbox.stub(forms, 'handleRequest');
    sandbox.stub(newAddress, 'set');

    sandbox.stub(addressEntryHelpers, 'saveReferenceData');
    sandbox.stub(addressEntryHelpers, 'setAddressSearchResults');
    sandbox.stub(addressEntryHelpers, 'getAddressSearchResults').returns(addressSearchResults);

    sandbox.stub(addressEntryForms.ukPostcode, 'form').returns({ ukPostcode: 'form' });
    sandbox.stub(addressEntryForms.ukPostcode, 'schema');
    sandbox.stub(addressEntryForms.selectAddress, 'form').returns({ selectAddress: 'form' });
    sandbox.stub(addressEntryForms.selectAddress, 'schema');
    sandbox.stub(addressEntryForms.manualAddressEntry, 'form').returns({ manualAddressEntry: 'form' });
    sandbox.stub(addressEntryForms.manualAddressEntry, 'schema');
    sandbox.stub(addressEntryForms.manualAddressEntry, 'applyRequiredFieldErrors');
  });

  afterEach(() => sandbox.restore());

  experiment('.getPostcode', () => {
    let request;
    beforeEach(() => {
      request = createRequest({ query: {
        back: addressFlowData.back,
        redirectPath: addressFlowData.redirectPath,
        licenceId: 'test-licence-id'
      } });
      controller.getPostcode(request, h);
    });

    test('saves the query data', () => {
      const [requestObject] = addressEntryHelpers.saveReferenceData.lastCall.args;
      expect(requestObject).to.equal(request);
    });

    test('uses the expected template', () => {
      const [template] = h.view.lastCall.args;
      expect(template).to.equal('nunjucks/address-entry/enter-uk-postcode');
    });

    test('contains the expected view data', () => {
      const [, view] = h.view.lastCall.args;
      expect(view.foo).to.equal('bar');
      expect(view.pageTitle).to.equal('Enter the UK postcode');
      expect(view.back).to.equal(request.query.back);
      expect(view.form).to.be.an.object();
      expect(view.caption).to.equal(`Licence ${addressFlowData.licenceNumber}`);
    });
  });

  experiment('.postPostcode', () => {
    let request;
    beforeEach(() => {
      forms.handleRequest.returns({ isValid: true });
      request = createRequest();
      controller.postPostcode(request, h);
    });

    test('calls handleRequest with expected params', () => {
      const [form, requestObject, schema] = forms.handleRequest.lastCall.args;
      expect(form).to.equal({ ukPostcode: 'form' });
      expect(requestObject).to.equal(request);
      expect(schema).to.be.an.object();
    });

    test('redirects to the expected path when form is valid', () => {
      const expectedPath = `/address-entry/address/select?${queryString.stringify({ postcode: POSTCODE })}`;
      const [redirectPath] = h.redirect.lastCall.args;
      expect(redirectPath).to.equal(expectedPath);
    });

    test('redirects with the form and expected path when form is not valid', () => {
      forms.handleRequest.returns({ isValid: false });
      const queryParams = {
        redirectPath: addressFlowData.redirectPath,
        back: addressFlowData.back
      };
      const expectedPath = `/address-entry/postcode`;

      controller.postPostcode(request, h);

      const [formObject, redirectPath, query] = h.postRedirectGet.lastCall.args;
      expect(formObject).to.equal({ isValid: false });
      expect(redirectPath).to.equal(expectedPath);
      expect(query).to.equal(queryParams);
    });
  });

  experiment('.getSelectAddress', () => {
    let request;
    beforeEach(() => {
      request = createRequest();
      controller.getSelectAddress(request, h);
    });

    test('saves the address search results', () => {
      const [requestObject] = addressEntryHelpers.setAddressSearchResults.lastCall.args;
      expect(requestObject).to.equal(request);
    });

    test('uses the expected template', () => {
      const [template] = h.view.lastCall.args;
      expect(template).to.equal('nunjucks/address-entry/select-address');
    });

    test('contains the expected view data', () => {
      const { redirectPath, back } = addressFlowData;
      const expectedBack = `/address-entry/postcode?${queryString.stringify({ redirectPath, back })}`;
      const [, view] = h.view.lastCall.args;
      expect(view.foo).to.equal('bar');
      expect(view.pageTitle).to.equal('Select the address');
      expect(view.back).to.equal(expectedBack);
      expect(view.postcode).to.equal(POSTCODE);
      expect(view.form).to.be.an.object();
      expect(view.caption).to.equal(`Licence ${addressFlowData.licenceNumber}`);
    });
  });

  experiment('.postSelectAddress', () => {
    let request;
    beforeEach(() => {
      forms.handleRequest.returns({ isValid: true });
      request = createRequest({ payload: { uprn: '123456' } });
      controller.postSelectAddress(request, h);
    });

    test('calls handleRequest with expected params', () => {
      const [form, requestObject, schema] = forms.handleRequest.lastCall.args;
      expect(form).to.equal({ selectAddress: 'form' });
      expect(requestObject).to.equal(request);
      expect(schema).to.be.an.object();
    });

    experiment('when form is valid', () => {
      test('stores the correct address', () => {
        const [, selectedAddress] = newAddress.set.lastCall.args;
        expect(selectedAddress).to.equal(addressSearchResults[0]);
      });

      test('redirects to the expected path', () => {
        const [redirectPath] = h.redirect.lastCall.args;
        expect(redirectPath).to.equal(addressFlowData.redirectPath);
      });
    });

    test('redirects with the form and expected path when form is not valid', () => {
      forms.handleRequest.returns({ isValid: false });

      controller.postSelectAddress(request, h);

      const [formObject] = h.postRedirectGet.lastCall.args;
      expect(formObject).to.equal({ isValid: false });
    });
  });

  experiment('.getManualAddressEntry', () => {
    let request;
    beforeEach(() => {
      request = createRequest();
      controller.getManualAddressEntry(request, h);
    });

    test('uses the expected template', () => {
      const [template] = h.view.lastCall.args;
      expect(template).to.equal('nunjucks/form');
    });

    test('contains the expected view data', () => {
      const { redirectPath, back } = addressFlowData;
      const expectedBack = `/address-entry/postcode?${queryString.stringify({ redirectPath, back })}`;
      const [, view] = h.view.lastCall.args;
      expect(view.foo).to.equal('bar');
      expect(view.pageTitle).to.equal('Enter the address');
      expect(view.back).to.equal(expectedBack);
      expect(view.form).to.be.an.object();
      expect(view.caption).to.equal(`Licence ${addressFlowData.licenceNumber}`);
    });

    test('contains the expected back link when a country param is present in the query', () => {
      request = createRequest({ query: {
        country: 'United Kingdom'
      } });
      controller.getManualAddressEntry(request, h);
      const [, view] = h.view.lastCall.args;
      expect(view.back).to.equal('/address-entry/address/select');
    });
  });

  experiment('.postManualAddressEntry', () => {
    let request, addressData;
    beforeEach(() => {
      forms.handleRequest.returns({ manualAddressEntry: 'form' });
      addressEntryForms.manualAddressEntry.applyRequiredFieldErrors
        .returns({ isValid: true });

      addressData = {
        address2: '123',
        address3: 'Test Place',
        town: 'Testington',
        postcode: POSTCODE,
        country: 'United Kingdom' };
      request = createRequest({ payload: { ...addressData,
        crsf_token: '111111111-1111-1111-1111-111111111111' } });
      controller.postManualAddressEntry(request, h);
    });

    test('calls handleRequest with expected params', () => {
      const [form, requestObject, schema] = forms.handleRequest.lastCall.args;
      expect(form).to.equal({ manualAddressEntry: 'form' });
      expect(requestObject).to.equal(request);
      expect(schema).to.be.an.object();
    });

    experiment('when form is valid', () => {
      test('stores the address data in the payload', () => {
        const { csrfToken, ...payload } = request.payload;
        const [, address] = newAddress.set.lastCall.args;
        expect(address).to.equal(payload);
        expect(address).to.not.contain(csrfToken);
      });

      test('applies required field errors', () => {
        const [form, payload] = addressEntryForms.manualAddressEntry.applyRequiredFieldErrors.lastCall.args;
        expect(form).to.equal({ manualAddressEntry: 'form' });
        expect(payload).to.equal(request.payload);
      });

      test('redirects to the expected path', () => {
        const [redirectPath] = h.redirect.lastCall.args;
        expect(redirectPath).to.equal(addressFlowData.redirectPath);
      });
    });

    test('redirects with the form and expected path when form is not valid', () => {
      addressEntryForms.manualAddressEntry.applyRequiredFieldErrors
        .returns({ isValid: false });

      controller.postManualAddressEntry(request, h);

      const [formObject] = h.postRedirectGet.lastCall.args;
      expect(formObject).to.equal({ isValid: false });
    });
  });
});
