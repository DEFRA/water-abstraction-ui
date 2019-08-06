'use strict';

const controller = require('./controller');
const constants = require('../../lib/constants');
const { hofNotifications, renewalNotifications } = constants.scope;

const allowedScopes = [hofNotifications, renewalNotifications];

const getContactInformation = {
  method: 'GET',
  path: '/contact-information',
  handler: controller.getContactInformation,
  options: {
    auth: { scope: allowedScopes },
    description: 'Displays the user\'s contact information',
    plugins: {
      viewContext: {
        pageTitle: 'Contact information',
        back: '/',
        activeNavLink: 'contact-information'
      }
    }
  }
};

const postContactInformation = {
  method: 'POST',
  path: '/contact-information',
  handler: controller.postContactInformation,
  options: {
    auth: { scope: allowedScopes },
    description: 'Updates the user\'s contact information if valid',
    plugins: {
      viewContext: {
        pageTitle: 'Contact information',
        back: '/',
        activeNavLink: 'contact-information'
      }
    }
  }
};

exports.getContactInformation = getContactInformation;
exports.postContactInformation = postContactInformation;
