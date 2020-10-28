'use strict';

const { isObject, identity } = require('lodash');

const mapContactToString = contact => {
  if (!isObject(contact)) {
    return;
  }
  if (contact.type === 'department') {
    return contact.department;
  }
  const { title, firstName, middleInitials, lastName, suffix } = contact;
  const parts = [title, firstName, middleInitials, lastName, suffix];

  return parts.filter(identity).join(' ');
};

exports.mapContactToString = mapContactToString;
