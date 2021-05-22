'use strict';

// Copyright (c) 2021, Guy Or Please see the AUTHORS file for details.
//  All rights reserved. Use of this source code is governed by a MIT
//  license that can be found in the LICENSE file.

const https = require('https');
const http = require('http');
const { URL } = require('url');

const RequestMethods = Object.freeze({
  'GET': true,
  'POST': true,
  'PUT': true,
  'DELETE': true,
  'HEAD': true,
  'PATCH': true,
  'OPTIONS': true
});

const ProtocolModule = {
  'http:': http,
  'https:': https,
};

function request(url, method, args, body, headers={}) {
  return new Promise((resolve, reject) => {

    method = method.toUpperCase();
    if (RequestMethods[method] == undefined) {
      return reject('Invalid method ' + method);
    }
    const hasBody = !!body;
    if (hasBody) {
      headers['Content-Length'] = body.length;
    }

    const urlObj = (url instanceof URL) ? url : new URL(url);
    const proto = ProtocolModule[urlObj.protocol];
    if (!proto) {
      return reject('Invalid protocol ' + urlObj.protocol);
    }

    if (args != undefined) {
      for (const [arg, val] of Object.entries(args)) {
        urlObj.searchParams.set(arg, val);
      }
    }

    let responseBody = '';
    const req = proto.request(url, { headers, method }, (res) => {
      res.on('data', (chunk) => {
        responseBody += chunk;
      });
      res.on('end', () => {
        resolve({ body: responseBody, message: res });
      });
    });
    // Attach error handler
    req.on('error', (e) => {
      reject(e);
    });
    // Send the request
    if (!!hasBody) {
      req.write(body);
    }
    req.end();
  });
};

function jsonRequest(url, method, args, body, headers={}) {
  headers['Content-Type'] = 'application/json';
  return request(url, method, args, body, headers);
}

module.exports.request = request;
module.exports.jsonRequest = jsonRequest;
