var Score = {
  10: [ 100, 80, 65, 50, 40, 30, 20, 15, 10,  5 ],
  9:  [ 100, 80, 65, 50, 35, 25, 15, 10,  5 ],
  8:  [ 100, 80, 60, 45, 30, 20, 10,  5],
  7:  [ 100, 80, 60, 45, 30, 15, 5 ],
  6:  [ 100, 75, 55, 35, 20,  5 ],
  5:  [ 100, 70, 40, 20, 5 ],
  4:  [ 100, 65, 30,  5],
  3:  [ 100, 50, 5 ], // just to prevent crashes during data entry
  2:  [ 100, 5 ],
  1:  [ 5 ],
  0:  []
};

var Age = {
  0: [2, 4, 7, 10, 12],
  1: [2, 5, 8, 11, 14],
  2: [3, 6, 19, 13, 16],
  3: [3, 7, 11, 15, 18]
};

var Level = {
  req: [-999,0,6,20, 36, 50],
  lev: ['Retired', 'Rookie', 'Veteran', 'Champion', 'Legend', 'Icon'],
  xp2lev: (xp) => {
    var i=Level.req.length;
    while(i > 0) {
      i -= 1;
      if(xp >= Level.req[i]) { return Level.lev[i]; }
    }
    return 'Dead';
  }
};

var Calc = {
  cache:{},

  processLeague: (league) => {
    var result = {};
    var team = {};
    result.click2race = []
    var click = 0;
    result.team = team;
    result.nextRace = null;
    result.now = 0;
    league.teams.forEach(t => {
      var th = {};
      th.driver = {};
      th.score = 0;
      th.season = {}
      league.seasons.forEach(x => {
        var sh = {};
        sh.race = {};
        th.season[x.season_id] = sh;
        th.season[x.season_id].score = 0;
        x.races.forEach(r => {
          var rh = {}
          rh.score = 0;
          sh.race[r.race_id] = rh;
        })
      });
      team[t.team_id] = th;

      t.drivers.forEach(d => {
        var dh = {};
        dh.name = d.name;
        dh.score = 0;
        dh.xp = 0;
        dh.age = 1;
        dh.injuries = 0;
        dh.season = {};
        league.seasons.forEach(s => {
          var shd = {};
          shd.race = {};
          dh.season[s.season_id] = shd;
          dh.season[s.season_id].score = 0;
          s.races.forEach(r => {
            var rh = {}
            rh.score = 0;
            shd.race[r.race_id] = rh;
          })
        });
        th.driver[d.driver_id] = dh;
      })
    })
    result.season = {};
    var agers = {};
    league.seasons.forEach(s => {
      var complete = true;
      var sh = {};
      sh.race = {};
      result.season[s.season_id] = sh;
      s.races.forEach(r => {
        var rh = {};
        var byes = r.byes ? r.byes : 0;
        var mult = r.mult ? r.mult : 1;
        sh.race[r.race_id] = rh;
        click = click + 1 + byes;
        rh.click = click;
        if(result.nextRace == null && r.results.length === 0) { result.nextRace = r; result.now = click }
        var i = 0;
        while(i <= byes) { result.click2race.push(r); i += 1; }

        if(r.results && r.results.length > 0) {
          var score_list = Score[r.results.length];
          r.results.forEach((x,i) => {
            var xp = x.finished ? 2 : 1;
            if (x.injury && x.injury > 0) {
              result.team[x.team_id].driver[x.driver_id].recovery = click + x.injury;
              result.team[x.team_id].driver[x.driver_id].injuries += 1;
              xp -= x.injury + result.team[x.team_id].driver[x.driver_id].injuries + result.team[x.team_id].driver[x.driver_id].age;
            }
            var score = score_list[i] * mult;
            if (r.finished) { score += 5; }
            result.team[x.team_id].score += score;
            result.team[x.team_id].driver[x.driver_id].score += score;
            result.team[x.team_id].season[x.season_id].score += score;
            result.team[x.team_id].season[x.season_id].race[x.race_id].score += score;
            result.team[x.team_id].driver[x.driver_id].season[x.season_id].race[x.race_id].score += score;
            result.team[x.team_id].driver[x.driver_id].season[x.season_id].score += score;
            result.team[x.team_id].driver[x.driver_id].xp += xp;
            result.team[x.team_id].driver[x.driver_id].age += 1;
            agers[10000*x.team_id + x.driver_id] = { team_id: x.team_id, driver_id: x.driver_id }
          })
        } else {
          complete = false;
        }
      })
      if (complete) { for (var code in agers) {
        if(code[0] === '_') {continue}
        var x = agers[code];
        var years = result.team[x.team_id].driver[x.driver_id].age - 1;
        if(years > 4) { years = 4; }
        var injuries = Calc.convertInjuryCount(result.team[x.team_id].driver[x.driver_id].injuries)
        var penalty = Age[injuries][years];
        result.team[x.team_id].driver[x.driver_id].xp -= penalty;
      }}
    })
    Calc.cache[league.league_id] = result;
  },

  convertInjuryCount(count) {
    if(count <= 0) { return 0; }
    if(count <= 1) { return 1; }
    if(count <= 3) { return 2; }
    return 3;
  },

  getSortedDriverList: (league_id, season_id) => {
    var raw = [];
    var teamMap = Calc.cache[league_id].team;
    for (var ti in teamMap) {
      if (ti[0] === '_') { continue;}
      var driverMap = teamMap[ti].driver
      if (season_id === -1) {
        for (var di in driverMap) {
          if (di[0] !== '_') { raw.push({score: driverMap[di].score, driver_id: di, team_id: ti}) }
        }
      } else {
        for (di in driverMap) {
          if (di[0] !== '_') { raw.push({score: driverMap[di].season[season_id].score, driver_id: di, team_id: ti}) }
        }
      }
    }
    raw.sort((y,x) => x.score - y.score)
    return raw;
  },

  getSortedTeamList: (league_id, season_id) => {
    var raw = [];
    var teamMap = Calc.cache[league_id].team;
    if (season_id === -1) {
      for (var ti in teamMap) {
        if (ti[0] !== '_') { raw.push({score: teamMap[ti].score, team_id: ti}) }
      }
    } else {
      for (ti in teamMap) {
        if (ti[0] !== '_') { raw.push({score: teamMap[ti].season[season_id].score, team_id: ti}) }
      }
    }
    raw.sort((y,x) => x.score - y.score)
    return raw;
  },

  refreshDriver: (driver) => {
    var dh = Calc.cache[driver.league_id].team[driver.team_id].driver[driver.driver_id];
    if (!dh) {
      dh = {};
      Calc.cache[driver.league_id].team[driver.team_id].driver[driver.driver_id] = dh;
      dh.injuries = 0;
      dh.xp = 0;
      dh.age = 1;
    }
    dh.name = driver.name;
  },

  lookupDriverName: (league_id, team_id, driver_id) => {
    return Calc.cache[league_id].team[team_id].driver[driver_id].name;
  },

  race4click: (league_id, click) => {
    return Calc.cache[league_id].click2race[click];
  },

  getRecovery: (driver) => {
    var rec = Calc.cache[driver.league_id].team[driver.team_id].driver[driver.driver_id].recovery;
    return rec ? rec : 0;
  },

  points4driver: (league_id, season_id, team_id, driver_id) => {
    if(season_id === -1) { return Calc.cache[league_id].team[team_id].driver[driver_id].score }
    else { return Calc.cache[league_id].team[team_id].driver[driver_id].season[season_id].score }
  },

  points4team: (league_id, season_id, team_id) => {
    if(season_id === -1) { return Calc.cache[league_id].team[team_id].score }
    else { return Calc.cache[league_id].team[team_id].season[season_id].score }
  },

  points4driver_race: (league_id, season_id, race_id, team_id, driver_id) => {
    if(season_id === -1) { return Calc.cache[league_id].team[team_id].driver[driver_id].score }
    else { return Calc.cache[league_id].team[team_id].driver[driver_id].season[season_id].race[race_id].score }
  },

  points4team_race: (league_id, season_id, race_id, team_id) => {
    if(season_id === -1) { return Calc.cache[league_id].team[team_id].score }
    else { return Calc.cache[league_id].team[team_id].season[season_id].race[race_id].score }
  },

  driverReturn: (driver) => {
    var date = Calc.getRecovery(driver);
    if (!date || date < Calc.cache[driver.league_id].now) { return undefined; }
    var ret = Calc.race4click(driver.league_id, Calc.getRecovery(driver));
    return ret ? ret : { name: "Beyond Schedule" };
  }
}

var calc = {
  processLeague: (league) => Calc.processLeague(league),
  refreshDriver: (driver) => Calc.refreshDriver(driver),
  lookupDriverName: (league_id, team_id, driver_id) => Calc.lookupDriverName(league_id, team_id, driver_id),
  driverReturn: (driver) => Calc.driverReturn(driver),
  points4team: (league_id, season_id, team_id) => Calc.points4team(league_id, season_id, team_id),
  points4driver: (league_id, season_id, team_id, driver_id) => Calc.points4driver(league_id, season_id, team_id, driver_id),
  points4team_race: (league_id, season_id, race_id, team_id) => Calc.points4team_race(league_id, season_id, race_id, team_id),
  points4driver_race: (league_id, season_id, race_id, team_id, driver_id) => Calc.points4driver_race(league_id, season_id, race_id, team_id, driver_id),
  xp4driver: (driver) => Calc.cache[driver.league_id].team[driver.team_id].driver[driver.driver_id].xp,
  lev4driver:(driver) => Level.xp2lev(calc.xp4driver(driver)),
  nextRace: (league_id) => Calc.cache[league_id].nextRace,
  getSortedTeamList: (league_id, season_id) => Calc.getSortedTeamList(league_id, season_id),
  getSortedDriverList: (league_id, season_id) => Calc.getSortedDriverList(league_id, season_id)
}

export {calc};

