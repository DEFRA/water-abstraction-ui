const { isObject, compact } = require('lodash');

const colourMap = {
  inactive: 'govuk-tag--grey',
  success: 'govuk-tag--green',
  error: 'govuk-tag--red',
  warning: 'govuk-tag--orange',
  todo: 'govuk-tag--blue'
};

const sizeMap = {
  large: 'govuk-!-font-size-27'
};

/**
 * Maps original badge implementation to new gov-uk tag
 */
const mapBadgeToTag = (param, status) => {
  const options = isObject(param) ? param : {
    text: param,
    status
  };

  const cssClasses = [
    colourMap[options.status] || 'govuk-tag--blue',
    sizeMap[options.size],
    ...(options.classes || [])
  ];

  // see https://design-system.service.gov.uk/components/tag/
  return {
    text: options.text,
    classes: compact(cssClasses).join(' '),
    attributes: options.attributes
  };
};

module.exports.mapBadgeToTag = mapBadgeToTag;
