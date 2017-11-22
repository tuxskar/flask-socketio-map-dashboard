$(document).ready(function () {

    // reset the votes
    $('#reset-votes').on('click', function (x) {
        socket.emit('reset-votes')
    }).show();

});