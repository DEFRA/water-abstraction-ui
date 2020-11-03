'use strict';

const returnStatuses = {
  due: 'due',
  completed: 'completed',
  void: 'void',
  received: 'received'
};

const crmRoles = {
  licenceHolder: 'licenceHolder',
  returnsTo: 'returnsTo'
};

const transactionStatuses = {
  candidate: 'candidate',
  chargeCreated: 'charge_created',
  approved: 'approved',
  error: 'error'
};

exports.returnStatuses = returnStatuses;
exports.crmRoles = crmRoles;
exports.transactionStatuses = transactionStatuses;
