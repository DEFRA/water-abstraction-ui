const roles = new Map([
  ['primary_user', 'Primary user'],
  ['user_returns', 'Returns user'],
  ['user', 'Agent']
]);

const mostSignificantEntityRole = (entityRoles = []) => {
  for (const [key, value] of roles) {
    if (entityRoles.includes(key)) {
      return value;
    }
  }
};

module.exports = {
  mostSignificantEntityRole
};
