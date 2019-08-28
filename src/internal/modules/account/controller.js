const { createUserForm, createUserSchema } = require('./forms/create-user');
const { setPermissionsForm, setPermissionsSchema } = require('./forms/set-permissions');
const { deleteUserForm, deleteUserSchema } = require('./forms/delete-user');
const { handleRequest, applyErrors } = require('shared/lib/forms');
const services = require('internal/lib/connectors/services');
const config = require('internal/config');

const isEnabledAccount = user => user && (user.enabled === true);

const getCreateAccount = async (request, h, formFromPost) => {
  const form = formFromPost || createUserForm(request);

  return h.view(
    'nunjucks/form.njk',
    {
      ...request.view,
      form
    },
    { layout: false }
  );
};

const applyEmailExistsError = (form, field) => {
  const message = 'This email address is already in use';
  return applyErrors(form, [{
    name: field,
    message,
    summary: message
  }]);
};

const postCreateAccount = async (request, h) => {
  const { payload } = request;
  const form = handleRequest(createUserForm(request, payload), request, createUserSchema, {
    abortEarly: true
  });

  const user = await services.idm.users.findOneByEmail(payload.email, config.idm.application);
  if (isEnabledAccount(user)) {
    return getCreateAccount(request, h, applyEmailExistsError(form, 'email'));
  }

  if (form.isValid) {
    request.yar.set('newInternalUserAccountEmail', payload.email);
    return h.redirect(`/account/create-user/set-permissions`);
  }
  return getCreateAccount(request, h, form);
};

const getSetPermissions = async (request, h, formFromPost) => {
  const form = formFromPost || setPermissionsForm(request, null, true);

  return h.view(
    'nunjucks/form.njk',
    {
      ...request.view,
      form,
      back: '/account/create-user'
    },
    { layout: false }
  );
};

const postSetPermissions = async (request, h) => {
  const { userId: callingUserId } = request.defra;
  const { newUserEmail, permission } = request.payload;
  const form = handleRequest(
    setPermissionsForm(request, permission, true),
    request,
    setPermissionsSchema
  );

  if (!form.isValid) {
    return getSetPermissions(request, h, form);
  }

  try {
    const newUser = await services.water.users.postCreateInternalUser(callingUserId, newUserEmail, permission);
    request.yar.clear('newInternalUserAccountEmail');

    return h.redirect(`/account/create-user/${newUser.user_id}/success`);
  } catch (err) {
    // User exists
    if (err.statusCode === 409) {
      return getSetPermissions(request, h, applyEmailExistsError(form, 'permission'));
    }
    throw err;
  }
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

const getDeleteUserAccount = async (request, h, formFromPost) => {
  const { userId } = request.params;
  const { user_name: userEmail } = await services.idm.users.findOneById(userId);
  const form = formFromPost || deleteUserForm(request, userEmail);

  const view = {
    ...request.view,
    userEmail,
    form,
    back: `/user/${userId}/status`
  };

  return h.view('nunjucks/form.njk', view, { layout: false });
};

const postDeleteUserAccount = async (request, h) => {
  const { userId } = request.params;
  const { user_name: userEmail } = await services.idm.users.findOneById(userId);

  const form = handleRequest(
    deleteUserForm(request, userEmail),
    request,
    deleteUserSchema
  );

  if (!form.isValid) {
    return getDeleteUserAccount(request, h, form);
  }
  try {
    await services.water.users.disableInternalUser(request.defra.userId, userId);

    return h.redirect(`/account/delete-account/${userId}/success`);
  } catch (err) {
    if (err.statusCode === 404) {
      const message = 'The account specified does not exist';
      return getDeleteUserAccount(request, h, applyErrors(form, [{
        name: 'confirmDelete',
        message,
        summary: message }]));
    }
    throw (err);
  }
};

const getDeleteAccountSuccess = async (request, h) => {
  const { userId } = request.params;
  const { user_name: userEmail } = await services.idm.users.findOneById(userId);

  return h.view('nunjucks/account/delete-user-success.njk', {
    ...request.view,
    deletedUser: {
      userEmail,
      userId
    }
  }, { layout: false });
};

exports.getCreateAccount = getCreateAccount;
exports.postCreateAccount = postCreateAccount;

exports.getSetPermissions = getSetPermissions;
exports.postSetPermissions = postSetPermissions;

exports.getCreateAccountSuccess = getCreateAccountSuccess;

exports.getDeleteUserAccount = getDeleteUserAccount;
exports.postDeleteUserAccount = postDeleteUserAccount;
exports.getDeleteAccountSuccess = getDeleteAccountSuccess;
