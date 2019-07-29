const { fields } = require('shared/lib/forms');

const getUnderQueryField = isUnderQuery => fields.checkbox('isUnderQuery', {
  mapper: 'arrayMapper',
  choices: [{
    label: 'Mark as under query',
    value: 'under_query'
  }]
}, isUnderQuery ? ['under_query'] : []);

exports.getUnderQueryField = getUnderQueryField;
