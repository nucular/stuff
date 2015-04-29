var app = angular.module("roulette", ["ngRoute"]);

var API = "http://picasaweb.google.com/data/feed/base/all?thumbsize=150c&orderby=date&alt=json&kind=photo&max-results=500&q=IMG-{{date}}-WA{{page}}"
function formatDate(d) {
  return d.getFullYear() + ("00" + (d.getUTCMonth()+1)).substr(-2) + ("00" + d.getUTCDate()).substr(-2);
}

app.config(function($routeProvider) {
  $routeProvider.when("/g/:date/:page?", {
    templateUrl: "gallery.html",
    controller: "GalleryCtrl"
  }).otherwise({
    templateUrl: "start.html",
    controller: "StartCtrl"
  });
});

app.factory("apiProvider", function($http, $routeParams) {
  return function() {
    return $http({
        method: "GET",
        url: "https://corser.herokuapp.com/"
          + API.replace(/\{\{date\}\}/g, $routeParams.date)
               .replace(/\{\{page\}\}/g, ("0000" + ($routeParams.page || 0)).substr(-4)),
        cache: true
      });
  }
});

app.controller("GalleryCtrl", function($scope, $routeParams, apiProvider) {
  var p = Number($routeParams.page) || 0;
  $scope.shownavprev = p > 0;
  $scope.shownavnext = p < 9999;
  $scope.navprev = "#/g/" + $routeParams.date + "/" + (p - 1);
  $scope.navnext = "#/g/" + $routeParams.date + "/" + (p + 1);

  $scope.loading = true;
  apiProvider().success(function(data) {
    $scope.loading = false;
    $scope.feed = data.feed;
  });
});

app.controller("StartCtrl", function($scope) {
  $scope.today = formatDate(new Date());
  $scope.random = formatDate(
    new Date(1325376000000 + Math.floor(Math.random() * (new Date().getTime() - 1325376000000)))
  ); // between 2012 and now
  
  $scope.input = "";
  $scope.formatInput = function(v) {
    var d = new Date($scope.input);
    if (!isNaN(d.getTime()))
      return formatDate(d);
    else
      return "";
  }
});
