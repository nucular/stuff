var app = angular.module("infinimgur", ["infinite-scroll"]);

app.factory("ImgurStats", function() {
  var ImgurStats = {};

  ImgurStats.successes = 0;
  ImgurStats.failures = 0;
  ImgurStats.successrate = 0;

  ImgurStats.rps = 0;
  ImgurStats.sps = 0;
  ImgurStats._rps = 0;
  ImgurStats._sps = 0;

  ImgurStats.success = function() {
    ImgurStats._rps++;
    ImgurStats._sps++;

    ImgurStats.successes++;
    ImgurStats.successrate = ImgurStats.successes /
      (ImgurStats.successes + ImgurStats.failures);
  }

  ImgurStats.failure = function() {
    ImgurStats._rps++;

    ImgurStats.failures++;
    ImgurStats.successrate = ImgurStats.successes /
      (ImgurStats.successes + ImgurStats.failures);
  }

  ImgurStats.updateRPS = function() {
    ImgurStats.rps = ImgurStats._rps;
    ImgurStats.sps = ImgurStats._sps;

    ImgurStats._rps = 0;
    ImgurStats._sps = 0;
  }

  return ImgurStats;
});

app.factory("ImgurRequest", function($q, $http, ImgurStats) {
  var ImgurRequest = function(id) {
    this.id = id;
    this.thumbnail = "//i.imgur.com/" + this.id + "s.jpg";
    this.image = "//i.imgur.com/" + this.id + ".png"; // extension unknown
  }

  ImgurRequest.prototype.get = function() {
    var that = this;

    return $q(function(resolve, reject) {
      var img = new Image();
      img.onload = function() {
        if ((img.width == 198 && img.height == 160) ||
            (img.width == 161 && img.height == 81)) {
          ImgurStats.failure();
          reject();
        } else {
          ImgurStats.success();
          resolve(that);
        }
      }
      img.onerror = function() {
        ImgurStats.failure();
        reject();
      }

      img.src = "//i.imgur.com/" + that.id + "s.jpg";
    });
  }

  return ImgurRequest;
});

app.factory("MultiFusk", function($q, ImgurRequest) {
  var MultiFusk = function(wanted, concurrent) {
    this.wanted = wanted;
    this.found = [];
    this.concurrent = concurrent || 3;

    this.resolve = null;
    this.reject = null;
  }

  MultiFusk.prototype.next = function() {
    var that = this;
    if (Math.random() > 0.2)
      var id = Math.random().toString(36).substr(2, 5);
    else
      var id = Math.random().toString(36).substr(2, 7);

    (new ImgurRequest(id)).get()
      .then(function(req) {
        that.found.push(req);

        if (that.found.length >= that.wanted) {
          that.resolve(that.found);
        } else {
          that.next();
        }
      }, function() {
        that.next();
      });
  }

  MultiFusk.prototype.search = function() {
    var that = this;

    return $q(function(resolve, reject) {
      that.resolve = resolve; // :/
      that.reject = reject;

      for (var i = 0; i < that.concurrent; i++)
        that.next();
    });
  }

  return MultiFusk;
});

app.controller("RouletteCtrl", function($scope, MultiFusk) {
  $scope.loading = false;
  $scope.thumbnails = [];

  $scope.load = function() {
    $scope.loading = true;
    (new MultiFusk(5)).search().then(function(found) {
      for (var i = 0; i < found.length; i++)
        $scope.thumbnails.push(found[i]);

      $scope.loading = false;
    });
  }

  $scope.shrink = function(thumb)
  {
    var img = thumb.find("img");
    var id = thumb.attr("id");
    thumb.removeClass("expanded z-2");
    img.attr("src", "//i.imgur.com/" + id + "s.jpg");
  }

  $scope.expand = function(thumb)
  {
    $scope.shrink($(".thumbnail.expanded"));
    var img = thumb.find("img");
    var id = thumb.attr("id");
    thumb.addClass("expanded z-2");
    img.attr("src", "//i.imgur.com/" + id + ".png");
  }

  $scope.toggle = function($event) {
    if ($event.currentTarget)
      var target = $($event.currentTarget);
    else
      var target = $event;

    if (target.hasClass("expanded")) {
      $scope.shrink(target);
    } else {
      $scope.expand(target);
    }
    $.scrollTo(target.position().top - 64, 200);
  }
});

app.controller("StatsCtrl", function($scope, ImgurStats) {
  $scope.Math = window.Math;
  $scope.stats = ImgurStats;
});

app.run(function(ImgurStats) {
  setInterval(function() {
    ImgurStats.updateRPS();
  }, 1000);



  $(window).on("keydown", function(e) {
    e.preventDefault();

    var thumb = $(".thumbnail.expanded");
    if (thumb.length) {
      var prev = thumb.prev();
      var next = thumb.next();
    } else {
      var prev = [];
      var next = $($(".thumbnail")[0]);
    }

    if (e.which == 37 && prev.length) {
      prev.click();
    } else if (e.which == 39 && next.length) {
      next.click();
    }
  });
});
