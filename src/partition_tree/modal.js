///////////////////////////
//Modal Help Dialog Stuff
///////////////////////////
var modalObj = {};

var newModal = function () {
    modalObj.parentDiv = document.getElementById("ptN2ContentDivId");
    modalObj.modal = parentDiv.querySelector("#myModal");

    // When the user clicks on <span> (x), close the modal
    modalObj.parentDiv.querySelector("#idSpanModalClose").onclick = function () {
        modalObj.modal.style.display = "none";
    }

    // When the user clicks anywhere outside of the modal, close it
    window.onclick = function (event) {
        if (event.target == modalObj.modal) {
            modalObj.modal.style.display = "none";
        }
    }

    // When the user clicks the button, open the modal
    modalObj.DIsplayModal = function () {
        modalObj.modal.style.display = "block";
    }

    return modalObj;
}