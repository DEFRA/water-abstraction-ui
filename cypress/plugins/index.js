
require('dotenv').config();

module.exports = (on, config) => {
  config.env.JWT_TOKEN = process.env.JWT_TOKEN;
  config.env.NOTIFY_CALLBACK_TOKEN = process.env.NOTIFY_CALLBACK_TOKEN;
  config.env.WATER_URI = process.env.WATER_URI;
  config.env.ADMIN_URI = 'http://127.0.0.1:8008/';
  config.env.USER_URI = 'http://127.0.0.1:8000/';
  config.env.DEFAULT_PASSWORD = 'P@55word';
  return config;
};
