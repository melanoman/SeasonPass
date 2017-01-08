var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var driverSchema = {
  league_id: Number, 
  team_id: Number, 
  driver_id: Number, 
  name: String, 
  bday: Number, 
  injuries: [{year: Number, race: Number, level: Number}]
};

var Driver = mongoose.model('Driver', driverSchema);
module.exports = {Driver: Driver, driverSchema: driverSchema};
