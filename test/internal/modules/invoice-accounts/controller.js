'use-strict';
const { expect } = require('@hapi/code');
const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const controller = require('internal/modules/invoice-accounts/controller');
const uuid = require('uuid');
const sandbox = require('sinon').createSandbox();
const dataService = require('internal/modules/invoice-accounts/lib/data-service');
const forms = require('../../../../src/shared/lib/forms/index');
const moment = require('moment');

experiment('./internal/modules/invoice-accounts/controller', () => {
  const regionId = uuid();
  const companyId = uuid();
  const licenceId = uuid();
  const licenceNumber = '01/123';
  const companyName = 'test company name';
  let h, request;

  const secondHeader = sandbox.stub();
  const header = sandbox.stub().returns({ header: secondHeader });

  const sessionData = (companyId, regionId, data) => {
    return { companyId, regionId, ...data };
  };

  beforeEach(async => {
    sandbox.stub(dataService, 'getLicenceById').resolves({ licenceNumber });
    sandbox.stub(dataService, 'getCompany').resolves({ name: companyName });
    sandbox.stub(dataService, 'sessionManager').returns(sessionData(companyId, regionId, { viewData: { licenceNumber, licenceId, companyName } }));
    sandbox.stub(dataService, 'getCompanyAddresses').returns([]);
    sandbox.stub(dataService, 'saveInvoiceAccDetails').resolves({ id: 'test-uuid-for-invoice-account' });
    sandbox.stub(forms, 'handleRequest').returns({ isValid: true });
    sandbox.stub(forms, 'getValues').returns({});

    request = {
      params: {
        regionId,
        companyId
      },
      query: {
        redirectPath: '/somewhere',
        licenceId
      },
      view: {},
      yar: {
        get: sandbox.stub().returns({}),
        set: sandbox.stub(),
        clear: sandbox.stub()
      }
    };

    h = {
      view: sandbox.stub(),
      response: sandbox.stub().returns({ header }),
      redirect: sandbox.stub(),
      postRedirectGet: sandbox.stub()
    };
  });

  afterEach(async => {
    sandbox.restore();
  });

  experiment('.getCompany', () => {
    beforeEach(async () => {
      await controller.getCompany(request, h);
    });
    test('calls dataService.getLicenceById with the correct query param', async () => {
      const args = dataService.getLicenceById.lastCall.args;
      expect(args[0]).to.equal(licenceId);
    });
    test('calls dataService.getCompany with the correct companyId', async () => {
      const args = dataService.getCompany.lastCall.args;
      expect(args[0]).to.equal(companyId);
    });
    test('calls sessionManager with the correct params', async () => {
      const viewData = { viewData: { redirectPath: '/somewhere', licenceNumber, licenceId, companyName } };
      const args = dataService.sessionManager.lastCall.args;
      expect(args[0]).to.equal(request);
      expect(args[1]).to.equal(regionId);
      expect(args[2]).to.equal(companyId);
      expect(args[3]).to.equal(viewData);
    });
    test('the expected view template is used', async () => {
      const args = h.view.lastCall.args;
      expect(args[0]).to.equal('nunjucks/form');
    });
    test('the correct page title is assigned', async () => {
      const { pageTitle } = h.view.lastCall.args[1];
      expect(pageTitle).to.equal('Who should the bills go to?');
    });
    test('the caption has the correct value assigned', async () => {
      const { caption } = h.view.lastCall.args[1];
      expect(caption).to.equal('Licence 01/123');
    });
    test('view context is assigned a back link path for type', async () => {
      const { back } = h.view.lastCall.args[1];
      expect(back).to.equal('/manage');
    });
  });

  experiment('.getCompany with no licenceId in request.query', () => {
    test('the caption has the correct value assigned if the licenceId was not provided', async () => {
      delete request.query.licenceId;
      await controller.getCompany(request, h);
      const { caption } = h.view.lastCall.args[1];
      expect(caption).to.equal('');
    });
  });

  experiment('.postCompany', () => {
    beforeEach(async () => {
      request.payload = {
        companyId,
        regionId
      };
    });

    test('dataService.getCompany is called with the companyId', async () => {
      await controller.postCompany(request, h);
      const args = dataService.getCompany.lastCall.args;
      expect(args[0]).to.equal(companyId);
    });

    experiment('when the form is valid', () => {
      test('and the companyId selected = companyId then agent = null', async () => {
        forms.getValues.returns({
          selectedCompany: companyId,
          companySearch: null });
        await controller.postCompany(request, h);
        const args = dataService.sessionManager.lastCall.args;
        expect(args[0]).to.equal(request);
        expect(args[1]).to.equal(regionId);
        expect(args[2]).to.equal(companyId);
        expect(args[3]).to.equal({ agent: null });
      });
      test('and a company has been selected the user is rdirected to the select address path', async () => {
        forms.getValues.returns({
          selectedCompany: companyId,
          companySearch: null });
        await controller.postCompany(request, h);
        const args = h.redirect.lastCall.args;
        const redirectPath = `/invoice-accounts/create/${regionId}/${companyId}/select-address`;
        expect(args[0]).to.equal(redirectPath);
      });
      test('and a company search name has been entered the user is rdirected to the search company path', async () => {
        forms.getValues.returns({
          selectedCompany: 'company_search',
          companySearch: 'Company Name To Search for' });
        await controller.postCompany(request, h);
        const args = h.redirect.lastCall.args;
        const redirectPath = `/invoice-accounts/create/${regionId}/${companyId}/company-search?filter=Company Name To Search for`;
        expect(args[0]).to.equal(redirectPath);
      });
    });
    experiment('when the form is not valid', () => {
      test('the user is redirected back to select company form', async () => {
        forms.handleRequest.returns({ isValid: false });
        dataService.sessionManager.returns({ viewData: { redirectPath: '/somewhere' } });
        await controller.postCompany(request, h);
        const args = h.postRedirectGet.lastCall.args;
        expect(args[1]).to.equal(`/invoice-accounts/create/${regionId}/${companyId}`);
        expect(args[2]).to.equal({ redirectPath: '/somewhere' });
      });
    });
  });

  experiment('.getAddress', () => {
    beforeEach(async () => {
      await controller.getAddress(request, h);
    });
    test('calls dataService.getCompanyAddresses with the correct query param', async () => {
      const args = dataService.getCompanyAddresses.lastCall.args;
      expect(args[0]).to.equal(companyId);
    });
    test('calls dataService.sessionManager with the correct params', async () => {
      const args = dataService.sessionManager.lastCall.args;
      expect(args[0]).to.equal(request);
      expect(args[1]).to.equal(regionId);
      expect(args[2]).to.equal(companyId);
      // no data to merge is passed to the session
      expect(args[3]).to.equal(undefined);
      expect(dataService.sessionManager.calledOnce).to.be.true();
    });
    test('the expected view template is used', async () => {
      const args = h.view.lastCall.args;
      expect(args[0]).to.equal('nunjucks/form');
    });
    test('the correct page title is assigned', async () => {
      const { pageTitle } = h.view.lastCall.args[1];
      expect(pageTitle).to.equal(`Select an existing address for ${companyName}`);
    });
    test('the caption has the correct value assigned', async () => {
      const { caption } = h.view.lastCall.args[1];
      expect(caption).to.equal('Licence 01/123');
    });
    test('view context is assigned a back link path for type', async () => {
      const { back } = h.view.lastCall.args[1];
      expect(back).to.equal('/manage');
    });
  });

  experiment('.postAddress', () => {
    beforeEach(async () => {
      request.payload = {
        companyId,
        regionId
      };
    });

    test('dataService.getCompanyAddresses is called with the companyId', async () => {
      await controller.postAddress(request, h);
      const args = dataService.getCompanyAddresses.lastCall.args;
      expect(args[0]).to.equal(companyId);
    });

    experiment('when the form is valid', () => {
      test('the address id is stored in the session data', async () => {
        forms.getValues.returns({ selectedAddress: 'test-address-id' });
        await controller.postAddress(request, h);
        const args = dataService.sessionManager.lastCall.args;
        expect(args[0]).to.equal(request);
        expect(args[1]).to.equal(regionId);
        expect(args[2]).to.equal(companyId);
        expect(args[3]).to.equal({ address: { addressId: 'test-address-id' } });
      });
      test('when an existing address has been selected the user is redirected to the add-fao path', async () => {
        forms.getValues.returns({ selectedAddress: 'test-address-id' });
        await controller.postAddress(request, h);
        const args = h.redirect.lastCall.args;
        const redirectPath = `/invoice-accounts/create/${regionId}/${companyId}/add-fao`;
        expect(args[0]).to.equal(redirectPath);
      });
      test('when selectedAddress = new_address the user is rdirected to the search address path', async () => {
        forms.getValues.returns({ selectedAddress: 'new_address' });
        await controller.postAddress(request, h);
        const args = h.redirect.lastCall.args;
        const redirectPath = `/invoice-accounts/create/${regionId}/${companyId}/create-address`;
        expect(args[0]).to.equal(redirectPath);
      });
    });
    experiment('when the form is not valid', () => {
      test('the user is redirected back to select addresss form', async () => {
        forms.handleRequest.returns({ isValid: false });
        await controller.postAddress(request, h);
        const args = h.postRedirectGet.lastCall.args;
        expect(args[1]).to.equal(`/invoice-accounts/create/${regionId}/${companyId}/select-address`);
      });
    });
  });
  experiment('.getFao', () => {
    beforeEach(async () => {
      await controller.getFao(request, h);
    });
    test('calls dataService.sessionManager with the correct params', async () => {
      const args = dataService.sessionManager.lastCall.args;
      expect(args[0]).to.equal(request);
      expect(args[1]).to.equal(regionId);
      expect(args[2]).to.equal(companyId);
      // no data to merge is passed to the session
      expect(args[3]).to.equal(undefined);
      expect(dataService.sessionManager.calledOnce).to.be.true();
    });
    test('the expected view template is used', async () => {
      const args = h.view.lastCall.args;
      expect(args[0]).to.equal('nunjucks/form');
    });
    test('the correct page title is assigned', async () => {
      const { pageTitle } = h.view.lastCall.args[1];
      expect(pageTitle).to.equal('Do you need to add an FAO?');
    });
    test('the caption has the correct value assigned', async () => {
      const { caption } = h.view.lastCall.args[1];
      expect(caption).to.equal('Licence 01/123');
    });
    test('view context is assigned a back link path for type', async () => {
      const { back } = h.view.lastCall.args[1];
      expect(back).to.equal('/manage');
    });
  });

  experiment('.postFao', () => {
    beforeEach(async () => {
      request.payload = {
        companyId,
        regionId
      };
    });
    experiment('when the form is valid', () => {
      test('and faoRequired = no the contact is set to null in the session data', async () => {
        forms.getValues.returns({ faoRequired: 'no' });
        await controller.postFao(request, h);
        const args = dataService.sessionManager.lastCall.args;
        expect(args[0]).to.equal(request);
        expect(args[1]).to.equal(regionId);
        expect(args[2]).to.equal(companyId);
        expect(args[3]).to.equal({ contact: null });
      });
      test('and faoRequired = no the user is redirected to the check-details path', async () => {
        forms.getValues.returns({ faoRequired: 'no' });
        await controller.postFao(request, h);
        const args = h.redirect.lastCall.args;
        const redirectPath = `/invoice-accounts/create/${regionId}/${companyId}/check-details`;
        expect(args[0]).to.equal(redirectPath);
      });
      test('and faoRequired = yes the user is redirected to the select-fao path', async () => {
        forms.getValues.returns({ faoRequired: 'yes' });
        await controller.postFao(request, h);
        const args = h.redirect.lastCall.args;
        const redirectPath = `/invoice-accounts/create/${regionId}/${companyId}/search-contact`;
        expect(args[0]).to.equal(redirectPath);
      });
    });
    experiment('when the form is not valid', () => {
      test('the user is redirected back to select addresss form', async () => {
        forms.handleRequest.returns({ isValid: false });
        await controller.postFao(request, h);
        const args = h.postRedirectGet.lastCall.args;
        expect(args[1]).to.equal(`/invoice-accounts/create/${regionId}/${companyId}/add-fao`);
      });
    });
  });

  experiment('.getCheckDetails', () => {
    beforeEach(async () => {
      await controller.getCheckDetails(request, h);
    });
    test('calls dataService.sessionManager with the correct params', async () => {
      const args = dataService.sessionManager.lastCall.args;
      expect(args[0]).to.equal(request);
      expect(args[1]).to.equal(regionId);
      expect(args[2]).to.equal(companyId);
      // no data to merge is passed to the session
      expect(args[3]).to.equal(undefined);
      expect(dataService.sessionManager.calledOnce).to.be.true();
    });
    test('calls dataService.getCompany with the correct query param', async () => {
      const args = dataService.getCompany.lastCall.args;
      expect(args[0]).to.equal(companyId);
    });
    test('calls dataService.getCompanyAddresses with the correct query param', async () => {
      const args = dataService.getCompanyAddresses.lastCall.args;
      expect(args[0]).to.equal(companyId);
    });
    test('the expected view template is used', async () => {
      const args = h.view.lastCall.args;
      expect(args[0]).to.equal('nunjucks/invoice-accounts/check-details');
    });
    test('the correct page title is assigned', async () => {
      const { pageTitle } = h.view.lastCall.args[1];
      expect(pageTitle).to.equal('Check billing account details');
    });
    test('the caption has the correct value assigned', async () => {
      const { caption } = h.view.lastCall.args[1];
      expect(caption).to.equal('Licence 01/123');
    });
    test('view context is assigned a back link path for type', async () => {
      const { back } = h.view.lastCall.args[1];
      expect(back).to.equal('/manage');
    });
  });

  experiment('.postCheckDetails', () => {
    beforeEach(async () => {
      request.payload = {
        companyId,
        regionId
      };
      await controller.postCheckDetails(request, h);
    });

    test('calls dataService.sessionManager with the correct params', async () => {
      const args = dataService.sessionManager.lastCall.args;
      expect(args[0]).to.equal(request);
      expect(args[1]).to.equal(regionId);
      expect(args[2]).to.equal(companyId);
      // no data to merge is passed to the session
      expect(args[3]).to.equal(undefined);
      expect(dataService.sessionManager.calledOnce).to.be.true();
    });
    test('calls the dataservice.saveInvoiceAccountDetails with the correct data shape and params', () => {
      const startDate = moment().format('YYYY-MM-DD');
      const details = { companyId, regionId, startDate };
      const [ args ] = dataService.saveInvoiceAccDetails.lastCall.args;
      expect(args).to.equal(details);
    });
  });
});
