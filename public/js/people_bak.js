function init() {
  var serverBaseUrl = document.domain;

  var socket = io.connect(serverBaseUrl);

  var sessionId = '';

  function updateParticipants(participants) {
    $('#participants').html('');
    map = {}
    for (var i = 0; i < participants.length; i++) {
      p = participants[i];
      if (map[p.name] == undefined || map[p.name] !== sessionId){
        map[p.name] = p.id;
      }
    }
    for (var name in map) {
      $('#participants').append('<span class="name" id="' + map[name] + '" userId="' + name + '">' +
        name + ' ' + (map[name] === sessionId ? '(Me)' : '<input type="button" class="clickable" value="chat"' + 'userid="' + name + '">') + '<br /></span>');
    }
  }

  socket.on('connect', function () {
    sessionId = socket.socket.sessionid;
    $.ajax({
      url:  '/userId',
      type: 'GET',
      dataType: 'json'
    }).done(function(data) {
      var userId = data.userId;
      socket.emit('newUser', {id: sessionId, name: userId});
    });

  });

  socket.on('newConnection', function (data) {
    updateParticipants(data.participants);
  });

  socket.on('userDisconnected', function(data) {
    $('#' + data.id).remove();
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


  $("#participants").on("click",".clickable", function() {
      location.href="/private?peer="+$(this).attr('userId'); 
  });
}

$(document).on('ready', init);
