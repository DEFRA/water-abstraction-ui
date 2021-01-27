'use strict';

const { isObject, identity } = require('lodash');

const getName = contact => {
  const { title, firstName, middleInitials, lastName, suffix, fullName } = contact;
  return fullName || [title, firstName, middleInitials, lastName, suffix].filter(identity).join(' ');
};

const mapContactToString = (contact) => {
  if (!isObject(contact)) {
    return null;
  }
  if (contact.type === 'department') {
    return contact.department;
  }
  const { department } = contact;
  const parts = [getName(contact), department];

  return parts.filter(identity).join(', ');
};

exports.mapContactToString = mapContactToString;
