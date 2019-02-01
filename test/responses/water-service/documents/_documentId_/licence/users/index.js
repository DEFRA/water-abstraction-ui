const multipleUsersIncludingPrimaryUser = () => ({
  error: null,
  data: [
    {
      userId: 1111,
      entityId: '11111111-0000-0000-0000-000000000000',
      userName: 'test1@example.com',
      roles: ['user']
    },
    {
      userId: 2222,
      entityId: '22222222-0000-0000-0000-000000000000',
      userName: 'test2@example.com',
      roles: ['user', 'user_returns']
    },
    {
      userId: 3333,
      entityId: '33333333-0000-0000-0000-000000000000',
      userName: 'test3@example.com',
      roles: ['user', 'user_returns']
    },
    {
      userId: 4444,
      entityId: '44444444-0000-0000-0000-000000000000',
      userName: 'test4@example.com',
      roles: ['primary_user']
    }
  ]
});

const multipleUsersExcludingPrimaryUser = () => ({
  error: null,
  data: [
    {
      userId: 1111,
      entityId: '11111111-0000-0000-0000-000000000000',
      userName: 'test1@example.com',
      roles: ['user']
    },
    {
      userId: 2222,
      entityId: '22222222-0000-0000-0000-000000000000',
      userName: 'test2@example.com',
      roles: ['user', 'user_returns']
    },
    {
      userId: 3333,
      entityId: '33333333-0000-0000-0000-000000000000',
      userName: 'test3@example.com',
      roles: ['user', 'user_returns']
    }
  ]
});

const notFound = () => ({
  statusCode: 404,
  error: 'Not Found',
  message: 'Not found'
});

module.exports = {
  multipleUsersIncludingPrimaryUser,
  multipleUsersExcludingPrimaryUser,
  notFound
};
