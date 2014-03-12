
//var color   = require('color');
var fs      = require('fs');
//var escape  = require('escape-html');
var express = require('express');

module.exports = function (poppins) {
  var plugins = poppins.plugins,
      server  = poppins.server;

  plugins.prioritize = {
    weight: {
      'severity: security'            : 6,
      'severity: regression'          : 5,
      'severity: memory leak'         : 4,
      'severity: broken expected use' : 3,
      'severity: confusing'           : 2,
      'severity: inconvenient'        : 1,

      'frequency: high'               : 3,
      'frequency: moderate'           : 2,
      'frequency: low'                : 1
    },

    // open issues with no milestone
    criteria: function (issue) {
      return issue.state === 'open' && issue.milestone;
    },

    calculate: function pain (issue) {
      return Object.keys(plugins.prioritize.weight).reduce(function (product, possibleLabel) {
        return product *
                ((issue.labels.some(function (label) {
                  return label.name === possibleLabel;
                }) * plugins.prioritize.weight[possibleLabel]) || 1);
      }, 1);
    },

    json: function (req, res) {
      res.send(Object.keys(poppins.issues).
          map(function (number) {
            return poppins.issues[number];
          }).
          filter(plugins.prioritize.criteria).
          map(function (issue) {
            issue.pain = plugins.prioritize.calculate(issue);
            return issue;
          }).
          sort(function (a, b) {
            return a.pain > b.pain ? -1 : a.pain < b.pain ? 1 : 0;
          }));
    }
  };

  server.get('/priority/api', plugins.prioritize.json);
  server.use('/priority', express.static(__dirname + '/public'));
};
