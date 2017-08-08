
var register = function() {
    var name = document.getElementById('name').value;
    var email = document.getElementById('email').value;

    http.post('token', {'name': name, 'email': email}, function(response) {
        console.log(response);
    });
};

var login = function() {
    var token = document.getElementById('token').value;

    //Send to server, maybe redirect?
}