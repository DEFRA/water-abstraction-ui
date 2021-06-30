'use strict';

const jwtEncode = require('jsonwebtoken');
const { throttle } = require('lodash');

const expiresIn = 1800;

const getJWTToken = () => jwtEncode.sign(
  getPayload(),
  process.env.JWT_SECRET,
  { expiresIn }
);

const getDynamicJWTToken = throttle(getJWTToken, (expiresIn - 10) * 1000);

const getPayload = () => ({ id: getRandomInt() });

const getRandomInt = () => parseInt(Math.random() * Number.MAX_SAFE_INTEGER);

exports.getDynamicJWTToken = getDynamicJWTToken;
