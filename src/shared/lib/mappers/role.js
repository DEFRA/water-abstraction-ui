'use strict';

const addressMapper = require('./address');
const contactMapper = require('./contact');
const companyMapper = require('./company');

const isNaldContact = contact => contact.dataSource === 'nald';

const mapRoleToAddressArray = role => {
  const arr = [];
  if (role.contact && !isNaldContact(role.contact)) {
    const contactStr = contactMapper.mapContactToString(role.contact);
    arr.push(`FAO ${contactStr}`);
  }
  arr.push(companyMapper.mapCompanyToString(role.company));
  return [
    ...arr,
    ...addressMapper.mapAddressToArray(role.address)
  ];
};

exports.mapRoleToAddressArray = mapRoleToAddressArray;
