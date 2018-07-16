const { set } = require('lodash');
const { getUserData, setUserData } = require('./lib/user-data.js');

/**
 * Maps form validator plugin errors to those required by the contact
 * details partial
 * @param {Object} errors - from the form validator plugin
 * @return {Object} - errors in format required for Handlebars contact partial
 */
const mapErrors = (errors) => {
  return {
    contactName: errors['contact-name_empty'],
    contactJobTitle: errors['contact-job-title_empty'],
    contactTel: errors['contact-tel_empty'],
    contactEmail: errors['contact-email_empty'] || errors['contact-email_email'],
    contactAddress: errors['contact-address_empty']
  };
};

/**
 * Maps posted form data to format required by view partial
 * @param {Object} payload - from request.payload
 * @return {Object} with values mapped to names for view partial
 */
const mapPost = (payload) => {
  return {
    name: payload['contact-name'],
    jobTitle: payload['contact-job-title'],
    redirect: payload['redirect'],
    tel: payload['contact-tel'],
    email: payload['contact-email'],
    address: payload['contact-address']
  };
};

/**
 * Gets data to send to view when form is in error state
 * @param {Object} HAPI request
 * @return {Object} view context data
 */
const getErrorViewContext = (request) => {
  const contactDetails = mapPost(request.payload);
  return {
    ...request.view,
    error: mapErrors(request.view.errors),
    contactDetails
  };
};

/**
 * Display form for admin user to enter their name and job role
 * prior to entering notification flow
 */
const getNameAndJob = async (request, h) => {
  // WHere to redirect after flow complete
  const { redirect } = request.query;
  request.sessionStore.set('redirect', redirect);

  // Load user data from IDM
  const { contactDetails = {} } = await getUserData(request.auth.credentials.user_id);

  request.sessionStore.set('notificationContactDetails', {
    contactDetails,
    redirect
  });

  return h.view('water/notifications/contact-name-job', {
    ...request.view,
    contactDetails
  });
};

/**
 * Post handler for name/role form
 * If valid, saves data to session and redirects to next screen
 * otherwise redisplays form with error message
 */
const postNameAndJob = async (request, h) => {
  const contactDetails = mapPost(request.payload);

  if (request.formError) {
    return h.view('water/notifications/contact-name-job', getErrorViewContext(request));
  }

  // Merge updated fields to user_data
  let userData = await getUserData(request.auth.credentials.user_id);
  set(userData, 'contactDetails.name', contactDetails.name);
  set(userData, 'contactDetails.jobTitle', contactDetails.jobTitle);
  await setUserData(request.auth.credentials.user_id, userData);

  return h.redirect('/admin/notifications/contact-details');
};

/**
 * Form to get contact details - email/tel/address
 */
const getDetails = async (request, h) => {
  // Load user data from IDM
  const { contactDetails = {} } = await getUserData(request.auth.credentials.user_id);

  return h.view('water/notifications/contact-details', {
    ...request.view,
    contactDetails
  });
};

/**
 * Post handler for contact details - email/tel/address
 */
const postDetails = async (request, h) => {
  const contactDetails = mapPost(request.payload);

  if (request.formError) {
    return h.view('water/notifications/contact-details', getErrorViewContext(request));
  }

  // Merge updated fields to user_data
  let userData = await getUserData(request.auth.credentials.user_id);
  set(userData, 'contactDetails.email', contactDetails.email);
  set(userData, 'contactDetails.tel', contactDetails.tel);
  set(userData, 'contactDetails.address', contactDetails.address);
  await setUserData(request.auth.credentials.user_id, userData);

  // Redirect to notifications flow
  return h.redirect(request.sessionStore.get('redirect'));
};

module.exports = {
  getNameAndJob,
  postNameAndJob,
  getDetails,
  postDetails
};
