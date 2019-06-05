'use strict';

const controller = require('./controller');
const constants = require('../../lib/constants');
const { allAdmin } = constants.scope;

const getContactInformation = {
  method: 'GET',
  path: '/admin/contact-information',
  handler: controller.getContactInformation,
  options: {
    auth: { scope: allAdmin },
    description: 'Displays the user\'s contact information',
    plugins: {
      viewContext: {
        pageTitle: 'Contact information',
        back: '/'
      }
    }
  }
};

const postContactInformation = {
  method: 'POST',
  path: '/admin/contact-information',
  handler: controller.postContactInformation,
  options: {
    auth: { scope: allAdmin },
    description: 'Updates the user\'s contact information if valid',
    plugins: {
      viewContext: {
        pageTitle: 'Contact information',
        back: '/'
      }
    }
  }
};

exports.getContactInformation = getContactInformation;
exports.postContactInformation = postContactInformation;
