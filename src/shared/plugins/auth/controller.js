/**
 * HAPI Route handlers for signing in to account
 * @module controllers/authentication
 */
const { get } = require('lodash');

const { signInForm, signInSchema, signInApplyErrorState } = require('./forms');
const { handleRequest, setValues } = require('shared/lib/forms');

const isAuthenticated = request => !!get(request, 'auth.credentials.userId');

const AmazonCognitoIdentity = require('amazon-cognito-identity-js');

/* idToken, acccessToken lookup */
const validateCognitoUser = async (request, h) => {
  const { email, password } = request.payload;
  // ENVIRONMENT VARIABLES REQUIRED IN ENV FILE:
  // JWT_COGNITO_HOST=
  // JWT_COGNITO_USERPOOLID=
  // JWT_COGNITO_CLIENTID=
  // JWT_COGNITO_REGION=*
  let poolData = {
    UserPoolId: process.env.JWT_COGNITO_USERPOOLID,
    ClientId: process.env.JWT_COGNITO_CLIENTID
  };

  let userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
  let userData = {
    Username: email,
    Pool: userPool
  };
  let cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
  let alreadyLoggedIn = false;
  if (cognitoUser != null) {
    await cognitoUser.getSession(function (err, result) {
      if (err) {
        alreadyLoggedIn = false;
      }
      if (result) {
        alreadyLoggedIn = true;
      }
    });
  }
  // Optional Security feature:
  // If suspected activity, invalidate issued token
  // cognitoUser.globalSignOut(callback);

  let authenticationData = {
    Username: email,
    Password: password
  };
  let authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails(authenticationData);

  cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
  return new Promise((resolve, reject) => {
    if (alreadyLoggedIn) {
      let obj = { result: 'already logged in' };
      return resolve(obj);
    }
    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: function (session) {
        const tokens = {
          accessToken: session.getAccessToken().getJwtToken(),
          idToken: session.getIdToken().getJwtToken(),
          refreshToken: session.getRefreshToken().getToken()
        };
        cognitoUser['tokens'] = tokens; // Save tokens for later use
        resolve(cognitoUser);
      },
      onFailure: function (err) {
        return reject(err);
      },
      newPasswordRequired: function (userAttributes, requiredAttributes) {
        /* User signed up by admin and require password update */

        // remove fields not to update
        delete userAttributes.email_verified;
        delete userAttributes.phone_number_verified;

        // update new Password challenge, password can be same as original
        cognitoUser.completeNewPasswordChallenge(password, userAttributes, this);

        let obj = { result: 'updated password challenge', status: 'done' };
        return resolve(obj);
      }
    });
  });
};
/**
 * View signin page
 * @param {Object} request - the HAPI HTTP request
 * @param {Object} h - the Hapi Response Toolkit
 */
function getSignin (request, h, form) {
  if (isAuthenticated(request)) {
    return h.realm.pluginOptions.ifAuthenticated(request, h);
  }

  const view = {
    ...request.view,
    form: setValues(form || signInForm(), { password: '' }),
    pageTitle: 'Sign in',
    showResetMessage: get(request, 'query.flash') === 'password-reset'
  };

  return h.view('nunjucks/auth/sign-in', view);
}

/**
 * View signout page
 * @param {Object} request - the HAPI HTTP request
 * @param {Object} h - the HAPI response toolkit
 */
async function getSignout (request, h) {
  return request.logOut();
}

/**
 * View signed out page
 * @param {Object} request - the HAPI HTTP request
 * @param {Object} h - the HAPI HTTP response toolkit
 */
async function getSignedOut (request, h) {
  const surveyType = { i: 'internal', e: 'external' };
  request.view.surveyType = surveyType[request.query.u] || 'anonymous';
  request.view.pageTitle = `You're signed out`;
  return h.view('nunjucks/auth/signed-out', request.view);
}

const resetIsRequired = user => !!parseInt(get(user, 'reset_required', false));

/**
 * Process login form request
 * @param {Object} request - the HAPI HTTP request
 * @param {String} request.payload.user_id - the user email address
 * @param {String} request.payload.password - the user password
 * @param {Object} h - the Hapi Response Toolkit
 */
const postSignin = async (request, h) => {
  const form = handleRequest(signInForm(), request, signInSchema, { abortEarly: true });

  // Destroy existing session
  h.realm.pluginOptions.signOut(request);

  // Perform basic validation
  if (!form.isValid) {
    return getSignin(request, h, signInApplyErrorState(form));
  }

  const { email, password } = request.payload;

  // Request JWT token before IM login
  /*
  const res = await validateCognitoUser(request, h);
  if (res) {
    // let accessToken = res.getAccessToken().getJwtToken();
    console.log(JSON.stringify(res));
  } else {
    console.log('Failed to login');
  }
  */
  
  const user = await h.realm.pluginOptions.authenticate(email, password);

  // Forced reset
  if (resetIsRequired(user)) {
    return h.redirect(`/reset_password_change_password?resetGuid=${user.reset_guid}&forced=1`);
  }

  // Auth success
  if (user) {
    return request.logIn(user);
  }

  return getSignin(request, h, signInApplyErrorState(form));
};

exports.getSignin = getSignin;
exports.getSignout = getSignout;
exports.getSignedOut = getSignedOut;
exports.postSignin = postSignin;
