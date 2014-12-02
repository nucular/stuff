var loadmsg = new (function() {

var verba = ["", "trans", "pre", "post", "re", "con", "de", "dis", "in", "ex",
    "counter", "tes", "pro", "per", "anti", "mega", "ultra", "super", "infra",
    "domi", "di", "multi", "sub", "ap", "ab"];
var verbb = ["pann", "glut", "ridd", "app", "pand", "bor", "rat", "nect",
    "amin", "part", "tun", "fundel", "connect", "t", "d", "act", "gress",
    "lifer", "tract", "res", "mes", "les", "dess", "gress", "lact", "ract",
    "tract", "ticul", "mantel", "nat", "vid", "iplicat", "stract", "struct",
    "calcul", "err", "proxim", "reciat", "tard"];
var verbc = ["", "at", "ectat", "omat"];

var nouna = ["pret", "suff", "succ", "prec", "rad", "proc", "res", "spl",
    "inj", "inh", "act", "mult", "div", "fric", "reac", "prod", "constr"];
var nounb = ["iat", "ess", "onat", "on", "at", "erat", "in", "oss", "ect",
    "iplicat", "is", "d", "ion", "t", "uct", "erit"];
var nounc = ["or", "ant", "es", "ance", "ence", "ense", "ivity", "ion"];

var choice = function(list) {
    return list[Math.floor(Math.random() * list.length)];
}

var capitalize = function(string) {
    return string.substring(0, 1).toUpperCase() + string.substring(1).toLowerCase();
}

this.generateVerb = function() {
    return choice(verba) + choice(verbb) + choice(verbc);
}

this.generateNoun = function() {
    return choice(nouna) + choice(nounb) + choice(nounc);
}

this.generate = function() {
    return capitalize(this.generateVerb()) + "ing " + this.generateNoun();
}

})();
