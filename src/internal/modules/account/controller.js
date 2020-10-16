const { createUserForm, createUserSchema } = require('./forms/create-user');
const { setPermissionsForm, setPermissionsSchema } = require('./forms/set-permissions');
const { deleteUserForm, deleteUserSchema } = require('./forms/delete-user');
const { reinstateUserForm, reinstateUserSchema } = require('./forms/reinstate-user');
const { handleRequest, applyErrors } = require('shared/lib/forms');
const services = require('internal/lib/connectors/services');
const config = require('internal/config');

const isEnabledAccount = user => user && (user.enabled === true);

const getCreateAccount = async (request, h, formFromPost) => {
  const form = formFromPost || createUserForm(request);
  return h.view('nunjucks/form', { ...request.view, form });
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

  return h.view('nunjucks/form', {
    ...request.view,
    form,
    back: '/account/create-user'
  });
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

  return h.view('nunjucks/account/create-user-success', {
    ...request.view,
    userId: user.user_id,
    email: user.user_name
  });
};

const getManageAccounts = async (request, h) => {
  const users = await services.idm.users.findAll({ application: 'water_admin' });
  return h.view('nunjucks/account/accounts', { ...request.view, users });
};

const getDeleteUserAccount = async (request, h, formFromPost) => {
  const { userId } = request.params;
  const { user_name: userEmail } = await services.idm.users.findOneById(userId);
  const form = formFromPost || deleteUserForm(request, userEmail);

  const view = {
    ...request.view,
    userEmail,
    form,
    back: `/accounts`
  };

  return h.view('nunjucks/form', view);
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
        summary: message
      }]));
    }
    throw (err);
  }
};

const getDeleteAccountSuccess = async (request, h) => {
  const { userId } = request.params;
  const { user_name: userEmail } = await services.idm.users.findOneById(userId);

  return h.view('nunjucks/account/delete-user-success', {
    ...request.view,
    deletedUser: {
      userEmail,
      userId
    }
  });
};

const getReinstateUserAccount = async (request, h, formFromPost) => {
  const { userId } = request.params;
  const { user_name: userEmail } = await services.idm.users.findOneById(userId);
  const form = formFromPost || reinstateUserForm(request, userEmail);

  const view = {
    ...request.view,
    userEmail,
    form,
    back: `/accounts`
  };

  return h.view('nunjucks/form', view);
};

const postReinstateUserAccount = async (request, h) => {
  const { userId } = request.params;
  const { user_name: userEmail } = await services.idm.users.findOneById(userId);

  const form = handleRequest(
    reinstateUserForm(request, userEmail),
    request,
    reinstateUserSchema
  );

  if (!form.isValid) {
    return getReinstateUserAccount(request, h, form);
  }
  try {
    await services.water.users.enableInternalUser(request.defra.userId, userId);

    return h.redirect(`/account/reinstate-account/${userId}/success`);
  } catch (err) {
    if (err.statusCode === 404) {
      const message = 'The account specified does not exist';
      return getReinstateUserAccount(request, h, applyErrors(form, [{
        name: 'confirmReinstate',
        message,
        summary: message
      }]));
    }
    throw (err);
  }
};

const getReinstateUserAccountSuccess = async (request, h) => {
  const { userId } = request.params;
  const { user_name: userEmail } = await services.idm.users.findOneById(userId);

  return h.view('nunjucks/account/reinstate-user-success', {
    ...request.view,
    reinstatedUser: {
      userEmail,
      userId
    }
  });
};

exports.getCreateAccount = getCreateAccount;
exports.postCreateAccount = postCreateAccount;

exports.getSetPermissions = getSetPermissions;
exports.postSetPermissions = postSetPermissions;

exports.getCreateAccountSuccess = getCreateAccountSuccess;

exports.getManageAccounts = getManageAccounts;

exports.getDeleteUserAccount = getDeleteUserAccount;
exports.postDeleteUserAccount = postDeleteUserAccount;
exports.getDeleteAccountSuccess = getDeleteAccountSuccess;

exports.getReinstateUserAccount = getReinstateUserAccount;
exports.postReinstateUserAccount = postReinstateUserAccount;
exports.getReinstateAccountSuccess = getReinstateUserAccountSuccess;
