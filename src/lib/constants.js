const SCOPE_INTERNAL = 'internal';
const SCOPE_ABSTRACTION_REFORM_USER = 'ar_user';
const SCOPE_ABSTRACTION_REFORM_APPROVER = 'ar_approver';

const ROLE_EXTERNAL_COLLEAGUE = 'user';
const ROLE_EXTERNAL_COLLEAGUE_RETURNS = 'user_returns';
const ROLE_EXTERNAL_LICENCE_HOLDER = 'primary_user';

module.exports = {
  scope: {
    allAdmin: [
      SCOPE_INTERNAL,
      SCOPE_ABSTRACTION_REFORM_USER,
      SCOPE_ABSTRACTION_REFORM_APPROVER
    ],
    internal: SCOPE_INTERNAL,
    abstractionReformUser: SCOPE_ABSTRACTION_REFORM_USER,
    abstractionReformApprover: SCOPE_ABSTRACTION_REFORM_APPROVER
  },
  externalRoles: {
    colleague: ROLE_EXTERNAL_COLLEAGUE,
    colleagueWithReturns: ROLE_EXTERNAL_COLLEAGUE_RETURNS,
    licenceHolder: ROLE_EXTERNAL_LICENCE_HOLDER
  }
};
