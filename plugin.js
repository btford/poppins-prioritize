
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

    renderPage: function (req, res) {
      var links,
          issues = Object.keys(poppins.issues).map(function (number) {
            return poppins.issues[number];
          });

      if (issues) {
        var filteredIssues = issues.filter(plugins.prioritize.criteria);

        var painfulIssues = filteredIssues.map(function (issue) {
          issue.pain = plugins.prioritize.calculate(issue);
          return issue;
        });

        var sortedIssues = painfulIssues.sort(function (a, b) {
          return a.pain > b.pain ? -1 : a.pain < b.pain ? 1 : 0;
        });
        links = sortedIssues.map(plugins.prioritize.linkifyIssue);
      } else {
        links = [];
      }
      res.send(plugins.prioritize.header +
        (links.length > 0 ? ('<ul>' + links.join('\n') + '</ul>') : 'There are no untriaged issues') +
        plugins.prioritize.footer);
    },

    linkifyIssue: function (issue) {
      return '<li><a href="https://github.com/' +
              poppins.config.target.user + '/' +
              poppins.config.target.repo + '/issues/' +
              issue.number + '">#' +
              issue.number + ' ' +
              escape(issue.title) + ' (' +
              issue.pain + ')</a> ' +
              plugins.prioritize.tagifyIssue(issue) +
              '</li>';

    },

    tagifyIssue: function (issue) {
      return issue.labels.map(function (label) {
        return '<span style="background-color: #' + label.color + '">' + label.name + '</span>';
      }).join(' ');
    },

    header: fs.readFileSync(__dirname + '/templates/header.html', 'utf8'),

    footer: fs.readFileSync(__dirname + '/templates/footer.html', 'utf8')
  };

  server.get('/priority', plugins.prioritize.renderPage);
};
