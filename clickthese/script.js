var score = 1;
var energy = 1;
var ingame = false;

var energyint = 0;
var circleint = 0;

var hitflag = false;
var mouse = {
  x: 0,
  y: 0
}

var hidden = false;

function distance(x1, y1, x2, y2) {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}
function setTimeoutInterval(func, interval, timeout) {
  var int = setInterval(func, interval);
  setTimeout(function() {
    clearTimeout(int);
  }, timeout);
}

var nerfs = [
  {
    score: 0,
    func: function() {
      energy *= 0.7;
    }
  },
  {
    score: 15,
    func: function() {
      setTimeoutInterval(function() {
        var cs = $("#game .circle");
        for (var i = 0; i < cs.length; i++) {
          var $c = $(cs[i]);
          var x = Math.random() * 0.6;
          var y = Math.random() * 0.6;
          $c.css({
            left: x*100 + "%",
            top: y*100 + "%"
          })
        }
      }, 1000/30, 100);
    }
  },
  {
    score: 30,
    func: function() {
      $("#lasthit").fadeOut("slow");
      setTimeout(function() {
        $("#lasthit").fadeIn("slow");
      }, Math.random() * 2000 + 2000);
    }
  },
  {
    score: 20,
    func: function() {
      $("#game .circle").css("border-radius", "0px");
    }
  },
  {
    score: 20,
    func: function() {
      hidden = true;
      setTimeout(function() {
        hidden = false;
      }, Math.random() * 2000 + 2000);
    }
  }
];

function setCursor(state) {
  if (state) {
    $("body").removeClass("nocursor");
    $("#lasthit").hide();
  } else {
    $("body").addClass("nocursor");
    $("#lasthit").show();
  }
}

function updateEnergy() {
  if (ingame) {
    energy -= (1-(1/score))*0.1;
    if (energy <= 0) endGame();
    if (score >= 10 && score < 20)
      setCursor($("body").hasClass("nocursor"));
  }
  
  $("#energy").css("width", (energy * 100) + "%");
}

function spawnCircle(x, y, r) {
  if ($(".circle").length > 3) return;
  var $c = $("<span class=\"circle\">")
    .css({
      position: "absolute",
      top: (x * 100) + "%",
      left: (y * 100) + "%",
      width: (r * 100) + "vmin",
      height: (r * 100) + "vmin"
    })
    .on("mousedown", function(e) {
      hitflag = true;
      $("#lasthit").css({
        "left": mouse.x - $("#lasthit").width()/2,
        "top": mouse.y - $("#lasthit").height()/2
      });

      energy = 1;
      score += 1;

      if (score == 20)
        setCursor(false);
      
      $("#score").text(score);
      $(this).remove();
    })
    .appendTo("#game");
  if (hidden) {
    setTimeout(function() {
      $c.animate({opacity: 0.02}, 100);
    }, 100);
  }
}

function spawnSquare(x, y, r) {
  if ($(".squares").length > 2) return;
  var $s = $("<span class=\"square\">")
    .css({
      position: "absolute",
      top: (x * 100) + "%",
      left: (y * 100) + "%",
      width: (r * 100) + "vmin",
      height: (r * 100) + "vmin"
    })
    .on("mousedown", function(e) {
      hitflag = true;
      $("#lasthit").css({
        "left": mouse.x - $("#lasthit").width()/2,
        "top": mouse.y - $("#lasthit").height()/2
      });
      
      var n = {score: Infinity};
      while (score < n.score) {
        n = nerfs[Math.floor(Math.random() * nerfs.length)];
      }
      n.func();

      $(this).remove();
    })
    .appendTo("#game");
  setTimeout(function() {
    $s.remove();
  }, Math.random() * 700 + 500)
  if (hidden) {
    setTimeout(function() {
      $s.fadeOut("fast");
    }, 500);
  }
}

function startGame() {
  $("#container").hide();
  $("#score").text("1").show();
  $("#game").show();
  score = 1;
  energy = 1;
  circleint = setInterval(function() {
    var x = Math.random() * 0.6;
    var y = Math.random() * 0.6;
    var r = Math.random() * 0.2 + 0.2;

    var ra =  r * Math.min(window.innerWidth, window.innerHeight);
    while (distance(
        x * window.innerWidth + ra/2, y * window.innerHeight + ra/2,
        mouse.x, mouse.y
      ) < ra) {
      x = Math.random() * 0.6;
      y = Math.random() * 0.6;
    }
  
    if (Math.random() > (2/score)+0.8) {
      spawnSquare(x, y, r);
    } else {
      spawnCircle(x, y, r);
    }
  }, 200)
  ingame = true;
}

function endGame() {
  clearInterval(circleint);
  $("#game").hide();//removeClass("rotating").removeClass("fast");
  $("#game > .circle").remove();
  $("#container").show();
  setCursor(true);
  energy = 0;
  ingame = false;
  $("#help").text(score + " of these clicked.");
  if (!localStorage.highscore || score > localStorage.highscore) {
    localStorage.highscore = score;
    $("#highscore").text("new best clicking: " + localStorage.highscore);
  } else {
    $("#highscore").text("best clicking: " + localStorage.highscore);
  }
}

$(function() {
  if (localStorage.highscore)
    $("#highscore").text("best clicking: " + localStorage.highscore);
  energyint = setInterval(updateEnergy, 1000 / 10);
  $("#play").on("mousedown", function(e) {
    startGame();
    hitflag = true;
  });
  $("#game").on("mousedown", function(e) {
    if (ingame && !hitflag) {
      endGame();
    }
    hitflag = false;
  });
  $("body").on("mousemove", function(e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  }).on("keydown", function(e) {
    if (e.which >= 88 && e.which <= 90) { // x/y/z
      $(document.elementFromPoint(mouse.x, mouse.y)).mousedown();
    }
  });
});
