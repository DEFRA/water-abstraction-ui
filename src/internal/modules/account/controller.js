const { get } = require('lodash');
const { createUserForm, createUserSchema } = require('./forms/create-user');
const { setPermissionsForm, setPermissionsSchema } = require('./forms/set-permissions');
const { handleRequest } = require('shared/lib/forms');
const services = require('internal/lib/connectors/services');
const { throwIfError } = require('@envage/hapi-pg-rest-api');

const getUser = async userId => {
  const { data: user, error } = await services.idm.users.findOne(userId);
  throwIfError(error);
  return user;
};

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

const postCreateAccount = (request, h) => {
  const { payload } = request;
  const form = handleRequest(createUserForm(request, payload), request, createUserSchema, {
    abortEarly: true
  });

  if (form.isValid) {
    // create the user and use the new user's id to redirect
    // to the next step to set up the permissions

    // return h.redirect('/account/create-user/{the-new-user-id}/set-permissions');
  }

  return getCreateAccount(request, h, form);
};

const getSetPermissions = async (request, h, formFromPost) => {
  const user = await getUser(request.params.userId);
  const permission = get(user, 'groups[0]');
  const form = formFromPost || setPermissionsForm(request, permission);

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
  const user = await getUser(request.params.userId);
  const { payload } = request;
  const form = handleRequest(
    setPermissionsForm(request, payload),
    request,
    setPermissionsSchema
  );

  if (form.isValid) {
    // TODO: Update the users permissions

    // then redirect to the success page

    return h.redirect(`/account/create-user/${user.user_id}/success`);
  }

  return getSetPermissions(request, h, form);
};

const getCreateAccountSuccess = async (request, h) => {
  const user = await getUser(request.params.userId);

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
