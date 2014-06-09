function init() {
  function join() {
    var name = $('#name').val();
    $.ajax({
      url:  '/join',
      type: 'POST',
      dataType: 'json',
      data: {name: name}
    }).done(function(data){
      location.href="http://54.183.85.61:7777/";
    });
  }
  $('#join').on('click', join);
  $("#name").Watermark("Name");
}

$(document).on('ready', init);
