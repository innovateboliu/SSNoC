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
    res.render("private", {peer:req.query.peer});
  });

  app.get("/people", isLoggedIn, function(req, res) {
    res.render("people", {userId: req.session.userId});
  });

  app.get("/all_chats", isLoggedIn, function(req, res) {
    res.render("all_chats");
  });

  app.post("/all_chats", function(req, res) { 
    var name = req.body.name;
    Group.find({}, function(err, groups) {
      if (err)
        res.send(500, err);
      
      var groupInfos = [];

      groups.map(function(group) {
        User.findOne({"_id":group.participants[0]}, function(err, user1) {
          if (err)
            res.send(500, err);
          if (!user1)
            res.send(500, "user not found");
          User.findOne({"_id":group.participants[1]}, function(err, user2) {
            if (err)
              res.send(500, err);
            if (!user2)
              res.send(500, "user not found");
            
            groupInfos.push({"_id": group._id, "participants":[user1.local.name, user2.local.name]});
          });
        });
      }); 
      res.json(200, groupInfos);
    });
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

  app.get("/user", function(req, res) {
    var userId = req.session.passport.user;
    User.findById(userId, function(err, user) {
      if (user !== null) {
        res.json(200, {name:user.local.name, userId:userId});
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
      if (err) { 
        console.log("1");
        res.json(500, err);
      }

      if (!user1) {
        console.log("2");
        res.json(500, 'user not existing');
      }

      User.findOne({'local.name' : peer2}, function(err, user2) {
        //var inter = _.intersection(user1.groups, user2.groups);
        var inter = user1.groups.filter(function(group) {
          return user2.groups.indexOf(group) != -1;
        });
        var groupId;
        if (inter.length > 0) {
          groupId = inter[0];
          console.log('groupId is ' + groupId);
          Group.findOne({_id : groupId}, function(err, group) {
            if (err) {
              res.json(500, err);
              console.log('error is '+ err);
            }

            console.log('chats history is '+ JSON.stringify(group.chats));
            res.json(200, {"chats" : group.chats, "groupId" : groupId});
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

    var groupId = request.body.groupId;
    var name = request.body.name;
    var peer = request.body.peer;

    /*
    var peer_candidates = _.filter(participants.online, function(person){
      return person.name === peer;
    });
    */
    var peer_candidates = [];
    var onlineUsers = participants.online;
    for (sid in onlineUsers) {
      if (onlineUsers[sid] === peer)
        peer_candidates.push(sid);
    }

    /*
    var sender_candidates = _.filter(participants.online, function(person){
      return person.name === name;
    });
    */
    var sender_candidates = [];
    for (sid in onlineUsers) {
      if (onlineUsers[sid] === name)
        sender_candidates.push(sid);
    }

    Group.findOne({"_id" : groupId}, function(err, group) {
      if (err) {
        console.log("Error when querying group in private chat: " + err);
        return;
      }
      if (!group) {
        console.log("Group not found when querying group in private chat: ");
        return;
      }
      group.chats.push({"sender":name, "content":message});
      group.save(function(err) {
        if (err) {
          console.log("Error when saving group in private chat: " + err);
          return;
        }
        for (var i = 0; i <  peer_candidates.length; i++) { 
          var sid = peer_candidates[i];
          io.sockets.socket(sid).emit("incomingMessage", {message: message, name: name});
        }

        for (var i = 0; i <  sender_candidates.length; i++) { 
          var sid = sender_candidates[i];
          io.sockets.socket(sid).emit("incomingMessage", {message: message, name: name});
        }
        response.json(200, {message: "Message received"});
      });
    });

  });
};

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated())
    return next();

  res.redirect('/');
}
