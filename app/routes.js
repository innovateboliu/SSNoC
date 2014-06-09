module.exports = function(app, _, io) {
  app.get("/", function(req, res) {
    if (req.session.userId) {
      console.log('req.session.userid ' + req.session.userId);
      res.writeHead(301, {
        'Location':'/people'
      });
      res.end();
    } else { 
      res.render("join");
    }
  });

  app.get("/everyone", function(req, res) {
    if (req.session.userId) {
      res.render("everyone");
    } else {
      res.redirect(301, '/');
    }
  });


  app.get("/private", function(req, res) {
    if (req.session.userId) {
      res.render("private", {userId:req.query.peer});
    } else {
      res.redirect(301, '/');
    }
  });

  app.get("/people", function(req, res) {
    if (req.session.userId) {
      res.render("people", {userId: req.session.userId});
    } else {
      res.redirect(301, '/');
    }
  });

  app.post("/join", function(req, res) {
    var name = req.body.name;
    req.session.userId = name;
    //res.redirect(301, '/everyone');
    res.json(200);
  });

  app.get("/userId", function(req, res) {
    res.json(200, {userId:req.session.userId});
  });


  app.post("/message", function(request, response) {

    var message = request.body.message;

    if(_.isUndefined(message) || _.isEmpty(message.trim())) {
      return response.json(400, {error: "Message is invalid"});
    }

    var name = request.body.name;

    io.sockets.emit("incomingMessage", {message: message, name: name});

    response.json(200, {message: "Message received"});

  });


  app.post("/private_message", function(request, response) {

    var message = request.body.message;

    if(_.isUndefined(message) || _.isEmpty(message.trim())) {
      return response.json(400, {error: "Message is invalid"});
    }

    var name = request.body.name;
    var peer = request.body.peer;

    var peer_candidates = _.filter(participants, function(person){
      return person.name === peer;
    });

    var sender_candidates = _.filter(participants, function(person){
      return person.name === name;
    });

    for (var i = 0; i <  peer_candidates.length; i++) { 
      var p = peer_candidates[i];
      io.sockets.socket(p.id).emit("incomingMessage", {message: message, name: name});
    }

    for (var i = 0; i <  sender_candidates.length; i++) { 
      var p = sender_candidates[i];
      io.sockets.socket(p.id).emit("incomingMessage", {message: message, name: name});
    }
    response.json(200, {message: "Message received"});

  });
};

