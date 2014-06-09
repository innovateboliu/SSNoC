module.exports = function(_, io, participants) {
  io.on("connection", function(socket){
      console.log('in connection');

    socket.on("newUser", function(data) {
      participants.push({id: data.id, name: data.name});
      console.log('in newUser');
      io.sockets.emit("newConnection", {participants: participants});
    });

    socket.on("nameChange", function(data) {
      _.findWhere(participants, {id: socket.id}).name = data.name;
      io.sockets.emit("nameChanged", {id: data.id, name: data.name});
      console.log('in nameChange');
    });

    socket.on("disconnect", function() {
      participants = _.without(participants,_.findWhere(participants, {id: socket.id}));
      io.sockets.emit("userDisconnected", {id: socket.id, sender:"system", participants:participants});
    });

  });
};
