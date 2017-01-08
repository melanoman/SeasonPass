var express    = require('express');
var app        = express();
var bodyParser = require('body-parser');
var mongoose   = require('mongoose');
mongoose.connect('mongodb://localhost:27017/fdspdb');

//MODELS ///////////////////////////////////////////////
var League = require('./models/league').League;
var Team = require('./models/team').Team;
var Driver = require('./models/driver').Driver;
var Season = require('./models/season').Season;
var Race = require('./models/race').Race;
var Result = require('./models/result').Result;
////////////////////////////////////////////////////////

//Utilities ////////////////////////////////////////////
var fail = (err_msg,res) => {
  console.error(err_msg);
  res.status(500).send({error: err_msg});
}

////////////////////////////////////////////////////////

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE")
    next();
});

var router = express.Router();

//ROUTES ////////////////////////////////////////////////
router.use((req, res, next) => {
    // permission check goes here
    // return without calling next() to deny

    next(); // permission granted
});

var about = (req, res) => { res.json({name: 'season-pass-server', displayName: 'Season Pass REST API by Mel Nicholson', version: '0.0.1'})}
var scratch = -1;
router.get('/', about);
router.get('/about', about);
router.route('/leagues')
  .get((req, res) => { League.find((err,ret) => (err ? fail(err) : res.json(ret))) })
  .post((req, res) => {
     League.count((err, ret) => {
       if(err) { fail(err, ret); return; }
       var id = ret + 1;
       var league = new League();
       league.name = (req.body.name ? req.body.name : ('League'+id));
       league.league_id = id;
       league.teams = [];
       league.seasons = [];
       league.save((err) => err ? fail(err, res) : res.json(league))
     })
  });

router.route('/league/:league_id')
  .get((req,res) => { League.find({ league_id: req.params.league_id }, (err, ret) => err?fail(err): res.json(ret)) })
  .put((req,res) => { League.findOne({ league_id: req.params.league_id }, (err, ret) => {
    if (!ret) { res.status(404).send(); return; }
    var dirty = false;
    if (req.body.name) { ret.name = req.body.name; dirty = true; }
    if (dirty) { ret.save((err,ret) => err ? fail(err,res) : res.json(ret)) }
    else { res.status(204).send(); }
  }) });

router.route('/league/:league_id/teams')
  .get((req,res) => { League.findOne({ league_id: req.params.league_id }, (err, ret) => err?fail(err): res.json(ret.teams)) })
  .post((req,res)=> { League.findOne({ league_id: req.params.league_id }, (err, league) => {
    if(err) { fail(err,res); return; }
    if(!league) { res.status(404).send(); return; }
    var team = new Team();
    team.league_id = league.league_id;
    team.team_id = 1 + league.teams.length;
    team.name = (req.body.name) ? req.body.name : 'League'+team.league_id+'Team'+team.team_id;
    league.teams.push(team);
    league.save((err) => { err ? fail(err,res) : res.json(team) })
  }) });

router.route('/league/:league_id/team/:team_id')
  .get((req,res) => {
    League.findOne({ league_id: req.params.league_id }, (err, league) => {
      if(err) { fail(err,res); return; }
      if(!league) { res.status(404).send(); return; }
      var team = null;
      league.teams.forEach(x => { if (x.team_id == req.params.team_id) { team = x; } });
      if (!team) { res.status(404).send(); return; }
      res.json(team);
    })
  })
  .put((req,res) => {
    League.findOne({ league_id: req.params.league_id }, (err, league) => {
      if(err) { fail(err,res); return; }
      if(!league) { res.status(404).send(); return; }
      var team = null;
      league.teams.forEach(x => { if (x.team_id == req.params.team_id) { team = x; } });
      if (!team) { res.status(404).send(); return; }
      var dirty = false;
      if (req.body.name) { team.name = req.body.name; dirty = true; }
      if (dirty) { league.save((err,ret) => err ? fail(err,res) : res.json(team)) }
      else { res.status(204).send(); }
    })
  });

router.route('/league/:league_id/team/:team_id/drivers')
  .get((req,res) => {
    League.findOne({ league_id: req.params.league_id }, (err, league) => {
      if(err) { fail(err,res); return; }
      if(!league) { res.status(404).send(); return; }
      var team = null;
      league.teams.forEach(x => { if (x.team_id == req.params.team_id) { team = x; } });
      if (!team) { res.status(404).send(); return; }
      res.json(team.drivers);
    })
  })
  .post((req,res) => {
    League.findOne({ league_id: req.params.league_id }, (err, league) => {
      if(err) { fail(err,res); return; }
      if(!league) { res.status(404).send(); return; }
      var team = null;
      league.teams.forEach(x => { if (x.team_id == req.params.team_id) { team = x; } });
      if (!team) { res.status(404).send(); return; }
      var drivers = team.drivers.slice();
      var driver = new Driver();
      driver.league_id = team.league_id;
      driver.team_id = team.team_id;
      driver.driver_id = 1 + team.drivers.length;
      driver.name = (req.body.name) ? req.body.name : 'Driver'+driver.driver_id;
      driver.bday = (league.seasons) ? league.seasons.length : 1;
      driver.injuries = []
      drivers.push(driver);
      team.drivers = drivers;
      league.save();
      res.json(driver)
    })
  });

router.route('/league/:league_id/team/:team_id/driver/:driver_id')
  .get((req,res) => {
    League.findOne({ league_id: req.params.league_id }, (err, league) => {
      if(err) { fail(err,res); return; }
      if(!league) { res.status(404).send(); return; }
      var team = null;
      league.teams.forEach(x => { if (x.team_id == req.params.team_id) { team = x; } });
      if (!team) { res.status(404).send(); return; }
      var driver = null;
      team.drivers.forEach(x => { if (x.driver_id == req.params.driver_id) { driver = x; }});
      if (!driver) { res.status(404).send(); return; }
      res.json(driver)
    })
  })
  .put((req,res) => {
    League.findOne({ league_id: req.params.league_id }, (err, league) => {
      if(err) { fail(err,res); return; }
      if(!league) { res.status(404).send(); return; }
      var team = null;
      league.teams.forEach(x => { if (x.team_id == req.params.team_id) { team = x; } });
      if (!team) { res.status(404).send(); return; }
      var driver = null;
      team.drivers.forEach(x => { if (x.driver_id == req.params.driver_id) { driver = x; }});
      if (!driver) { res.status(404).send(); return; }
      var dirty = false;
      if (req.body.name) { driver.name = req.body.name; dirty = true; }
      if (req.body.bday) { driver.bday = req.body.bday; dirty = true; }
      if (dirty) { league.save((err,ret) => err ? fail(err,res) : res.json(driver)) }
      else { res.status(204).send(); }
    })
  });

router.route('/league/:league_id/seasons')
  .get((req,res) => {
    League.findOne({ league_id: req.params.league_id }, (err, league) => {
      if(err) { fail(err,res); return; }
      if(!league) { res.status(404).send(); return; }
      res.json(league.seasons);
    })
  })
  .post((req,res) => {
    League.findOne({ league_id: req.params.league_id }, (err, league) => {
      if(err) { fail(err,res); return; }
      if(!league) { res.status(404).send(); return; }
      var season = new Season();
      var id = 1 + league.seasons.length;
      season.league_id = league.league_id;
      season.season_id = id;
      season.name = (req.body.name) ? req.body.name : "Season"+id;
      season.races = [];
      league.seasons.push(season);
      league.save((err,ret) => err ? fail(err,res) : res.json(season))
    })
  });

router.route('/league/:league_id/season/:season_id')
  .get((req,res) => {
    League.findOne({ league_id: req.params.league_id }, (err, league) => {
      if(err) { fail(err,res); return; }
      if(!league) { res.status(404).send(); return; }
      var season = null;
      league.seasons.forEach(x => { if(x.season_id == req.params.season_id) { season = x } })
      if (season == null) { res.status(404).send(); return; }
      res.json(season);
    })
  })
  .put((req,res) => {
    League.findOne({ league_id: req.params.league_id }, (err, league) => {
      if(err) { fail(err,res); return; }
      if(!league) { res.status(404).send(); return; }
      var season = null;
      league.seasons.forEach(x => { if(x.season_id == req.params.season_id) { season = x } })
      if (season == null) { res.status(404).send(); return; }
      var dirty = false;
      if (req.body.name) { season.name = req.body.name; dirty = true; }
      league.save((err, ret) => err ? fail(err,res) : res.json(season))
    })
  })

router.route('/league/:league_id/season/:season_id/races')
  .get((req,res) => {
     League.findOne({ league_id: req.params.league_id }, (err, league) => {
      if(err) { fail(err,res); return; }
      if(!league) { res.status(404).send(); return; }
      var season = null;
      league.seasons.forEach(x => { if(x.season_id == req.params.season_id) { season = x } })
      if (season == null) { res.status(404).send(); return; }
      res.json(season.races)
    })
  })
  .post((req,res) => {
    League.findOne({ league_id: req.params.league_id }, (err, league) => {
      if(err) { fail(err,res); return; }
      if(!league) { res.status(404).send(); return; }
      var season = null;
      league.seasons.forEach(x => { if(x.season_id == req.params.season_id) { season = x } })
      if (season == null) { res.status(404).send(); return; }
      var race = new Race();
      var id = 1 + season.races.length;
      race.league_id = league.league_id;
      race.season_id = season.season_id;
      race.race_id = id;
      race.name = (req.body.name) ? req.body.name : "race"+id;
      season.races.push(race);
      league.save((err,ret) => err ? fail(err,res) : res.json(race))
    })
  })

router.route('/league/:league_id/season/:season_id/race/:race_id')
  .get((req,res) => {
    League.findOne({ league_id: req.params.league_id }, (err, league) => {
      if(err) { fail(err,res); return; }
      if(!league) { res.status(404).send(); return; }
      var season = null;
      league.seasons.forEach(x => { if(x.season_id == req.params.season_id) { season = x } })
      if (season == null) { res.status(404).send(); return; }
      var race = null;
      season.races.forEach(x => { if(x.race_id == req.params.race_id) { race = x } })
      if(!race) { res.status(404).send(); return; }
      res.json(race);
    })
  })
  .put((req,res) => {
    League.findOne({ league_id: req.params.league_id }, (err, league) => {
      if(err) { fail(err,res); return; }
      if(!league) { res.status(404).send(); return; }
      var season = null;
      league.seasons.forEach(x => { if(x.season_id == req.params.season_id) { season = x } })
      if (season == null) { res.status(404).send(); return; }
      var race = null;
      season.races.forEach(x => { if(x.race_id == req.params.race_id) { race = x } })
      if (race == null) { res.status(404).send(); return; }
      var dirty = false;
      if (req.body.name) { race.name = req.body.name; dirty = true; }
      if (typeof req.body.mult != "undefined") { race.mult = req.body.mult; dirty = true; } 
      if (typeof req.body.byes != "undefined") { race.byes = req.body.byes; dirty = true; } 
      if (dirty) { league.save((err,ret) => err ? fail(err,res) : res.json(race) )} 
    })
  });

router.route('/league/:league_id/season/:season_id/race/:race_id/results')
  .get((req,res) => {
    League.findOne({ league_id: req.params.league_id }, (err, league) => {
      if(err) { fail(err,res); return; }
      if(!league) { res.status(404).send(); return; }
      var season = null;
      league.seasons.forEach(x => { if(x.season_id == req.params.season_id) { season = x } })
      if (season == null) { res.status(404).send(); return; }
      var race = null;
      season.races.forEach(x => { if(x.race_id == req.params.race_id) { race = x } })
      if(!race) { res.status(404).send(); return; }
      res.json(race.results);
    })
  })
  .post((req,res) => {
    League.findOne({ league_id: req.params.league_id }, (err, league) => {
      if(err) { fail(err,res); return; }
      if(!league) { res.status(404).send(); return; }
      var season = null;
      league.seasons.forEach(x => { if(x.season_id == req.params.season_id) { season = x } })
      if (season == null) { res.status(404).send(); return; }
      var race = null;
      season.races.forEach(x => { if(x.race_id == req.params.race_id) { race = x } })
      if(!race) { res.status(404).send(); return; }

      var result = new Result();
      result.league_id = req.body.league_id;
      result.season_id = req.body.season_id;
      result.race_id = req.body.race_id;
      result.team_id = req.body.team_id;
      result.driver_id = req.body.driver_id;
      result.finished = req.body.finished;
      result.injury = req.body.injury > 0 ? req.body.injury : 0;

      race.results.push(result)
      league.save((err, ret) => err ? fail(err,res) : res.json(race.results))
    })
  });

router.route('/league/:league_id/season/:season_id/race/:race_id/result/:victim')
  .delete((req,res) => {
    League.findOne({ league_id: req.params.league_id }, (err, league) => {
      if(err) { fail(err,res); return; }
      if(!league) { res.status(404).send(); return; }
      var season = null;
      league.seasons.forEach(x => { if(x.season_id == req.params.season_id) { season = x } })
      if (season == null) { res.status(404).send(); return; }
      var race = null;
      season.races.forEach(x => { if(x.race_id == req.params.race_id) { race = x } })
      if(!race) { res.status(404).send(); return; }
      race.results.splice(req.params.victim, 1);
      league.save((err, ret) => err ? fail(err,res) : res.json(race.results))
    })
  })

/////////////////////////////////////////////////////////

app.use('/season_pass', router);
var port = process.env.PORT || 2846
app.listen(port);
console.log("Season Pass Server running on port "+port);
