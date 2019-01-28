const externalUserWithLicences = {
  data: {
    user: {
      isLocked: true,
      isInternal: false,
      lastLogin: '2019-01-01T00:00:00.000Z',
      userName: 'external@example.com'
    },
    companies: [
      {
        name: 'Company One',
        userRoles: ['primary_user'],
        outstandingVerifications: [
          {
            code: '12345',
            dateCreated: '2018-01-01T00:00:00.000Z',
            licences: [
              { licenceRef: 'lic-id-0001', documentId: 'doc-id-0001' }
            ]
          },
          {
            code: '23456',
            dateCreated: '2018-01-02T00:00:00.000Z',
            licences: [
              { licenceRef: 'lic-id-0002', documentId: 'doc-id-0002' }
            ]
          }
        ],
        registeredLicences: [
          {
            documentId: 'doc-id-0003',
            licenceRef: 'lic-id-0003',
            licenceHolder: 'LH 0003'
          },
          {
            documentId: 'doc-id-0004',
            licenceRef: 'lic-id-0004',
            licenceHolder: 'LH 0004'
          }
        ]
      },
      {
        name: 'Company Two',
        userRoles: ['user', 'user_returns'],
        outstandingVerifications: [],
        registeredLicences: [
          {
            documentId: 'doc-id-0005',
            licenceRef: 'lic-id-0005',
            licenceHolder: 'LH 0005'
          }
        ]
      }
    ]
  },
  error: null
};

const externalUserWithoutLicences = {
  data: {
    user: {
      isLocked: true,
      isInternal: false,
      lastLogin: '2019-01-01T00:00:00.000Z',
      userName: 'external@example.com'
    },
    companies: []
  },
  error: null
};

module.exports = {
  externalUserWithLicences: () => externalUserWithLicences,
  externalUserWithoutLicences: () => externalUserWithoutLicences
};
