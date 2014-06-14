function init() {
  var serverBaseUrl = document.domain;

  var socket = io.connect(serverBaseUrl);

  var name;
  var sessionId;

  socket.on('connect', function () {
    sessionId = socket.socket.sessionid;
    $.ajax({
      url:  '/userId',
      type: 'GET',
      dataType: 'json'
    }).done(function(data) {
      name = data.userId;
      socket.emit('newUser', {id: sessionId, name: name});
      retrieveGroups();
    });
  });

  socket.on('error', function (reason) {
    console.log('Unable to connect to server', reason);
  });
  
  function retrieveGroups() {
    $.ajax({
      url : '/all_chats',
      type: 'POST',
      dataType: 'json',
      data: {name : name}
    }).done(function(data){
      console.log(data);
    });
  }
}

$(document).on('ready', init);
