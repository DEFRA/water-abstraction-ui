const SCOPE_EXTERNAL = 'external';

const ROLE_EXTERNAL_COLLEAGUE = 'user';
const ROLE_EXTERNAL_COLLEAGUE_RETURNS = 'user_returns';
const ROLE_EXTERNAL_LICENCE_HOLDER = 'primary_user';

const externalRoles = {
  colleague: ROLE_EXTERNAL_COLLEAGUE,
  colleagueWithReturns: ROLE_EXTERNAL_COLLEAGUE_RETURNS,
  licenceHolder: ROLE_EXTERNAL_LICENCE_HOLDER
};

module.exports = {
  scope: {
    external: SCOPE_EXTERNAL,
    ...externalRoles
  },
  externalRoles
};
