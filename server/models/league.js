var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var TeamModule = require('./team');
var teamSchema = TeamModule.teamSchema;
var SeasonModule = require('./season');
var seasonSchema = SeasonModule.seasonSchema;

var leagueSchema = {
  league_id: Number, 
  name: String, 
  teams: [teamSchema],
  seasons: [seasonSchema]
};

var League = mongoose.model('League', leagueSchema);
module.exports = {League: League, leagueSchema: leagueSchema};
