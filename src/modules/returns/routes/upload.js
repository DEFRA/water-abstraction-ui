// const Joi = require('joi');
const controller = require('../controllers/upload');

module.exports = {
  getXmlUpload: {
    method: 'GET',
    path: '/returns/upload',
    handler: controller.getXmlUpload,
    config: {
      description: 'Upload xml return',
      plugins: {
        viewContext: {
          activeNavLink: 'returns'
        }
      }
    }
  },
  postXmlUpload: {
    method: 'POST',
    path: '/returns/upload',
    handler: controller.postXmlUpload,
    config: {
      description: 'Upload xml return',
      payload: {
        output: 'stream',
        allow: 'multipart/form-data'
      }
    }
  },
  getSpinnerPage: {
    method: 'GET',
    path: '/returns/processing-upload/{event_id}',
    handler: controller.getSpinnerPage,
    config: {
      description: 'Uploading returns data',
      plugins: {
        viewContext: {
          activeNavLink: 'returns'
        }
      }
    }
  }
};
