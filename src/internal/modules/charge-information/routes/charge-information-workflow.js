const controller = require('../controllers/charge-information-workflow');
const { billing } = require('internal/lib/constants').scope;
const allowedScopes = [billing];

module.exports = {
  getReason: {
    method: 'GET',
    path: '/charge-information-workflow',
    handler: controller.getChargeInformationWorkflow,
    options: {
      auth: {
        scope: allowedScopes
      },
      description: 'View for charge information workflow in the internal UI',
      plugins: {
        viewContext: {
          activeNavLink: 'view'
        }
      }
    }
  }
};
