const { fields } = require('shared/lib/forms');

const getContinueField = () => {
  return fields.button(null, { label: 'Continue' });
};

const getCsrfTokenField = request => {
  const { csrfToken } = request.view;
  return fields.hidden('csrf_token', {}, csrfToken);
};

const getHeadingField = (text, element = 'h3') => {
  return fields.paragraph(null, {
    text,
    element,
    controlClass: 'govuk-heading-m' });
};

const getParagraphField = (text) => {
  return fields.paragraph(null, {
    text,
    element: 'p'
  });
};

exports.getContinueField = getContinueField;
exports.getCsrfTokenField = getCsrfTokenField;
exports.getHeadingField = getHeadingField;
exports.getParagraphField = getParagraphField;
