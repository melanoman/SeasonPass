var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var resultSchema = {
  league_id: Number, 
  season_id: Number, 
  race_id: Number, 
  team_id: Number,
  driver_id: Number,
  finished: Boolean,
  injury: Number 
};

var Result = mongoose.model('Result', resultSchema);
module.exports = {Result: Result, resultSchema: resultSchema};
