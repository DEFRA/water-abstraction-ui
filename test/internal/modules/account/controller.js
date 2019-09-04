const { expect } = require('@hapi/code');
const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const controller = require('internal/modules/account/controller');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();
const services = require('internal/lib/connectors/services');

const userData = {
  error: null,
  data: {
    user_id: 100,
    user_name: 'test@example.gov.uk',
    groups: ['basic'],
    enabled: true
  }
};

experiment('modules/account/controller', () => {
  let h;
  let request;

  beforeEach(async () => {
    h = {
      view: sandbox.spy(),
      redirect: sandbox.spy()
    };

    request = {
      view: {},
      payload: {
        csrf_token: '00000000-0000-0000-0000-000000000000'
      },
      params: {},
      defra: {},
      yar: {
        get: sandbox.stub().returns('test@example.gov.uk'),
        set: sandbox.stub()
      }
    };

    sandbox.stub(services.idm.users, 'findOneByEmail');
    sandbox.stub(services.idm.users, 'findOneById').resolves(userData);
    sandbox.stub(services.water.users, 'postCreateInternalUser').resolves();
    sandbox.stub(services.water.users, 'disableInternalUser').resolves();
  });

  afterEach(async () => sandbox.restore());

  experiment('.getCreateAccount', async () => {
    test('uses the expected template', async () => {
      await controller.getCreateAccount(request, h);
      const [template] = h.view.lastCall.args;
      expect(template).to.equal('nunjucks/form.njk');
    });

    test('adds a form to the view context', async () => {
      await controller.getCreateAccount(request, h);
      const [, view] = h.view.lastCall.args;
      expect(view.form).to.be.an.object();
    });
  });

  experiment('.postCreateAccount', () => {
    experiment('when the email address is invalid', () => {
      beforeEach(async () => {
        request.payload.email = 'not@valid.email.com';
        await controller.postCreateAccount(request, h);
      });

      test('the create user template is replayed', async () => {
        const [template] = h.view.lastCall.args;
        expect(template).to.equal('nunjucks/form.njk');
      });

      test('the form object contains errors', async () => {
        const [, view] = h.view.lastCall.args;
        const error = view.form.errors.find(e => e.name === 'email');
        expect(error).to.be.an.object();
      });
    });

    experiment('when the email address is already in use', () => {
      beforeEach(async () => {
        request.payload.email = 'existing@ea.gov.uk';
        services.idm.users.findOneByEmail.resolves(userData.data);
        await controller.postCreateAccount(request, h);
      });

      test('gets the user using the email param', async () => {
        const [email] = services.idm.users.findOneByEmail.lastCall.args;
        expect(email).to.equal('existing@ea.gov.uk');
      });

      test('email already in use error is applied', async () => {
        const [, view] = h.view.lastCall.args;
        const error = view.form.errors.find(e => e.message === 'This email address is already in use');
        expect(error).to.be.an.object();
      });
    });

    experiment('when the email address is valid', () => {
      beforeEach(async () => {
        await controller.postCreateAccount(request, h);
      });

      test('redirects to the expected url', async () => {
        const [url] = h.redirect.lastCall.args;
        expect(url).to.equal(`/account/create-user/set-permissions`);
      });
    });
  });

  experiment('.getSetPermissions', () => {
    beforeEach(async () => {
      request.params.userId = 100;
      await controller.getSetPermissions(request, h);
    });

    test('renders the expected template', async () => {
      const [template] = h.view.lastCall.args;
      expect(template).to.equal('nunjucks/form.njk');
    });

    test('sets the correct view data', async () => {
      const [, view] = h.view.lastCall.args;
      expect(view.back).to.equal('/account/create-user');
      expect(view.form).to.be.an.object();
    });
  });

  experiment('.postSetPermissions', () => {
    experiment('when the permisson is invalid', () => {
      beforeEach(async () => {
        request.defra.userId = 100;
        request.payload.permission = '';
        await controller.postSetPermissions(request, h);
      });

      test('the set permissions template is replayed', async () => {
        const [template] = h.view.lastCall.args;
        expect(template).to.equal('nunjucks/form.njk');
      });

      test('the form object contains errors', async () => {
        const [, view] = h.view.lastCall.args;
        const error = view.form.errors.find(e => e.name === 'permission');
        expect(error).to.be.an.object();
      });
    });

    experiment('when the account exists', () => {
      beforeEach(async () => {
        request.defra.userId = 100;
        request.payload.permission = 'environment_officer';
        services.water.users.postCreateInternalUser.rejects({
          statusCode: 409
        });
        await controller.postSetPermissions(request, h);
      });

      test('the set permissions template is replayed', async () => {
        const [template] = h.view.lastCall.args;
        expect(template).to.equal('nunjucks/form.njk');
      });

      test('the form object contains errors', async () => {
        const [, view] = h.view.lastCall.args;
        const error = view.form.errors.find(e => e.name === 'permission');
        expect(error).to.be.an.object();
      });
    });

    experiment('for other API errors', () => {
      beforeEach(async () => {
        request.defra.userId = 100;
        request.payload.permission = 'environment_officer';
        services.water.users.postCreateInternalUser.rejects();
      });

      test('the error is rethrown', async () => {
        const func = () => controller.postSetPermissions(request, h);
        expect(func()).to.reject();
      });
    });
  });

  experiment('.getCreateAccountSuccess', () => {
    beforeEach(async () => {
      request.params.userId = 100;
      services.idm.users.findOneById.resolves(userData.data);
      await controller.getCreateAccountSuccess(request, h);
    });

    test('gets the user using the userId param', async () => {
      const [userId] = services.idm.users.findOneById.lastCall.args;
      expect(userId).to.equal(100);
    });

    test('renders the expected template', async () => {
      const [template] = h.view.lastCall.args;
      expect(template).to.equal('nunjucks/account/create-user-success.njk');
    });

    test('sets the correct view data', async () => {
      const [, view] = h.view.lastCall.args;
      expect(view.userId).to.equal(100);
      expect(view.email).to.equal('test@example.gov.uk');
    });
  });

  experiment('.getDeleteUserAccount', () => {
    beforeEach(async () => {
      request.params.userId = 100;
      services.idm.users.findOneById.resolves(userData.data);
      await controller.getDeleteUserAccount(request, h);
    });

    test('gets the user using the userId param', async () => {
      const [userId] = services.idm.users.findOneById.lastCall.args;
      expect(userId).to.equal(100);
    });

    test('renders the expected template', async () => {
      const [template] = h.view.lastCall.args;
      expect(template).to.equal('nunjucks/form.njk');
    });

    test('sets the correct view data', async () => {
      const [, view] = h.view.lastCall.args;
      expect(view.back).to.equal(`/user/${request.params.userId}/status`);
      expect(view.form).to.be.an.object();
      expect(view.userEmail).to.equal(userData.data.user_name);
    });
  });

  experiment('.postDeleteUserAccount', () => {
    experiment('happy path', () => {
      beforeEach(async () => {
        request.defra.userId = 100; // callingUserId
        request.params.userId = 999; // deletedUserId
        request.payload.confirmDelete = ['confirm'];
        services.water.users.disableInternalUser.resolves();
        await controller.postDeleteUserAccount(request, h);
      });

      test('services.water.users.disableInternalUser is called with expected parameters', async () => {
        expect(services.water.users.disableInternalUser.calledWith(
          request.defra.userId, request.params.userId
        )).to.be.true();
      });

      test('redirects to correct page', async () => {
        const [path] = h.redirect.lastCall.args;
        expect(path).to.equal(`/account/delete-account/${request.params.userId}/success`);
      });
    });

    experiment('when the confirm box was not selected', () => {
      beforeEach(async () => {
        request.defra.userId = 100;
        request.payload.confirmDelete = null;
        await controller.postDeleteUserAccount(request, h);
      });

      test('the template is replayed', async () => {
        const [template] = h.view.lastCall.args;
        expect(template).to.equal('nunjucks/form.njk');
      });

      test('the form object contains errors', async () => {
        const [, view] = h.view.lastCall.args;
        const error = view.form.errors.find(e => e.name === 'confirmDelete');
        expect(error).to.be.an.object();
        expect(error.message).to.equal('Tick the box to confirm you want to delete the account');
      });
    });

    experiment('when the user does not exists', () => {
      beforeEach(async () => {
        request.defra.userId = 100;
        request.payload.confirmDelete = ['confirm'];
        services.idm.users.findOneById.resolves(userData.data);
        services.water.users.disableInternalUser.rejects({
          statusCode: 404
        });
        await controller.postDeleteUserAccount(request, h);
      });

      test('the template is replayed', async () => {
        const [template] = h.view.lastCall.args;
        expect(template).to.equal('nunjucks/form.njk');
      });

      test('the form object contains errors', async () => {
        const [, view] = h.view.lastCall.args;
        const error = view.form.errors.find(e => e.name === 'confirmDelete');
        expect(error).to.be.an.object();
        expect(error.message).to.equal('The account specified does not exist');
      });
    });

    experiment('for other API errors', () => {
      beforeEach(async () => {
        request.defra.userId = 100;
        request.payload.confirmDelete = ['confirm'];
        services.water.users.disableInternalUser.rejects();
      });

      test('the error is rethrown', async () => {
        const func = () => controller.postDeleteUserAccount(request, h);
        expect(func()).to.reject();
      });
    });
  });

  experiment('.getDeleteAccountSuccess', () => {
    beforeEach(async () => {
      request.params.userId = 100;
      services.idm.users.findOneById.resolves(userData.data);
      await controller.getDeleteAccountSuccess(request, h);
    });

    test('gets the user using the userId param', async () => {
      const [userId] = services.idm.users.findOneById.lastCall.args;
      expect(userId).to.equal(100);
    });

    test('renders the expected template', async () => {
      const [template] = h.view.lastCall.args;
      expect(template).to.equal('nunjucks/account/delete-user-success.njk');
    });

    test('sets the correct view data', async () => {
      const [, view] = h.view.lastCall.args;
      expect(view.deletedUser.userId).to.equal(100);
      expect(view.deletedUser.userEmail).to.equal(userData.data.user_name);
    });
  });
});
