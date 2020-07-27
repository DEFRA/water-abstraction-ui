'use-strict';

const { expect } = require('@hapi/code');
const { experiment, test, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script();
const dataService = require('../../../../../src/internal/modules/invoice-accounts/lib/data-service');
const uuid = require('uuid');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();
const helpers = require('internal/modules/invoice-accounts/lib/helpers');
const forms = require('../../../../../src/shared/lib/forms/index');

experiment('internal/modules/incoive-accounts/lib/data-service', () => {
  const request = { test: 'request' };
  const regionId = uuid();
  const companyId = uuid();
  const formData = { test: 'data' };
  const tempId = '00000000-0000-0000-0000-000000000000';
  const address = {
    addressId: uuid(),
    addressLine1: 'Rock Farm Partnership',
    addressLine2: 'The Studios',
    addressLine3: 'Courtyards',
    addressLine4: null,
    town: 'Rawkyall',
    county: 'Rawkshire',
    postcode: 'RA1 1WK',
    country: 'England',
    uprn: null
  };

  beforeEach(async () => {
    sandbox.stub(forms, 'getValues').returns({ selectedCompany: '', companySearch: '' });
    sandbox.stub(dataService, 'sessionManager').resolves({});
    sandbox.stub(dataService, 'getCompanyAddresses').returns([address]);
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.processCompanyFormData', () => {
    test('gets the form values using the form data', async () => {
      helpers.processCompanyFormData(request, regionId, companyId, formData);
      const args = forms.getValues.lastCall.args;
      expect(args[0]).to.equal(formData);
    });

    test('returns the correct path if selectedCompany === comapny_search', async () => {
      forms.getValues.returns({ selectedCompany: 'company_search', companySearch: 'test name' });
      const response = helpers.processCompanyFormData(request, regionId, companyId, formData);
      expect(response).to.equal('company-search?filter=test name');
    });

    test('returns the correct path if selectedCompany === companyId', async () => {
      forms.getValues.returns({ selectedCompany: companyId, companySearch: '' });
      const response = helpers.processCompanyFormData(request, regionId, companyId, formData);
      expect(response).to.equal('select-address');
    });

    test('adds the agent: null to session data if selectedCompany === companyId', async () => {
      forms.getValues.returns({ selectedCompany: companyId, companySearch: '' });
      helpers.processCompanyFormData(request, regionId, companyId, formData);
      const args = dataService.sessionManager.lastCall.args;
      expect(args[0]).to.equal({ test: 'request' });
      expect(args[1]).to.equal(regionId);
      expect(args[2]).to.equal(companyId);
      expect(args[3]).to.equal({ agent: null });
    });

    test('adds the agent: null to session data if selectedCompany === companyId', async () => {
      const selectedCompany = uuid();
      forms.getValues.returns({ selectedCompany, companySearch: '' });
      helpers.processCompanyFormData(request, regionId, companyId, formData);
      const args = dataService.sessionManager.lastCall.args;
      expect(args[0]).to.equal({ test: 'request' });
      expect(args[1]).to.equal(regionId);
      expect(args[2]).to.equal(companyId);
      expect(args[3]).to.equal({ agent: selectedCompany });
    });
  });

  experiment('.processFaoFormData', () => {
    test('if addFao === yes', () => {
      const response = helpers.processFaoFormData(request, regionId, companyId, 'yes');
      expect(response).to.equal('search-contact');
    });

    test('if addFao === no returns the correct redirect path element', () => {
      const response = helpers.processFaoFormData(request, regionId, companyId, 'no');
      expect(response).to.equal('check-details');
    });
    test('if addFao === no returns the correct details are saved in the session', () => {
      helpers.processFaoFormData(request, regionId, companyId, 'no');
      const args = dataService.sessionManager.lastCall.args;
      expect(args[0]).to.equal({ test: 'request' });
      expect(args[1]).to.equal(regionId);
      expect(args[2]).to.equal(companyId);
      expect(args[3]).to.equal({ contact: null });
    });
  });

  experiment('.getSelectedAddress', () => {
    test('returns the session address when the session address id === tempId', async () => {
      const response = await helpers.getSelectedAddress(companyId, { address: { addressId: tempId, addressLine1: 'test' } });
      expect(response).to.equal({ addressId: tempId, addressLine1: 'test' });
    });

    test('returns the address from the data service is the address != tempId', async () => {
      const response = await helpers.getSelectedAddress(companyId, { address: { addressId: address.addressId } });
      expect(response).to.equal(address);
    });
  });
});
