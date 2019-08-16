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
    groups: ['basic']
  }
};

experiment('account/controller', () => {
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
        _store: {}
      }
    };

    sandbox.stub(services.idm.users, 'findOneByEmail');
    sandbox.stub(services.idm.users, 'findOneById').resolves(userData);
    sandbox.stub(services.water.users, 'postCreateInternalUser').resolves();
  });

  afterEach(async () => sandbox.restore());

  experiment('.getCreateAccount', async () => {
    test('uses the expected template', async () => {
      await controller.getCreateAccount(request, h);
      const [template] = h.view.lastCall.args;
      expect(template).to.equal('nunjucks/account/create-user.njk');
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
        expect(template).to.equal('nunjucks/account/create-user.njk');
      });

      test('the form object contains errors', async () => {
        const [, view] = h.view.lastCall.args;
        const error = view.form.errors.find(e => e.name === 'email');
        expect(error).to.be.an.object();
      });
    });

    experiment('when the email address is already in use', () => {
      beforeEach(async () => {
        request.payload.email = 'existing@email.com';
        services.idm.users.findOneByEmail.resolves(userData);
        await controller.postCreateAccount(request, h);
      });

      test('gets the user using the email param', async () => {
        const [email] = services.idm.users.findOneByEmail.lastCall.args;
        expect(email).to.equal('existing@email.com');
      });

      test('email already in use error is applied', async () => {
        const [, view] = h.view.lastCall.args;
        const error = view.form.errors.find(e => e.message === 'Email specified is already in use');
        expect(error).to.be.an.object();
      });
    });

    experiment('when the email address is valid', () => {
      beforeEach(async () => {
        request.yar.set = sandbox.spy();
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
      expect(template).to.equal('nunjucks/account/set-permissions.njk');
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
        expect(template).to.equal('nunjucks/account/set-permissions.njk');
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
        expect(template).to.equal('nunjucks/account/set-permissions.njk');
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
      request.yar._store = { newInternalUserAccountEmail: 'test@example.gov.uk' };
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

    test('adds the user id to the view context', async () => {
      const [, view] = h.view.lastCall.args;
      expect(view.userId).to.equal(100);
    });

    test('adds the email address to the view context', async () => {
      const [, view] = h.view.lastCall.args;
      expect(view.email).to.equal('test@example.gov.uk');
    });
  });
});
