var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var RaceModule = require('./race');
var raceSchema = RaceModule.raceSchema;

var seasonSchema = {
  league_id: Number, 
  season_id: Number, 
  name: String, 
  races: [raceSchema]
};

var Season = mongoose.model('Season', seasonSchema);
module.exports = {Season: Season, seasonSchema: seasonSchema };
