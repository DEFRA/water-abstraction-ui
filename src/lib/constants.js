const SCOPE_INTERNAL = 'internal';
const SCOPE_ABSTRACTION_REFORM_USER = 'ar_user';
const SCOPE_ABSTRACTION_REFORM_APPROVER = 'ar_approver';

module.exports = {
  scope: {
    allAdmin: [
      SCOPE_INTERNAL,
      SCOPE_ABSTRACTION_REFORM_USER,
      SCOPE_ABSTRACTION_REFORM_APPROVER
    ],
    internal: SCOPE_INTERNAL,
    abstractionReformUser: SCOPE_ABSTRACTION_REFORM_USER,
    abstractionReformApprover: SCOPE_ABSTRACTION_REFORM_APPROVER,

    // @TODO - limit to correct scopes
    returns: [
      SCOPE_INTERNAL
    ]
  }
};
