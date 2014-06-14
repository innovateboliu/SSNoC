var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
var User = require('./User');

var groupSchema = Schema({
  participants : [{type : Schema.Types.ObjectId, ref : 'User'}],
  chats : []
});

/*
userSchema.methods.validPassword = function(password) {
  return bcrypt.compareSync(password, this.local.password);
};
*/

module.exports = mongoose.model('Group', groupSchema);
