const ServiceClient = require('../ServiceClient')

class NotifyService extends ServiceClient {
  postNotifyCallback (payload) {
    const url = this.joinUrl('notify', 'callback')
    return this.serviceRequest.post(url, { body: payload })
  }
}

module.exports = NotifyService
