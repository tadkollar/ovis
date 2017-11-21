
//If we no longer have a token cookie, reload page to log us out
if(document.cookie.indexOf("token") < 0) {
    location.reload(true);
}

/**
 * Deletes a case
 * 
 * @param {*} case_id 
 * @param {*} token 
 */
var deleteCase = function (case_id, token) {
    if (confirm("Are you sure you want to delete this case?") == true) {
        console.log("deleting case with id: " + case_id)
        http.delete('case/' + case_id, token, function (response) {
            location.reload();
        });
    }
}

/**
 * Log out the user (request to server)
 */
var logout = function() {
    http.get('logout', function() {
        window.location = 'http://openmdao.org/visualization'
    });
}

/**
 * Creates a text box to allow one to edit the name of a case
 * 
 * @param {*} case_id 
 * @param {*} element 
 */
var updateCaseName = function(case_id, element) {
    var parEle = element.parentElement.parentElement;
    var nameElement = element.parentElement.parentElement.firstElementChild;
    var name = nameElement.innerText;
    var case_id = parEle.children[1].innerText;
    nameElement.outerHTML = "<td class='form-group'><input type='text' class='form-control' value='" + name + "'></input></td>";
    element.outerHTML = "<button class='btn btn-sm btn-success' onClick='saveChange(\"" + case_id + "\", this)'><i class='fa fa-check'></i></button> <button class='btn btn-sm btn-danger' onclick=\'cancelChange(\"" + name + "\", this, \"" + case_id + "\")\'><i class='fa fa-times-circle'></i></button>"
}

/**
 * Saves the new name of an element
 * 
 * @param {*} case_id 
 * @param {*} element 
 */
var saveChange = function(case_id, element) {
    var parEle = element.parentElement.parentElement;
    var newNameEle = parEle.firstElementChild.firstElementChild;
    var name = newNameEle.value;
    parEle.children[3].innerHTML = "<td align='center'><button class='btn btn-sm' onClick='updateCaseName(\"" + case_id + "\", this)'><i class='fa fa-edit'></i></button></td>";

    parEle.firstElementChild.outerHTML = "<td onclick=\"window.document.location='../visualization/case/" + case_id + "'\">" + name + "</td>";

    //Save to DB
    http.patch('case/' + case_id, {'name': name}, function(response) { });
}

/**
 * Cancels the edits of a case name. Simply reloads the page without
 *  updating info.
 */
var cancelChange = function(name, element, case_id) {
    var parEle = element.parentElement.parentElement;
    var nameElement = parEle.firstElementChild;
    nameElement.outerHTML = "<td onclick=\"window.document.location='../visualization/case/" + case_id + "'\">" + name + "</td>";
    parEle.children[3].innerHTML = "<td align='center'><button class='btn btn-sm' onClick='updateCaseName(\"" + case_id + "\", this)'><i class='fa fa-edit'></i></button></td>";
}