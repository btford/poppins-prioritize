angular.module('prioritizeApp', []).
  controller('MainController', ['$scope', '$http', function ($scope, $http) {
    $http.get('api').success(function (issues) {
      $scope.issues = issues;

      $scope.stats = {
        pains: {}
      };

      $scope.issues.forEach(function (issue) {
        $scope.stats.pains[issue.pain] = ~~$scope.stats.pains[issue.pain] + 1;
      });
    });
  }]);
