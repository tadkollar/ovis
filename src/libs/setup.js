function setupClicks() {
    document.getElementById("installButton").onclick = function () { installUpdate(); }
    document.getElementById("openButton").onclick = function () { ipc.openFile(); }

    window.$ = window.jQuery = require('jquery');
    var d3 = require("d3"),
        bootstrap = require("bootstrap"),
        GoldenLayout = require("golden-layout"),
        bootstrap_select = require("bootstrap-select");
}

document.body.onload = function () { setupClicks(); }

