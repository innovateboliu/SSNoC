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
      $('#participants_online').append('<span class="name" id="' + map[name] + '" userId="' + name + '">' +
        name + ' ' + (map[name] === sessionId ? '(Me)' : '<input type="button" class="clickable" value="chat"' + 'userid="' + name + '">') + '<br /></span>');
    }

    participants.all.forEach(function(name) {
      if (map[name] == undefined) {
        $('#participants_offline').append('<span class="name"  userId="' + name + '">' + name + '<br /></span>');
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
      $(".name").show().filter(function() {
        return $(this).text().toLowerCase().indexOf($("#searchBox").val().toLowerCase()) == -1;
      }).hide();      
    } else {
      $(".name").show();
    }
  });


  $("#participants_online").on("click",".clickable", function() {
      location.href="/private?peer="+$(this).attr('userId'); 
  });
}

$(document).on('ready', init);
