function init() {
  var serverBaseUrl = document.domain;

  var socket = io.connect(serverBaseUrl);

  var sessionId = '';

  var name = '';

  socket.on('connect', function () {
    sessionId = socket.socket.sessionid;
    $.ajax({
      url:  '/user',
      type: 'GET',
      dataType: 'json'
    }).done(function(data) {
      name = data.name;
      var status = data.status;
      var statuses = {ok: "I'm OK", emergency: 'Emergency', assistance: 'Need Assistance'};

      $('.status_item').addClass(status);
      $('.status_item').text(statuses[status] + '    ');
      $('.status_item').append('<span class="caret"/>');
      $('.status_option').filter(function(){
        return $(this).attr('status') === status;
      }).hide();
      socket.emit('newUser', {id: sessionId, name: name, status: status});
    });

  });


  socket.on('error', function (reason) {
    console.log('Unable to connect to server', reason);
  });

  $("#chat").on("click", function() {
      location.href="/private?peer="+$(this).attr('peer'); 
  });

  $(".status_option").on("click", function(event) {
    event.preventDefault();
    $.ajax({
      url:  '/status',
      type: 'PUT',
      data: {user_name:name, new_status:$(this).attr('status')}
    }).done(function(data) {
      location.reload();
    }).fail(function(res) {
      alert(JSON.stringify(res));
    });
  });
}

$(document).on('ready', init);
