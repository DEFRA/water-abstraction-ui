const services = require('../../../lib/connectors/services')

const getScheduledNotificationCategories = () => services.water.notifications.getNotificationCategories()

module.exports = {
  getScheduledNotificationCategories
}
