'use strict';

const titleCase = require('title-case');

const isErrorStatus = status => status === 'error';

/**
   * Maps the displayStatus from the water service to a badge
   * object which will render via Nunjucks
   *
   * @param {String} status
   */
const messageStatusBadgeMapper = status => {
  const text = titleCase(status);
  return isErrorStatus(status) ? { text, status } : { text };
};

const mapMessage = message => ({
  ...message,
  badge: messageStatusBadgeMapper(message.displayStatus)
});

const checkBoxItems = filter => {
  if (!filter) {
    filter = [];
  }

  return [
    {
      value: 'notification_letter',
      text: 'Returns: send paper forms',
      checked: filter.includes('notification_letter')
    },
    {
      value: 'returns_invitation_letter',
      text: 'Returns: invitation',
      checked: filter.includes('returns_invitation_letter')
    },
    {
      value: 'returns_final_reminder',
      text: 'Returns: reminder',
      checked: filter.includes('returns_final_reminder')
    },
    {
      value: 'expiry_notification_email',
      text: 'Expiring licence(s): invitation to renew',
      checked: filter.includes('expiry_notification_email')
    },
    {
      value: 'water_abstraction_alert_reduce_warning',
      text: 'Hands off flow: levels warning',
      checked: filter.includes('water_abstraction_alert_reduce_warning')
    },
    {
      value: 'water_abstraction_alert_reduce_or_stop_warning',
      text: 'Hands off flow: stop or reduce abstraction',
      checked: filter.includes('water_abstraction_alert_reduce_or_stop_warning')
    },
    {
      value: 'water_abstraction_alert_resume',
      text: 'Hands off flow: resume abstraction',
      checked: filter.includes('water_abstraction_alert_resume')
    }
  ];
};

const mapResponseToView = (response, request) => {
  const { filter, sentBy } = request.query;
  return {
    ...response,
    filter,
    sentBy,
    checkBoxItems: checkBoxItems(filter)
  };
};
exports.mapResponseToView = mapResponseToView;
exports.mapMessage = mapMessage;
