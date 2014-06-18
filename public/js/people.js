function init() {
  var serverBaseUrl = document.domain;

  var socket = io.connect(serverBaseUrl);

  var sessionId = '';

  function updateParticipants(participants) {
    $('#participants_online').html('');
    $('#participants_offline').html('');
    map = {}
    for (var sId in participants.online){
      userName = participants.online[sId];
      if (map[userName] == undefined || map[userName] !== sessionId){
        map[userName] = sId;
      }
    }
    for (var name in map) {
      var userEle = (map[name] === sessionId ? '<span class="name" id="' + map[name] + '" userId="' + name + '">' + name + '(Me)</spa><br/>' : '<div class="btn-group"><button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown" value="chat" userid="' + name + '">' + name + '  <span class="caret"></span></button><ul class="dropdown-menu" role="menu"><li><a href="#" class="clickable" userId="' + name +'">Chat</a></li></ul></div><br/>');
      var userEle = (map[name] === sessionId ? '<span class="list-group-item" id="' + map[name] + '" userName="' + name + '">' + name + '(Me)</span>': '<a href="/profile?peer='+name+'" class="list-group-item" username="' + name + '">'+name+'</a>');
      $('#participants_online').append(userEle);
    }

    participants.all.forEach(function(name) {
      if (map[name] == undefined) {
        //var userEle = '<div class="btn-group"><button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown" value="chat" userid="' + name + '">' + name + '  <span class="caret"></span></button><ul class="dropdown-menu" role="menu"><li><a href="#" class="clickable" userId="' + name +'">Leave a message</a></li></ul></div><br/>';
        var userEle = '<a href="/profile?peer='+name+'" class="list-group-item" username="' + name +'">'+name+'</a>';
        $('#participants_offline').append(userEle);
      }
    });
  }

  socket.on('connect', function () {
    sessionId = socket.socket.sessionid;
    $.ajax({
      url:  '/user',
      type: 'GET',
      dataType: 'json'
    }).done(function(data) {
      var name = data.name;
      socket.emit('newUser', {id: sessionId, name: name});
    });

  });

  socket.on('newConnection', function (data) {
    updateParticipants(data.participants);
  });

  socket.on('userDisconnected', function(data) {
    updateParticipants(data.participants);
  });

  socket.on('nameChanged', function (data) {
    $('#' + data.id).html(data.name + ' ' + (data.id === sessionId ? '(You)' : '') + '<br />');
  });

  socket.on('incomingMessage', function (data) {
    var message = data.message;
    var name = data.name;
    $('#messages').prepend('<b>' + name + '</b><br />' + message + '<hr />');
  });

  socket.on('error', function (reason) {
    console.log('Unable to connect to server', reason);
  });

  $("#searchBox").on("keyup click input", function(){
    if (this.value.length > 0) {
      $(".userName").show().filter(function() {
        return $(this).text().toLowerCase().indexOf($("#searchBox").val().toLowerCase()) == -1;
      }).hide();      
    } else {
      $(".userName").show();
    }
  });


  $("#participants_online").on("click",".clickable", function() {
      location.href="/private?peer="+$(this).attr('userId'); 
  });
  $("#participants_offline").on("click",".clickable", function() {
      location.href="/private?peer="+$(this).attr('userId'); 
  });
}

$(document).on('ready', init);
