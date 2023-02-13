'use strict'

require('dotenv').config();

module.exports = (_on, config) => {
  config.env.JWT_TOKEN = process.env.JWT_TOKEN;
  config.env.NOTIFY_CALLBACK_TOKEN = process.env.NOTIFY_CALLBACK_TOKEN;
  config.env.WATER_URI = process.env.WATER_URI  || 'http://localhost:8001/water/1.0';
  config.env.ADMIN_URI = process.env.ADMIN_URI  || 'http://localhost:8008/';
  config.env.USER_URI = process.env.USER_URI  || 'http://localhost:8000/';
  config.env.DEFAULT_PASSWORD = 'P@55word';
  return config;
};
