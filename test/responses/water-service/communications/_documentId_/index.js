const getCommunication = () => ({
  error: null,
  data: {
    notification: {
      id: 'notification-id',
      recipient: 'n/a',
      messageRef: 'notification_letter',
      messageType: 'letter',
      licences: ['lic-1', 'lic-2'],
      plainText: 'Test message content',
      address: {
        addressLine1: 'Add 1',
        addressLine2: 'Add 2',
        addressLine3: 'Add 3',
        addressLine4: 'Add 4',
        addressLine5: 'Add 5',
        postcode: 'AB1 2CD'
      }
    },
    evt: {
      referenceCode: 'ref-code',
      type: 'notification',
      issuer: 'issuer@example.com',
      id: 'event-id',
      subType: 'event-sub-type',
      name: 'Message Type',
      createdDate: '2018-01-01T00:00:00.000Z'
    },
    licenceDocuments: [
      {
        documentId: 'doc-id-1',
        companyEntityId: 'company-id-1',
        documentName: 'doc-1-name',
        licenceRef: 'lic-1'
      },
      {
        documentId: 'doc-id-2',
        companyEntityId: 'company-id-2',
        documentName: 'doc-2-name',
        licenceRef: 'lic-2'
      }
    ]
  }
});

module.exports = {
  getCommunication
};
