var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var DriverModule = require('./driver');
var driverSchema = DriverModule.driverSchema;

var teamSchema = {
  league_id: Number,
  team_id: Number,
  name: String, 
  drivers: [driverSchema]
};

var Team = mongoose.model('Team', teamSchema);
module.exports = { Team: Team, teamSchema: teamSchema };
