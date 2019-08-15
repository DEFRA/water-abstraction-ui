const { createUserForm, createUserSchema } = require('./forms/create-user');
const { setPermissionsForm, setPermissionsSchema } = require('./forms/set-permissions');
const { handleRequest, applyErrors } = require('shared/lib/forms');
const services = require('internal/lib/connectors/services');
const config = require('internal/config');

const getCreateAccount = async (request, h, formFromPost) => {
  const form = formFromPost || createUserForm(request);

  return h.view(
    'nunjucks/account/create-user.njk',
    {
      ...request.view,
      form
    },
    { layout: false }
  );
};

const postCreateAccount = async (request, h) => {
  const { payload } = request;
  const form = handleRequest(createUserForm(request, payload), request, createUserSchema, {
    abortEarly: true
  });

  const user = await services.idm.users.findOneByEmail(payload.email, config.idm.application);
  if (user) {
    return getCreateAccount(request, h, applyErrors(form, [{
      name: 'email',
      message: 'Email specified is already in use',
      summary: 'Email specified is already in use'
    }]));
  }

  if (form.isValid) {
    request.yar.set('newInternalUserAccountEmail', payload.email);
    return h.redirect(`/account/create-user/set-permissions`);
  }
  return getCreateAccount(request, h, form);
};

const getSetPermissions = async (request, h, formFromPost) => {
  const form = formFromPost || setPermissionsForm(request);

  return h.view(
    'nunjucks/account/set-permissions.njk',
    {
      ...request.view,
      form
    },
    { layout: false }
  );
};

const postSetPermissions = async (request, h) => {
  const { payload } = request;
  const { userId: callingUserId } = request.defra;
  const { newUserEmail, permission } = payload;
  const form = handleRequest(
    setPermissionsForm(request, payload),
    request,
    setPermissionsSchema
  );

  if (form.isValid) {
    const newUser = await services.water.users.postCreateInternalUser(callingUserId, newUserEmail, permission);
    delete request.yar.clear('key');

    return h.redirect(`/account/create-user/${newUser.user_id}/success`);
  }

  return getSetPermissions(request, h, form);
};

const getCreateAccountSuccess = async (request, h) => {
  const user = await services.idm.users.findOneById(request.params.userId);

  return h.view(
    'nunjucks/account/create-user-success.njk',
    {
      ...request.view,
      userId: user.user_id,
      email: user.user_name
    },
    { layout: false }
  );
};

exports.getCreateAccount = getCreateAccount;
exports.postCreateAccount = postCreateAccount;

exports.getSetPermissions = getSetPermissions;
exports.postSetPermissions = postSetPermissions;

exports.getCreateAccountSuccess = getCreateAccountSuccess;
