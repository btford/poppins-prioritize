var plugin  = require('./plugin');
var express = require('express');

var app = express();

app.get('/priority/api', function (req, res) {
  res.send(require('./mock.json'));
});

plugin({
  plugins: {},
  issues: [],
  server: app
});


app.listen(3000);
