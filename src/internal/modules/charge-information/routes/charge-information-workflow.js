const controller = require('../controllers/charge-information-workflow');
const { billing } = require('internal/lib/constants').scope;
const preHandlers = require('../pre-handlers');
const allowedScopes = [billing];

module.exports = {
  getChargeInformationWorkflow: {
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
      },
      pre: [
        { method: preHandlers.loadLicencesWithoutChargeVersions, assign: 'toSetUp' },
        { method: preHandlers.loadLicencesWithWorkflowsInProgress, assign: 'inProgress' }
      ]
    }
  }
};
