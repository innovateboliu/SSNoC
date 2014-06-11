var User = require('./models/User');
module.exports = function(app, _, io, participants, passport) {
  app.get("/", function(req, res) {
    if (req.isAuthenticated()) {
      res.redirect('/people');
    } else { 
      res.render("join");
    }
  });

  app.get('/signup', function(req, res) {
    res.render('signup');
  });

  app.get("/everyone", isLoggedIn, function(req, res) {
    res.render("everyone");
  });


  app.get("/private", isLoggedIn, function(req, res) {
    res.render("private", {userId:req.query.peer});
  });

  app.get("/people", isLoggedIn, function(req, res) {
    res.render("people", {userId: req.session.userId});
  });


  app.get("/logout", function(req, res) {
    req.logout();
    res.redirect('/');
  });

  app.post("/login", passport.authenticate('local-login', {
    successRedirect : '/people',
    failureRedirect : '/',
    failureFlash: true
  }));
  app.post("/signup", function(req, res, next) { 
    passport.authenticate('local-signup', function(err, user, info) {
      if (err) 
        return next(err);
      if (!user) 
        return res.redirect('/signup');
      req.logIn(user, function(err) {
        if (err) 
          return next(err);
        participants.all.push(user.local.name);
        return res.redirect('/');
      });
    })(req, res, next);
  });

  app.get("/userId", function(req, res) {
    var userId = req.session.passport.user;
    User.findById(userId, function(err, user) {
      if (user !== null) {
        res.json(200, {userId:user.local.name});
      }
    });
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

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated())
    return next();

  res.redirect('/');
}
