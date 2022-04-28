const routing = require('./routing');

const getBadge = (isDone, id) => isDone
  ? { text: 'Completed', status: 'success', classes: ['task-list__task-badge'], attributes: { id } }
  : { text: 'Not started', status: 'inactive', classes: ['task-list__task-badge'], attributes: { id } };

const mapDataToTaskList = (data, licence) => ([{
  heading: 'Charge information',
  tasks: [{
    text: 'Select reason for new charge information',
    badge: getBadge(!!data.changeReason, 'task-reason'),
    link: routing.getReason(licence.id)
  }, {
    text: 'Set charge start date',
    badge: getBadge(!!data.startDate, 'task-start-date'),
    link: routing.getStartDate(licence.id)
  }, {
    text: 'Set up element',
    badge: getBadge(data.chargeElements.length > 0, 'task-charge-elements')
  }]
}, {
  heading: 'Billing contact',
  tasks: [{
    text: 'Set up billing contact',
    badge: getBadge(!!data.invoiceAccount, 'task-billing-contact')
  }]
}, {
  heading: 'Check and confirm',
  tasks: [{
    text: 'Check charge information'
  }]
}]);

const flattenAdditionalChargesProperties = ({ additionalCharges, ...element }) => {
  if (additionalCharges) {
    const { supportedSource, isSupplyPublicWater } = additionalCharges;
    element.isAdditionalCharges = true;
    element.isSupportedSource = !!supportedSource;
    element.isSupplyPublicWater = isSupplyPublicWater;
    const { id, name } = supportedSource || {};
    if (id) {
      element.supportedSourceId = id;
    }
    if (name) {
      element.supportedSourceName = name;
    }
  }
  return element;
};

exports.mapDataToTaskList = mapDataToTaskList;
exports.flattenAdditionalChargesProperties = flattenAdditionalChargesProperties;
