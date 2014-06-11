var express = require("express"),
  app = express(),
  http = require("http").createServer(app),
  io = require("socket.io").listen(http),
  _ = require("underscore"),
  mongoose = require('mongoose'),
  passport = require('passport'),
  flash = require('connect-flash'),
  User = require('./app/models/User'),
  MongoStore = require('connect-mongo')(express);

var participants = {
  online : {},
  all : [] 
};

console.log('in server ' + JSON.stringify(participants));

var configDb = require('./config/database');

mongoose.connect(configDb.url);

require('./config/passport')(passport);

app.set("ipaddr", "0.0.0.0");

app.set("port", 7777);

app.set("views", __dirname + "/app/views");

app.set("view engine", "jade");

app.use(express.logger('dev'));

app.use(express.static("public", __dirname + "/public"));

app.use(express.bodyParser());

app.use(express.cookieParser());

app.use(express.session({secret : 'boliuboliuboliu', cookie : {maxAge : 3600000 }}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
/*
app.use(express.cookieSession({
  key: 'ssnoc',
  secret: '1234567890'
}));
*/
/*
app.use(express.session({
  store: new MongoStore({
    db: 'ssnoc',
    host:'0.0.0.0',
    port:27017
  }),
  secret:'1234567890'
}));
*/

User.find({}, function(err, users) {
  users.forEach(function(user) {
    console.log("!!!!!!!!!!!" +  JSON.stringify(user.local));
    participants.all.push(user.local.name);
    console.log("@@@@@@@@@@@@@@@@@@@" + JSON.stringify(participants));
  });

  require('./app/routes')(app, _, io, participants, passport);
  require('./app/socket')(_, io, participants);
}); 

http.listen(app.get("port"), app.get("ipaddr"), function() {
  console.log("Server up and running. Go to http://" + app.get("ipaddr") + ":" + app.get("port"));
});
