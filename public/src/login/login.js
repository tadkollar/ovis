
var tempToken = -1;

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
            $('#successModalTitle').show();
            $('#failModalTitle').hide();
            tempToken = response.token;
        }
        else {
            $('#registerSuccessBody').hide();
            $('#registerFailBody').show();
            $('#registerSuccessClose').show();
            $('#registerSuccessOkay').hide();
            $('#failedText').text(response.reasoning);
            $('#successModalTitle').hide();
            $('#failModalTitle').show();
            tempToken = -1;
        }
    });
};

var loginPress = function () {
    var token = document.getElementById('token').value;
    if(token) {
        login(token);
    }
    else {
        console.log("Enter a token!");
    }
}

var loginRegister = function() {
    login(tempToken);
}

var login = function(token=-1) {
    if(token != -1) {
        http.post('login', {'token': token}, function(result) {
            if(result.status == "Success") {
                window.location.href += ('login/' + token);
            }
            else {
                console.log("Failed to login")
            }
        });
        console.log("Sending: " + token);
    }
    else {
        console.log("Token was -1");
    }
}
