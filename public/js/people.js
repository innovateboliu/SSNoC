function init() {
  var serverBaseUrl = document.domain;

  var socket = io.connect(serverBaseUrl);

  var sessionId = '';

  function updateParticipants(participants) {
    $('#participants_online').html('');
    $('#participants_offline').html('');
    var map = {};
    var userName = '';
    var status = '';
    var userEle = '';
    var statuses = {ok: "I'm OK", emergency: 'Emergency', assistance: 'Need Assistance'};
    for (var sId in participants.online){
      userName = participants.online[sId].userName;
      status = participants.online[sId].status;
      if (map[userName] == undefined || map[userName] !== sessionId){
        map[userName] = {sId:sId, status:status};
      }
    }
    for (var name in map) {
      userEle = (map[name].sId === sessionId ? '<a href="/profile?userName='+name+'" class="list-group-item userName" id="' + map[name].sId + '" userName="' + name + '">' + name + ' (Me)      <span class="label label-default ' + map[name].status + '">' + statuses[map[name].status] + '</span>' + '</a>': '<a href="/profile?peer='+name+'" class="list-group-item userName">' + name + '      <span class="label label-default ' + map[name].status + '">' + statuses[map[name].status] + '</span>'+'</a>');
      $('#participants_online').append(userEle);
    }

    participants.all.forEach(function(userObj) {
      if (map[userObj.userName] == undefined) {
        userEle = '<a href="/profile?peer='+userObj.userName+'" class="list-group-item userName offline">' + userObj.userName+'      <span class="label label-default ' + userObj.status + '">' + statuses[userObj.status] + '</span>  '+'</a>';
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
      var status = data.status;
      socket.emit('newUser', {id: sessionId, name: name, status: status});
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
