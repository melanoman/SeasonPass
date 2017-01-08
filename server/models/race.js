var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ResultModule = require('./result');
var resultSchema = ResultModule.resultSchema;

var raceSchema = {
  league_id: Number, 
  season_id: Number, 
  race_id: Number,
  name: String, 
  mult: Number,
  byes: Number,
  results: [resultSchema]
};

var Race = mongoose.model('Race', raceSchema);
module.exports = { Race: Race, raceSchema: raceSchema };
