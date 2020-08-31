///////////////////////////
//Modal Help Dialog Stuff
///////////////////////////
// When the user clicks the button, open the modal
function DisplayModal() {
    d3.select("#myModal").style("display", "block");
}

// When the user clicks anywhere outside of the modal, close it
window.onclick = function (event) {
    if (event.target == d3.select("#myModal").node()) {
        d3.select("#myModal").style("display", "none");
    }
}
