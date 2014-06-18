function init() {

  var serverBaseUrl = document.domain;

  var socket = io.connect(serverBaseUrl);

  var sessionId = '';

  var name = '';
  var peer = $("#peer").attr("peerName");
  var groupId = '';

  function updateParticipants(participants) {
    $('#participants').html('');
    var map = {}
    for (var i = 0; i < participants.length; i++) {
      p = participants[i];
      if (map[p.name] == undefined || map[p.name] !== sessionId){
        map[p.name] = p.id;
      }
    }
    for (var name in map) {
      $('#participants').append('<span class="name" id="' + map[name] + '">' +
        name + ' ' + (map[name] === sessionId ? '(You)' : '') + '<br /></span>');
    }
  }

  socket.on('connect', function () {
    sessionId = socket.socket.sessionid;
    $.ajax({
      url:  '/user',
      type: 'GET',
      dataType: 'json'
    }).done(function(data) {
      name = data.name;
      socket.emit('newUser', {id: sessionId, name: name});
      retrieveChatsRecord();
    });
  });



  socket.on('incomingMessage', function (data) {
    var message = data.message;
    var name = data.name;
    var ts = data.ts;
    appendNewMsg({sender: name, content:message, ts:ts});
    $(document).scrollTop($(document).height());
  });

  socket.on('error', function (reason) {
    console.log('Unable to connect to server', reason);
  });

  function sendMessage() {
    var outgoingMessage = $('#outgoingMessage').val();
    $.ajax({
      url:  '/private_message',
      type: 'POST',
      dataType: 'json',
      data: {message: outgoingMessage, name: name, peer:peer, groupId:groupId}
    });
  }

  function outgoingMessageKeyDown(event) {
    if (event.which == 13) {
      event.preventDefault();
      if ($('#outgoingMessage').val().trim().length <= 0) {
        return;
      }
      sendMessage();
      $('#outgoingMessage').val('');
    }
  }

  function outgoingMessageKeyUp() {
    var outgoingMessageValue = $('#outgoingMessage').val();
    $('#send').attr('disabled', (outgoingMessageValue.trim()).length > 0 ? false : true);
  }

  function nameFocusOut() {
    var name = $('#name').val();
    socket.emit('nameChange', {id: sessionId, name: name});
  }

  function retrieveChatsRecord() {
    $.ajax({
      url: '/enter_private_chat',
      type: 'POST',
      dataType: 'json',
      data: {peer1:name, peer2:peer}
    }).done(function(group){
      groupId = group.groupId;
      group.chats.forEach(function(chat) {
        appendNewMsg(chat);
      });
      $('#outgoingMessage').attr('disabled', false);
    $(document).scrollTop($(document).height());
    });
  }

  function appendNewMsg(chat) {
    var pos = (chat.sender === name ? "text-right" : "text-left");
    $('#messages').append('<p class="' + pos + ' text-info">' + chat.sender + '</p><p class="' + pos + '">' + chat.content + '</p><p class="'+ pos +'"><small class="text-muted">' + chat.ts +'</small></p>' + '<hr />');
  }

  $('#outgoingMessage').attr('disabled', true);
  $('#name').on('focusout', nameFocusOut);
  $('#send').on('click', function() {
    sendMessage();
    $('#outgoingMessage').val('');
  });

}

$(document).on('ready', init);
