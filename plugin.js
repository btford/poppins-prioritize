
var fs      = require('fs');
var escape  = require('escape-html');

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
      return issue.state === 'open' && !issue.milestone;
    },

    calculate: function (issue) {
      return Object.keys(plugins.prioritize.weight).reduce(function (product, possibleLabel) {
        return product *
                ((issue.labels.some(function (label) {
                  return label.name === possibleLabel;
                }) * plugins.prioritize[possibleLabel]) || 1);
      }, 1);
    },

    renderPage: function (req, res) {
      var links,
          issues = Object.keys(poppins.issues).map(function (number) {
            return poppins.issues[number];
          });

      if (issues) {
        var filteredIssues = issues.filter(plugins.prioritize.criteria);

        var sortedIssues = filteredIssues.sort(function (a, b) {
          return a.vote > b.vote ? -1 : a.vote < b.vote ? 1 : 0;
        });
        links = sortedIssues.map(plugins.prioritize.linkifyIssue);
      } else {
        links = [];
      }
      res.send(plugins.prioritize.header +
        (links.length > 0 ? ('<ul>' + links.join('\n') + '</ul>') : 'There are no issues with votes') +
        plugins.prioritize.footer);
    },

    linkifyIssue: function (issue) {
      return '<li><a href="https://github.com/' +
              poppins.config.target.user + '/' +
              poppins.config.target.repo + '/issues/' +
              issue.number + '">#' +
              issue.number + ' ' +
              escape(issue.title) + ' (' +
              issue.vote + ')</a></li>';

    },

    header: fs.readFileSync(__dirname + '/templates/header.html', 'utf8'),

    footer: fs.readFileSync(__dirname + '/templates/footer.html', 'utf8')
  };

  server.get('/priority', plugins.prioritize.renderPage);
};
