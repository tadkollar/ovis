
var register = function () {
    var name = document.getElementById('name').value;
    var email = document.getElementById('email').value;

    http.post('token', { 'name': name, 'email': email }, function (response) {
        console.log(response);
        if (response.status === 'Success') {
            $('#registerSuccessBody').show();
            $('#registerFailBody').hide();
            $('#registerSuccessClose').hide();
            $('#registerSuccessOkay').show();
            $('#tokenText').text(response.token);
        }
        else {
            $('#registerSuccessBody').hide();
            $('#registerFailBody').show();
            $('#registerSuccessClose').show();
            $('#registerSuccessOkay').hide();
            $('#failedText').text(response.reasoning);
        }
    });
};

var login = function () {
    var token = document.getElementById('token').value;

    //Send to server, maybe redirect?
}
