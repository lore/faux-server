# Faux-Server
===

Intercept requests to RESTful endpoints and replace them with requests against the client store.

##Usage
===

Require and load the faux server.  Once loaded all http(s) requests will be faked out.

```
var fauxServer = require('faux-server');
fauxServer();
```

Options:
---
```
debug: whether or not to log requests to your console. defaults to true.
```

```
delay: delay (in ms) between receiving the request and responding.  Use to fake out network latency.
```

options usage:
---
```
var fauxServer = require('faux-server');
fauxServer({ debug: false, delay: 100 });
```

## Disabling faux-server:
---

```
var fauxServer = require('faux-server');
var server = fauxServer();
server.restore();
```
