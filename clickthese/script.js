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

function setCursor(state) {
  if (state)
    $("body").removeClass("nocursor");
  else
    $("body").addClass("nocursor");
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
      $("#lasthit").show().css({
        "left": mouse.x - $("#lasthit").width()/2,
        "top": mouse.y - $("#lasthit").height()/2
      });
      energy = 1;
      score += 1;
      if (score == 20)
        setCursor(false);
      if (score == 30)
        $("#game").addClass("rotating");
      if (score == 50)
        $("#game").addClass("fast");
      $("#score").text(score);
      $(this).remove();
    })
    .appendTo("#game");
}

function startGame() {
  $("#container").hide();
  $("#score").text("1").show();
  $("#game").show();
  score = 1;
  energy = 1;
  circleint = setInterval(function() {
    spawnCircle(
      Math.random() * 0.6,
      Math.random() * 0.6,
      Math.random() * 0.2 + 0.2
    );
  }, 200)
  ingame = true;
}

function endGame() {
  clearInterval(circleint);
  $("#game").removeClass("rotating").removeClass("fast").hide();
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
