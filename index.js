var store = require('store')
var uuid = require('uuid');
var merge = require('lodash.merge');
var fauxJax = require('faux-jax');

var qs = require('qs');

module.exports = function(options) {
  options = options || {};
  options.delay = options.delay || 0;
  options.debug = options.debug || true;

  fauxJax.install();

  fauxJax.on('request', respond);

  function respond(request) {
    if(request.requestMethod === void 0) {
      return;
    }

    var urlPieces = request.requestURL.split('?');
    var url = urlPieces[0];
    var method = request.requestMethod.toLowerCase();
    var jsonBody = request.requestBody 
	? JSON.parse(request.requestBody)
	: {};

    var queryParams = qs.parse(urlPieces[1]);

    var respond = request.respond;
    request.respond = function(/* arguments */) {
      var self = this;
      var args = arguments;
      setTimeout(function() {
        if(options.debug) {
          console.log('FauxServer: Responding to \'' + method + '\' ' + url + ' with: ');
          console.log('  - Status Code: ', args[0]);

          if(args.length === 3) {
            console.log('  - Body:', JSON.parse(args[2]));
          }
        }

        if(args.length === 3) {
          return respond.apply(self, args);
        } else {
          return respond.apply(self, [args[0], { 'Content-Type': 'application/json' }, '']);
        }
      }, options.delay);
    };

    if(store.get(url) === void 0 && (method === 'get')) {
      var all = store.getAll();
      var response = null;

      Object.keys(all).forEach(function(key) {
        var pieces = key.split('/');
        pieces.pop();
        var collectionEndpoint = pieces.join('/')

        if(collectionEndpoint === url) {
          if(response === null) {
            response = [];
          }

          response.push(JSON.parse(all[key]));
        }
      });

      if(response === null) {

        return request.respond(404);

      } else {

        if(Object.keys(queryParams).length > 0) {
          var filteredResponse = response.filter(function(item) {
            var keep = true;
            Object.keys(queryParams).forEach(function(query) {
              if(item[query].toString() !== queryParams[query]) {
                keep = false;
              }
            });
            return keep;
          });

          return request.respond(200, { 'Content-Type': 'application/json' }, JSON.stringify(filteredResponse));

        } else {
          return request.respond(200, { 'Content-Type': 'application/json' }, JSON.stringify(response));
        }

      }

    } else if(store.get(url) === void 0 && (method === 'put' || method === 'delete')) {

      return request.respond(404);

    } else if(method === 'get') {

      return request.respond(200, { 'Content-Type': 'application/json' }, store.get(url));

    } else if(method === 'delete') {

      store.remove(url);

      return request.respond(204);

    } else if(method === 'put') {

      var old = JSON.parse(store.get(url));
      var data = JSON.parse(request.requestBody);
      data.updatedAt = new Date().toISOString();
      var body = store.set(url, JSON.stringify(merge(old, data)))
      return   request.respond(200, { 'Content-Type': 'application/json' }, body);

    } else  if(method === 'post') {

      var id = uuid.v4();
      jsonBody.id = id;
      jsonBody.createdAt = new Date().toISOString();
      jsonBody.updatedAt = new Date().toISOString();
      var body = store.set(url + "/" + id, JSON.stringify(jsonBody))
      return  request.respond(201, { 'Content-Type': 'application/json' }, body);

    } else {
      request.respond(500);
    }
  }

  return {
    restore: function() {
      fauxJax.restore();
    }
  }
}
