const { get } = require('lodash');
const querystring = require('querystring');
const axios = require('axios');

Cypress.Commands.add('getPasswordResetUrl', async (baseUrl, email) => {
  const url = `${Cypress.env('ADMIN_URI')}notifications/last?${querystring.encode({ email })}`;
  const req = await axios.get(url);
  const personalisation = get(req, `data.data[0].personalisation['reset_url']`, null);
  return personalisation.replace((/^https?:\/\/[^/]+\//g).exec(personalisation), baseUrl);
});

Cypress.Commands.add('getUserRegistrationUrl', async (baseUrl, email) => {
  const url = `${Cypress.env('ADMIN_URI')}notifications/last?${querystring.encode({ email })}`;
  const req = await axios.get(url);
  const personalisation = get(req, `data.data[0].personalisation['link']`, null);
  return personalisation.replace((/^https?:\/\/[^/]+\//g).exec(personalisation), baseUrl);
});
