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

beforeEach(function() {
  global.localStorage.clear();
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
    beforeEach(function() {
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
  beforeEach(function() {
    return axios.post(URL, { foo: 'bar' });
  });

  it('returns an array with all the objects in that collection', function() {
    return axios.get(URL).then(function(data) {
      expect(data.status).to.eq(200);
      expect(data.data.length).to.eq(1);
      expect(data.data[0]).to.have.keys('foo', 'id', 'createdAt', 'updatedAt');
      expect(data.data[0].foo).to.eq('bar');
    })
  });
});

describe('when using query params against a collection endpoint', function() {
  beforeEach(function() {
    return axios.post(URL, { name: 'foo', age: 34 }).then(function() {
      return axios.post(URL, { name: 'bar', age: 23 });
    }).then(function() {
      return axios.post(URL, { name: 'biz', age: 32 });
    }).then(function() {
      return axios.post(URL, { name: 'baz', age: 18 });
    });
  });

  it('returns an array with all the objects in that collection', function() {
    return axios.get(URL + '?name=biz&age=32').then(function(data) {
      expect(data.status).to.eq(200);
      expect(data.data.length).to.eq(1);
      expect(data.data[0]).to.have.keys('name', 'age', 'id', 'createdAt', 'updatedAt');
      expect(data.data[0].name).to.eq('biz');
      expect(data.data[0].age).to.eq(32);
    })
  });
});

describe('when deleting an object by id', function() {
  var id = null;

  describe('when the object exists', function() {
    beforeEach(function() {
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
    beforeEach(function() {
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
