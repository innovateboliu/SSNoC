module.exports = function(_, io, participants) {
  io.on("connection", function(socket){
    console.log('in connection');

    console.log('in socket.js ' + JSON.stringify(participants));
    socket.on("newUser", function(data) {
      console.log('in newUser');
      participants.online[data.id] = {'userName' : data.name, 'status': data.status};
      console.log('participants are ' + JSON.stringify(participants));
      io.sockets.emit("newConnection", {participants: participants});
    });

    socket.on("nameChange", function(data) {
      _.findWhere(participants, {id: socket.id}).name = data.name;
      io.sockets.emit("nameChanged", {id: data.id, name: data.name});
      console.log('in nameChange');
    });

    socket.on("disconnect", function() {
      console.log('in disconnect');
      console.log('participants are ' + JSON.stringify(participants));
      console.log('socket id is ' + socket.id);
      //participants = _.without(participants,_.findWhere(participants, {id: socket.id}));
      delete participants.online[socket.id];
      console.log('participants are ' + JSON.stringify(participants));
      io.sockets.emit("userDisconnected", {id: socket.id, sender:"system", participants:participants});
    });

  });
};
