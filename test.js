var axios = require('axios');
var expect = require('chai').expect;

var LocalStorage = require('node-localstorage').LocalStorage;
global.localStorage = new LocalStorage('./.tmp');

var URL = 'https://example.com/user';

var fauxServer = require('./index.js');

// prevent the (node) warning: possible EventEmitter memory leak detected.
require('events').EventEmitter.prototype._maxListeners = 100;

var server = null;

before(function() {
  server = fauxServer();
});

after(function() {
  server.restore();
});

describe('when creating an object', function() {
  it('returns the object to be created and appends an id, createdAt, and updatedAt', function() {
    return axios.post(URL, { foo: 'bar' }).then(function(data) {
      expect(data.status).to.eq(201);
      expect(data.data).to.have.keys('foo', 'id', 'createdAt', 'updatedAt');
      expect(data.data.foo).to.eq('bar');
    });
  });
});

describe('when reading an object by id', function() {
  var id = null;

  describe('when the object exists', function() {
    before(function() {
      return axios.post(URL, { foo: 'bar' }).then(function(data) {
        id = data.data.id;
      });
    });

    it('returns the object', function() {
      return axios.get(URL + '/' + id).then(function(data) {
        expect(data.status).to.eq(200);
        expect(data.data).to.have.keys('foo', 'id', 'createdAt', 'updatedAt');
        expect(data.data.foo).to.eq('bar');
      });
    });
  });

  describe('when the object does not exists', function() {
    it('returns not found', function() {
      return axios.get(URL + '/000111').catch(function(data) {
        expect(data.status).to.eq(404);
      })
    });
  });
});

describe('when reading from a collection endpoint', function() {
  before(function() {
    return axios.post(URL, { foo: 'bar' })
  });

  it('returns an array with all the objects in that collection', function() {
    return axios.get(URL).catch(function(data) {
      expect(data.length).to.eq(1);
      expect(data[0].status).to.eq(201);
      expect(data[0].data).to.have.keys('foo', 'id');
      expect(data[0].data.foo).to.eq('bar');
    })
  });
});

describe('when deleting an object by id', function() {
  var id = null;

  describe('when the object exists', function() {
    before(function() {
      return axios.post(URL, { foo: 'bar' }).then(function(data) {
        id = data.data.id;
      });
    });

    it('deletes the object and returns 204', function() {
      return axios.delete(URL + '/' + id).then(function(data) {
        expect(data.status).to.eq(204);

        return axios.get(URL + '/' + id).catch(function(data) {
          expect(data.status).to.eq(404);
        });
      });
    });
  });

  describe('when the object does not exists', function() {
    it('returns not found', function() {
      return axios.delete(URL + '/000111').catch(function(data) {
        expect(data.status).to.eq(404);
      });
    });
  });
});

describe('when updating an object by id', function() {
  var id = null;

  describe('when the object exists', function() {
    before(function() {
      return axios.post(URL, { foo: 'bar' }).then(function(data) {
        id = data.data.id;
      });
    });

    it('updates the object and returns the updated object', function() {
      return axios.put(URL + '/' + id, { biz: 'baz' }).then(function(data) {
        expect(data.status).to.eq(200);
        expect(data.data).to.have.keys('foo', 'biz', 'id', 'createdAt', 'updatedAt');
        expect(data.data.foo).to.eq('bar');
        expect(data.data.biz).to.eq('baz');
      });
    });
  });

  describe('when the object does not exists', function() {
    it('returns not found', function() {
      return axios.put(URL + '/000111', { biz: 'baz' }).catch(function(data) {
        expect(data.status).to.eq(404);
      });
    });
  });
});
