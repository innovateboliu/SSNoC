function init() {
  var serverBaseUrl = document.domain;

  var socket = io.connect(serverBaseUrl);

  var sessionId = '';

  socket.on('connect', function () {
    sessionId = socket.socket.sessionid;
    $.ajax({
      url:  '/user',
      type: 'GET',
      dataType: 'json'
    }).done(function(data) {
      var name = data.name;
      var status = data.status;
      socket.emit('newUser', {id: sessionId, name: name, status: status});
    });

  });


  socket.on('error', function (reason) {
    console.log('Unable to connect to server', reason);
  });

  $("#chat").on("click", function() {
      location.href="/private?peer="+$(this).attr('peer'); 
  });
}

$(document).on('ready', init);
