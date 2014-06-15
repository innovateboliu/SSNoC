function init() {
  var serverBaseUrl = document.domain;

  var socket = io.connect(serverBaseUrl);

  var name;
  var userId;
  var sessionId;

  socket.on('connect', function () {
    sessionId = socket.socket.sessionid;
    $.ajax({
      url:  '/user',
      type: 'GET',
      dataType: 'json'
    }).done(function(data) {
      name = data.name;
      userId = data.userId;
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
      data: {userId: userId}
    }).done(function(groupInfos){
      console.log(groupInfos.length);
      groupInfos.forEach(function(groupInfo) {
        console.log(groupInfo.groupId + ", " +groupInfo.peer);
        $('#all_chats').append('<li class="list-group-item" groupId="' + groupInfo.groupId + '" peerName="'+groupInfo.peer + '">' + '<a href="/private?peer='+groupInfo.peer+'"><i class="icon-chevron-right"></i>' + groupInfo.peer + '</a></list>'); 
      });
    });
  }
}

$(document).on('ready', init);
