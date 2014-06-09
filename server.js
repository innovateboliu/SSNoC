var express = require("express")
  , app = express()
  , http = require("http").createServer(app)
  , io = require("socket.io").listen(http)
  , _ = require("underscore")
  , MongoStore = require('connect-mongo')(express);

var participants = []


app.set("ipaddr", "0.0.0.0");

app.set("port", 7777);

app.set("views", __dirname + "/app/views");

app.set("view engine", "jade");

app.use(express.static("public", __dirname + "/public"));

app.use(express.bodyParser());

app.use(express.cookieParser());

app.use(express.cookieSession({
  key: 'ssnoc',
  secret: '1234567890'
}));
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

require('./app/routes')(app, _, io, participants);
require('./app/socket')(_, io, participants);

http.listen(app.get("port"), app.get("ipaddr"), function() {
  console.log("Server up and running. Go to http://" + app.get("ipaddr") + ":" + app.get("port"));
});
