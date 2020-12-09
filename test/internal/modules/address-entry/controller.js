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
const addressForms = require('internal/modules/address-entry/forms');
const forms = require('shared/lib/forms');

const KEY = 'test-key';
const POSTCODE = 'TT1 1TT';
const ADDRESS_ID = uuid();
const UPRN = 1234;

experiment('src/internal/modules/address-entry/pre-handlers .searchForAddressesByPostcode', () => {
  let request, h;

  beforeEach(async () => {
    request = {
      params: {
        key: KEY
      },
      view: {},
      pre: {
        sessionData: {
          caption: 'Licence 01/234',
          back: '/back/path',
          redirectPath: '/redirect/path'
        },
        addressSearchResults: [{
          id: ADDRESS_ID,
          uprn: UPRN
        }]
      },
      payload: {},
      query: {
        postcode: POSTCODE
      }
    };

    h = {
      view: sandbox.stub(),
      redirect: sandbox.stub()
    };
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.getPostcode', () => {
    experiment('when neither form is submitted', async () => {
      beforeEach(async () => {
        request.pre.postcodeForm = addressForms.ukPostcode.form(request);
        request.pre.selectAddressForm = addressForms.selectAddress.form(request);
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
        expect(form).to.equal(request.pre.postcodeForm);
      });
    });

    experiment('when the postcode form is valid', async () => {
      beforeEach(async () => {
        request.pre.postcodeForm = forms.handleRequest(
          addressForms.ukPostcode.form(request),
          request,
          addressForms.ukPostcode.schema(request)
        );
        request.pre.selectAddressForm = addressForms.selectAddress.form(request);
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
        expect(form).to.equal(request.pre.selectAddressForm);
      });
    });

    experiment('when the select address form is submitted', async () => {
      beforeEach(async () => {
        request.pre.postcodeForm = addressForms.ukPostcode.form(request);
        request.pre.selectAddressForm = forms.handleRequest(
          addressForms.selectAddress.form(request),
          request,
          addressForms.selectAddress.schema(request)
        );
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
        expect(form).to.equal(request.pre.selectAddressForm);
      });
    });
  });
});
