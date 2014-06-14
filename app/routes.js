var User = require('./models/User');
var Group = require('./models/Group');
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

  app.post("/enter_private_chat", function(req, res) {
    console.log("0");
    var peer1 = req.body.peer1;
    console.log(peer1);
    var peer2 = req.body.peer2;
    User.findOne({'local.name' : peer1}, function(err, user1) {
      if (err) 
        console.log("1");
        res.json(500, err);

      if (!user1) 
        console.log("2");
        res.json(500, 'user not existing');

      User.findOne({'local.name' : peer2}, function(err, user2) {
        //var inter = _.intersection(user1.groups, user2.groups);
        var inter = user1.groups.filter(function(group) {
          return user2.groups.indexOf(group) != -1;
        });
        console.log('group1 is ' + user1.groups);
        console.log('group2 is ' + user2.groups);
        console.log('intersection is ' + inter);
        var groupId;
        if (inter.length > 0) {
          groupId = inter[0];
          console.log('groupId is ' + groupId);
          Group.findOne({_id : groupId}, function(err, group) {
            res.json(200, group.chats);
          });
        } else {
          var newGroup = new Group();
          newGroup.participants.push(user1._id);
          newGroup.participants.push(user2._id);
          newGroup.save(function(err) {
            if (err)
              res.json(500, err);

            user1.groups.push(newGroup._id);
            user1.save(function(err) {
              if (err)
                res.json(500, err);

              user2.groups.push(newGroup._id);
              user2.save(function(err) {
                if (err)
                  res.json(500, err);

                res.json(200, newGroup.chats);
              });
            });
          });
        }
        
      });
    });
    
  });

  app.post("/private_message", function(request, response) {

    var message = request.body.message;

    if(_.isUndefined(message) || _.isEmpty(message.trim())) {
      return response.json(400, {error: "Message is invalid"});
    }

    var name = request.body.name;
    var peer = request.body.peer;

    var peer_candidates = _.filter(participants.online, function(person){
      return person.name === peer;
    });

    var sender_candidates = _.filter(participants.online, function(person){
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
