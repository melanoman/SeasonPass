import React, { Component } from 'react';
import './App.css';
import axios from 'axios';
import { calc } from './calc';

var server = axios.create({
  baseURL: 'http://localhost:2846/season_pass',
  timeout: 10000,
});

class Chooser extends Component {
  render() {
    return (
      <div className="chooser-wrap">
        <button className={this.props.selected ? "chooser-selected" : "chooser"} onClick={() => this.props.callback(this.props.thing)}>{this.props.thing.name}</button>
      </div>
    );
  }
}

class OptionLabel extends Component {
  render() {
    return (
      <div className={this.props.wrap}>
        <i className={this.props.icon} />{this.props.thing.name}
        <i className={this.props.street} onClick={this.props.callback} />
      </div>
    );
  }
}

class ActionLabel extends Component {
  render() {
    var apply = () => this.props.callback(this.props.thing);
    return (
      <div className={this.props.wrap}>
        <i className={this.props.icon} />{this.props.thing.name}
        <i className={this.props.street} onClick={apply} />
      </div>
    );
  }
}

class EmptyList extends Component {
  render() {
    if(this.props.list.length > 0) { return null; }
    else { return <p>{this.props.message}</p> }
  }
}

class App extends Component {

  fail(err) {
    console.error(err);
  }

  replaceLeague(list, item) {
    return list.map(x => (x.league_id === item.league_id) ? item : x);
  }

  replaceTeam(list, item) {
    return list.map(x => (x.team_id === item.team_id) ? item : x);
  }

  replaceDriver(list, item) {
    return list.map(x => (x.driver_id === item.driver_id) ? item : x);
  }

  replaceSeason(list, item) {
    return list.map(x => (x.season_id === item.season_id) ? item : x);
  }

  replaceRace(list, item) {
    return list.map(x => (x.race_id === item.race_id) ? item : x);
  }

  findSeason(league, id) {
    var season = null;
    league.seasons.forEach(x => {if (x.season_id === id) { season = x; }} )
    return season;
  }

  newTeam(league) {
    var name = "Team" + (league.teams.length + 1);
    var url = '/league/'+league.league_id+'/teams';
    server.post(url, {name: name}).then(res => {
      league.teams.push(res.data);
      this.setState({league: league, season: null, race: null});
    }).catch(err => { this.fail(err) })
  }

  newSeason(league) {
    var name = "Season" + (league.seasons.length + 1);
    var url = '/league/'+league.league_id+'/seasons';
    server.post(url, {name: name}).then(res => {
      league.seasons.push(res.data);
      this.setState({league: league, season: res.data, race: null});
    }).catch(err => { this.fail(err) })
  }

  newRace(season) {
    var name = "Race" + (season.races.length + 1);
    var url = '/league/' + season.league_id + '/season/' + season.season_id + '/races';
    server.post(url, {name: name}).then(res => {
      season.races.push(res.data);
      this.setState({league: this.state.league, race: res.data});
    }).catch(err => {this.fail(err) })
  }

  addResult(race, team, driver, finished, injury) {
    var url = '/league/' + race.league_id + '/season/' + race.season_id + '/race/' + race.race_id + '/results';
    var result = {
      league_id: race.league_id,
      season_id: race.season_id,
      race_id: race.race_id,
      team_id: driver.team_id,
      driver_id: driver.driver_id,
      finished: finished,
      injury: injury
    }
    server.post(url, result).then( ret => {
      if (ret.status === 200) {
        race.results = ret.data;
        this.forceUpdate();
      } else {
        console.log('status = '+ret.status);
      }
    }).catch(err => {this.fail(err) })
  }

  deleteResult(race, result, index) {
    var url = '/league/' + result.league_id + '/season/' + result.season_id + '/race/' + race.race_id + '/result/' + index;
    server.delete(url).then(ret => {
      if (ret.status === 200) {
        race.results = ret.data;
        this.forceUpdate();
      } else {
        console.log('status = '+ret.status);
      }
    }).catch(err => {this.fail(err) })
  }

  newTeamName(team, name) {
    var url = '/league/'+ team.league_id + '/team/' + team.team_id;
    server.put(url, {name: name})
      .then(ret => {
        if (ret.status === 200) {
          var league = this.state.league;
          league.teams = this.replaceTeam(this.state.league.teams, ret.data);
          this.forceUpdate()
        } else {
          console.log('status = '+ret.status);
        }
      })
      .catch(err => { this.fail(err); });
  }

  newSeasonName(season, name) {
    var url = '/league/' + season.league_id + '/season/' + season.season_id;
    server.put(url, {name: name})
      .then(ret => {
        if (ret.status === 200) {
          var league = this.state.league;
          league.seasons = this.replaceSeason(league.seasons, ret.data);
          this.setState({league: league, season: ret.data});
        } else {
          console.log('status = '+ret.status);
        }
      })
      .catch(err => { this.fail(err); });
  }

  newRaceName(race, name) {
    var url = '/league/' + race.league_id + '/season/' + race.season_id + '/race/' + race.race_id;
    server.put(url, {name: name})
      .then(ret => {
        if (ret.status === 200) {
          var league = this.state.league;
          var season = this.findSeason(league, race.season_id);
          season.races = this.replaceRace(season.races, ret.data);
          this.setState({league: league});
        } else {
          console.log('status = '+ret.status);
        }
      })
      .catch(err => { this.fail(err); });
  }

  incrRaceMult(race) {
    this.setRaceMult(race, race.mult ? race.mult + 1 : 2);
  }

  decrRaceMult(race) {
    var mult = race.mult ? race.mult - 1 : 1;
    if (mult < 1) { mult = 1; }
    this.setRaceMult(race, mult);
  }

  incrRaceByes(race) {
    this.setRaceByes(race, race.byes ? race.byes + 1 : 1);
  }

  decrRaceByes(race) {
    var byes = race.byes ? race.byes - 1 : 0;
    if (byes < 0) { byes = 0; }
    this.setRaceByes(race, byes);
  }

  setRaceMult(race, mult) {
    var url = '/league/' + race.league_id + '/season/' + race.season_id + '/race/' + race.race_id;
    server.put(url, {mult: mult})
      .then(ret => {
        if (ret.status === 200) {
          var league = this.state.league;
          var season = this.findSeason(league, race.season_id);
          season.races = this.replaceRace(season.races, ret.data);
          this.setState({league: league});
        } else {
          console.log('status = '+ret.status);
        }
      })
      .catch(err => { this.fail(err); });
  }

  setRaceByes(race, byes) {
    var url = '/league/' + race.league_id + '/season/' + race.season_id + '/race/' + race.race_id;
    server.put(url, {byes: byes})
      .then(ret => {
        if (ret.status === 200) {
          var league = this.state.league;
          var season = this.findSeason(league, race.season_id);
          season.races = this.replaceRace(season.races, ret.data);
          this.setState({league: league});
        } else {
          console.log('status = '+ret.status);
        }
      })
      .catch(err => { this.fail(err); });
  }

  newLeagueName(league, name) {
    var url = '/league/'+ league.league_id;
    server.put(url, {name: name})
      .then(ret => {
        if (ret.status === 200) {
          var leagues = this.replaceLeague(this.state.leagues, ret);
          this.setState({leagues: leagues, league: ret.data});
        } else {
          console.log('status = '+ret.status);
        }
      })
      .catch(err => { this.fail(err); });
  }

  findTeam(league, team_id) {
    var result = null;
    league.teams.forEach(x => { if(x.team_id === team_id) { result = x; } });
    return result;
  }

  renameDriver(driver, name) {
    var url = '/league/'+ driver.league_id + '/team/' + driver.team_id + '/driver/' + driver.driver_id;
    server.put(url, {name: name})
      .then(ret => {
        if (ret.status === 200) {
          var team = this.findTeam(this.state.league, driver.team_id);
          if(!team) { this.fail("INTERNAL ERROR: Team not found for driver name change"); return; }
          team.drivers = this.replaceDriver(team.drivers, ret.data);
          calc.refreshDriver(ret.data);
          this.forceUpdate()
        } else {
          console.log('status = '+ret.status);
        }
      })
      .catch(err => { this.fail(err); });
  }

  newLeague() {
    var app = this;
    var cnt = 1 + this.state.leagues.length
    var name = 'League' + cnt
    server.post('/leagues', { name: name }).then(ret => {
      var leagues = this.state.leagues.slice();
      var league = ret.data;
      leagues.push(league);
      app.setState({leagues: leagues, league: league, season: null, race: null});
    }).catch(err => { this.fail(err); })
  }

  newDriver(team) {
    var league = this.state.league;
    var app = this;
    var url = "/league/" + team.league_id + "/team/" + team.team_id + "/drivers";
    server.post(url)
      .then(ret => {
        team.drivers.push(ret.data)
        calc.refreshDriver(ret.data)
        app.setState({league: league});
      })
      .catch(err => {this.fail(err); });
  }

  constructor() {
    super();
    this.state = {
      league: null,
      season: null,
      race: null,
      leagues: [],
      locked:true,
      rosterMode:true,
      resultsMode:false,
      standingsMode:false
    };
    this.cache = {};
    server.get('/leagues').then(res => {
      res.data.forEach(x => { calc.processLeague(x); });
      this.setState({leagues: res.data});
    }).catch(err => {
      console.error(err);
    });
  }

  doLock() {
    this.setState({locked:true});
  }

  doUnlock() {
    this.setState({locked:false});
  }

  setStandingsMode() {
    if (this.state.league) { calc.processLeague(this.state.league) }
    this.setState({
      standingsMode:true,
      rosterMode:false,
      resultsMode:false
    })
  }

  setRosterMode() {
    if (this.state.league) { calc.processLeague(this.state.league) }
    this.setState({
      standingsMode:false,
      rosterMode:true,
      resultsMode:false
    })
  }

  setResultsMode() {
    if (this.state.league) { calc.processLeague(this.state.league) }
    this.setState({
      standingsMode:false,
      rosterMode:false,
      resultsMode:true
    })
  }

  render() {
    var selectLeague = (x) => { this.setState({league: x, season: null, race: null}); }

    return (
      <div className="App">
        <div className="App-header">
          <h2>Season Pass by Mel Nicholson</h2>
        </div>
        <div className="below-header">
          <div className="modebar">
            { this.state.locked ?
              <div><i className="fa fa-lock fa-2x clickable pad-2" onClick={() => this.doUnlock()} /></div> :
              <div><i className="fa fa-unlock fa-2x clickable pad-2" onClick={() => this.doLock()} /></div>
            }
            { this.state.rosterMode ?
                <div><i className="fa fa-vcard fa-2x pad-2 blue" /></div> :
                <div><i className="fa fa-vcard-o fa-2x clickable pad-2" onClick={() => this.setRosterMode()} /></div>
            }
            { this.state.resultsMode ?
                <div><i className="fa fa-calendar fa-2x pad-2 blue" /></div> :
                <div><i className="fa fa-calendar-o fa-2x clickable pad-2" onClick={() => this.setResultsMode()} /></div>
            }
            { this.state.standingsMode ?
                <div><i className="fa fa-trophy fa-2x pad-2 blue" /></div> :
                <div><i className="fa fa-trophy fa-2x clickable pad-2" onClick={() => this.setStandingsMode()} /></div>
            }
          </div>
          <div className="main-wrap">
            { !this.state.league ?
              <div id="sidebar" className="main">
                <EmptyList list={this.state.leagues} message="No leagues defined" />
                { this.state.leagues.map((x) => <Chooser key={x._id} thing={x} selected={(this.state.league === x)} callback={selectLeague} />) }
                { this.state.locked ? null : <div className="add-button"><button onClick={ () => this.newLeague() } >New League</button></div> }
              </div> : null
            }
            { (this.state.league && this.state.rosterMode) ?
              <LeagueDetail league={this.state.league} app={this} locked={this.state.locked} /> : null
            }
            { (this.state.league && this.state.resultsMode) ?
              <ResultsDetail league={this.state.league} season={this.state.season} app={this} locked={this.state.locked} /> : null
            }
            { (this.state.league && this.state.standingsMode) ?
              <StandingsDetail league={this.state.league} season={this.state.season} race={this.state.race} app={this} locked={this.state.locked} /> : null
            }
          </div>
        </div>
      </div>
    );
  }
}

class ResultsDetail extends Component {
  render() {
    var changeSeason = () => this.props.app.setState({season: null, race: null});
    var changeLeague = () => this.props.app.setState({league: null, season: null, race: null});
    var selectSeason = (x) => this.props.app.setState({season: x, race: null});
    var renameLeague = (x,y) => this.props.app.newLeagueName(x,y)
    var renameSeason = (x,y) => this.props.app.newSeasonName(x,y)

    if(this.props.season) {
      return this.props.locked ? (
        <div className="main">
          <RaceZoom app={this.props.app} race={this.props.app.state.race} />
          <OptionLabel thing={this.props.league} icon="fa fa-fort-awesome fa-2x pad-1" wrap="header-A peekaboo"
                       street="street fa fa-mail-reply pad-1 clickable" callback={changeLeague}/>
          <OptionLabel thing={this.props.season} icon="fa fa-calendar fa-lg pad-1" wrap="header-B peekaboo"
                       street="street fa fa-mail-reply pad-1 clickable" callback={changeSeason}/>
          {this.props.season.races.map(x => <RaceDetail key={x._id} race={x} app={this.props.app} />) }
        </div>
      ) : (
        <div className="main">
          <RaceZoom app={this.props.app} race={this.props.app.state.race} />
          <NameEditor thing={this.props.league} icon="fa fa-fort-awesome fa-2x pad-1" wrap="header-A peekaboo" callback={renameLeague} />
          <NameEditor thing={this.props.season} icon="fa fa-calendar fa-lg pad-1" wrap="header-B peekaboo" callback={renameSeason} />
          {this.props.season.races.map(x => <RaceEditor key={x._id} app={this.props.app} race={x} />) }
          <div className="add-button"><button onClick={ () => this.props.app.newRace(this.props.season) } >New Race</button></div>
          <div className="add-button"><button onClick={ () => this.props.app.newSeason(this.props.league) } >New Season</button></div>
        </div>
      )
    } else {
      return (
        <div className="main">
          {this.props.locked ?
            <OptionLabel thing={this.props.league} icon="fa fa-fort-awesome fa-2x pad-1" wrap="header-A peekaboo"
                         street="street fa fa-mail-reply pad-1 clickable" callback={changeLeague}/> :
            <NameEditor thing={this.props.league} icon="fa fa-fort-awesome fa-2x pad-1" wrap="header-A peekaboo" callback={renameLeague} />
          }
          {this.props.league.seasons.map(x => <Chooser key={x._id} thing={x} selected={(this.props.season === x)} callback={selectSeason} />) }
          {!this.props.locked ? <div className="add-button"><button onClick={ () => this.props.app.newSeason(this.props.league) } >New Season</button></div> : null }
        </div>
      );
    }
  }
}

class RaceDetail extends Component {
  render() {
    var selectRace = () => this.props.app.setState({race: this.props.race});
    var clazz = 'peekaboo';

    if (this.props.app.state.race === this.props.race) { clazz = 'yellow-back peekaboo' }
    var carClazz = 'fa fa-automobile fa-lg pad-1';
    if (this.props.race.results.length === 0) { carClazz = 'grey fa fa-automobile fa-lg pad-1' }
    return (
      <div className="indent-1">
        <span className={clazz}>
          <i className={carClazz} />{this.props.race.name}<i className="fa fa-search pad-1 street" onClick={selectRace} />
        </span>
      </div>
    );
  }
}

class RaceZoom extends Component {
  constructor() {
    super();
    this.state = {
      nextTeam: null,
      nextDriver: null
    }
  }

  render() {
    var g = this.props.app.state;
    if(!g.race) { return null; }
    var list = this.props.race.results;
    if(!list) { list = [] };

    var selectTeam = x => this.setState({nextTeam: x});
    var selectDriver = x => this.setState({nextDriver: x});
    var addResult = x => {
      this.props.app.addResult(this.props.race, this.state.nextTeam, this.state.nextDriver, x === -1, (x > -1) ? x : null);
      this.setState({ nextTeam: null, nextDriver:null });
    }

    return (
      <div className="zoom">
        <div className="header-B"> <i className="fa fa-2x fa-trophy pad-1" />{this.props.race.name} </div>
        { (g.locked || this.state.nextTeam) ? null : g.league.teams.map(x => <Chooser key={x._id} thing={x} selected={false} callback={() => selectTeam(x)} />) }
        { (g.locked || !this.state.nextTeam || this.state.nextDriver) ? null :
            this.state.nextTeam.drivers.map(x =>
              (calc.driverReturn(x) ? null : <Chooser key={x._id} thing={x} selected={false} callback={() => selectDriver(x)} />)
            )
        }
        { (g.locked || !this.state.nextTeam || !this.state.nextDriver) ? null :
          <div>
            <div>
              <button onClick={() => addResult(-1)}>Finished</button>
              <button onClick={() => addResult(0)}>Unfinished</button>
              <button onClick={() => addResult(1)}>Injury 1</button>
              <button onClick={() => addResult(2)}>Injury 2</button>
              <button onClick={() => addResult(3)}>Injury 3</button>
            </div><div>
              <button onClick={() => addResult(4)}>Injury 4</button>
              <button onClick={() => addResult(5)}>Injury 5</button>
              <button onClick={() => addResult(6)}>Injury 6</button>
              <button onClick={() => addResult(7)}>Injury 7</button>
              <button onClick={() => addResult(8)}>Injury 8</button>
            </div><div>
              <button onClick={() => addResult(9)}>Injury 9</button>
              <button onClick={() => addResult(10)}>Injury 10</button>
              <button onClick={() => addResult(11)}>Season Injury</button>
              <button onClick={() => addResult(999)}>Career Injury</button>
            </div>
          </div>
        }
        { list.map((x,i) => <ResultZoom index={i} key={i} race={this.props.race} result={x} app={this.props.app} locked={g.locked} /> )}
      </div>
    )
  }
}

class ResultZoom extends Component {
  render() {
    var result = this.props.result;
    var icon = !result.finished ? "fa fa-ambulance fa-lg pad-1" : "fa fa-automobile fa-lg pad-1"
    var del = () => { this.props.app.deleteResult(this.props.race, this.props.result, this.props.index) }
    return (<div className="indent-1 peekaboo">
      <i className={icon} />
      {calc.lookupDriverName(result.league_id, result.team_id, result.driver_id)}
      {(!result.finished) ? <span>({result.injury})</span> : null }
      {this.props.locked ? null : <i className="fa fa-times-circle street pad-1" onClick={del} />}
    </div>);
  }
}

class RaceEditor extends Component {
  render() {
    var renameRace = (x,y) => this.props.app.newRaceName(x,y)
    var decrMult = () => { this.props.app.decrRaceMult(this.props.race) }
    var incrMult = () => { this.props.app.incrRaceMult(this.props.race) }
    var decrByes = () => { this.props.app.decrRaceByes(this.props.race) }
    var incrByes = () => { this.props.app.incrRaceByes(this.props.race) }

    return (<div>
      <NameEditor thing={this.props.race} icon="indent-1 fa fa-automobile fa-lg pad-1" wrap="race-line peekaboo" callback={renameRace} />
      <div className="indent-2 pad-b1">
        Multiplier:
        <i className="pad-1 fa fa-caret-left" onClick={decrMult} />
        {this.props.race.mult ? this.props.race.mult : 1}
        <i className="pad-1 fa fa-caret-right" onClick={incrMult} />
        Byes:
        <i className="pad-1 fa fa-caret-left" onClick={decrByes} />
        {this.props.race.byes ? this.props.race.byes : 0}
        <i className="pad-1 fa fa-caret-right" onClick={incrByes} />
      </div>
    </div>)
  }
}

class TeamStanding extends Component {
  render() {
    var league_id = this.props.team.league_id;
    var team_id = this.props.team.team_id;
    return (
      <tr>
        <td><i className="fa fa-group fa-lg pad-1 indent-1" /> {this.props.team.name}</td>
        {this.props.races.map(x => {
          return <td key={x._id} className="ctext">{calc.points4team_race(league_id, x.season_id, x.race_id, team_id)}</td>
        }) }
        {this.props.seasons.map(x => {
          return <td key={x._id} className="ctext">{calc.points4team(league_id, x.season_id, team_id)}</td>
        }) }
        <td className="ctext">{calc.points4team(league_id, -1, team_id)}</td>
      </tr>
    );
  }
}

class StandingsDetail extends Component {
  constructor() {
    super();
    this.state = {
      selected: -1,
      selected_race: -1
    }
  }

  findRaceList(season_id, league) {
    var result = [];
    league.seasons.forEach(x => {
      if(x.season_id === season_id) { result = x.races; }
    });
    return result;
  }

  render() {
    var changeLeague = () => this.props.app.setState({league: null, season: null, race: null});
    var season_id = this.state.selected;
    var race_id = this.state.selected_race;
    if(this.props.season) { season_id = this.props.season.season_id; }
    var top = this;
    var races = this.findRaceList(season_id, this.props.league);

    return (
      <div className="main">
        <OptionLabel thing={this.props.league} icon="fa fa-fort-awesome fa-2x pad-1" wrap="header-A peekaboo"
                     street="street fa fa-mail-reply pad-1 clickable" callback={changeLeague}/>
        <table className="indent-1">
          <thead><tr>
            <th className="ltext">Team</th>
            { races.map(x => <RaceHeader key={x._id} name={x.name} race_id={x.race_id} selected={x.race_id == race_id} parent={top} />) }
            { this.props.league.seasons.map(x => <SeasonHeader key={x._id} name={x.name} selected={x.season_id === season_id} season_id={x.season_id} parent={top} />) }
            <SeasonHeader name="Total" selected={-1 === season_id} season_id={-1} parent={top} /></tr></thead>
          <tbody>
            { calc.getSortedTeamList(this.props.league.league_id, season_id, race_id).map(x => {
                var team = this.props.league.teams[x.team_id - 1];
                return <TeamStanding key={team._id} team={team} seasons={this.props.league.seasons} selected={season_id} races={races} />
            }) }
          </tbody>
        </table>
        <table className="indent-1">
          <thead><tr>
            <th className="ltext">Driver</th>
            <th className="ltext">Team</th>
            { races.map(x => <RaceHeader key={x._id} name={x.name} race_id={x.race_id} selected={x.race_id === race_id} parent={top} />) }
            { this.props.league.seasons.map(x => <SeasonHeader key={x._id} name={x.name} selected={x.season_id === season_id} season_id={x.season_id} parent={top} />) }
            <SeasonHeader name="Total" selected={-1 === season_id} season_id={-1} parent={top} /></tr></thead>
          <tbody>
            { calc.getSortedDriverList(this.props.league.league_id, season_id, race_id).map(x => {
                var driver=this.props.league.teams[x.team_id - 1].drivers[x.driver_id - 1];
                var team=this.props.league.teams[x.team_id - 1];
                return <DriverStanding key={driver._id} driver={driver} team={team} seasons={this.props.league.seasons} selected={season_id} races={races} />
            }) }
          </tbody>
        </table>
      </div>
    )
  }
}

class SeasonHeader extends Component {
  render() {
    var go = () => this.props.parent.setState({selected: this.props.season_id,selected_race:null});
    return (<th><span onClick={go} className={this.props.selected ? "yellow-back ctext" : "ctext"} >
      {this.props.name.substring(0,10)}
    </span></th>);
  }
}

class RaceHeader extends Component {
  render() {
    var go = () => this.props.parent.setState({selected_race: this.props.race_id});
    return (<th><span onClick={go} className={this.props.selected ? "yellow-back ctext" : "ctext"} >
      {this.props.name.substring(0,10)}
    </span></th>);
  }
}

class DriverStanding extends Component {
  render() {
    var league_id = this.props.team.league_id;
    var team_id = this.props.team.team_id;
    var driver_id = this.props.driver.driver_id;

    return (<tr>
      <td><i className="fa fa-user-circle pad-1 indent-1" />{this.props.driver.name}</td>
      <td><i className="fa fa-group pad-1 indent-1" />{this.props.team.name}</td>
      {this.props.races.map(x => {
        return <td key={x._id} className="ctext">{calc.points4driver_race(league_id, x.season_id, x.race_id, team_id, driver_id)}</td>
      }) }
      {this.props.seasons.map(x => {
        return <td key={x._id} className="ctext">{calc.points4driver(league_id, x.season_id, team_id, driver_id)}</td>
      }) }
      <td className="ctext">{calc.points4driver(league_id, -1, team_id, driver_id)}</td>
    </tr>)
  }
}

class LeagueDetail extends Component {
  render() {
    var changeLeague = () => this.props.app.setState({league: null, season: null, race: null});
    var renameLeague = (x,y) => this.props.app.newLeagueName(x,y);

    if (!this.props.league) {
      return (
        null
      );
    } else if (!this.props.locked) {
      var renameTeam = (x,y) => this.props.app.newTeamName(x,y)
      return (
        <div className="main league-edit-wrap">
          <NameEditor thing={this.props.league} icon="fa fa-fort-awesome fa-2x pad-1" wrap="header-A peekaboo" callback={renameLeague}/>
          {this.props.league.teams.map( (x) => <NameEditor key={x._id} thing={x} wrap="header-B peekaboo" icon="pad-1 fa fa-group clickable" callback={renameTeam} /> ) }
          <button className="new=team-button" onClick={() => this.props.app.newTeam(this.props.league)}>New Team</button>
        </div>
      );
    } else {
      var nextRace = calc.nextRace(this.props.league.league_id);
      return (
        <div className="main league-display-wrap">
          { nextRace ?
            <div className="zoom">
              <div className="header-A"><i className="fa fa-bank fa-2x pad-1" />Next Race</div>
              <div className="indent-1 header-B"><i className="fa fa-automobile fa-lg pad-1" />{nextRace.name}</div>
            </div>
            :null
          }
          <OptionLabel thing={this.props.league} icon="fa fa-fort-awesome fa-2x pad-1" wrap="header-A peekaboo"
                       street="street fa fa-mail-reply pad-1 clickable" callback={changeLeague}/>
          {this.props.league.teams.map( (x) => <TeamDisplay app={this.props.app} key={x._id} team={x} /> ) }
        </div>
      );
    }
  }
}

class TeamDisplay extends Component {
  render() {
    var callback = (x) => this.props.app.newDriver(x);
    return (
      <div className="team-display-wrap">
        <ActionLabel thing={this.props.team} icon="pad-1 fa fa-group fa-lg" wrap="header-B peekaboo"
                     street="street fa fa-user-plus pad-1 clickable" callback={callback} />
        <DriverList app={this.props.app} team={this.props.team} />
      </div>
    );
  }
}

class DriverList extends Component {
  render() {
    return (
      <table className="driver-list indent-1">
        <tbody>{this.props.team.drivers.map(x => <DriverRow app={this.props.app} driver={x} key={x._id} />)}</tbody>
      </table>
    );
  }
}

class DriverRow extends Component {
  render() {
    var go = (x,y) => this.props.app.renameDriver(x,y);
    var driver = this.props.driver;
    var recovery = calc.driverReturn(driver);
    var icon = (recovery) ? "pad-1 fa fa-medkit fa-lg" : "pad-1 fa fa-user-circle-o fa-lg";
    return (<tr>
      <td><NameEditor thing={driver} icon={icon} wrap="driver-display peekaboo" callback={go} /></td>
      {recovery ? <td className="indent-2"><i className="fa fa-automobile fa-lg pad-1" />{recovery.name}</td> : <td>{calc.lev4driver(driver)}({calc.xp4driver(driver)})</td> }
    </tr>);
  }
}

class NameEditor extends Component {
  constructor() {
    super()
    this.state = {
      editing: false,
      name: ''
    }
  }

  handleSubmit(event, editor) {
    event.preventDefault();
    editor.props.callback(editor.props.thing, editor.state.name)
    editor.setState({editing: false});
  }

  handleChange(event, editor) {
    editor.setState({name: event.target.value});
  }

  render() {
    if (this.state.editing) {
      var editor = this;
      return (
        <div className="driver-display">
          <form onSubmit={(event) => editor.handleSubmit(event, editor)}>
            <span><i className="pad-1 fa fa-vcard fa-lg" /></span>
            <input type="text" placeholder={editor.props.thing.name} value={editor.state.name} onChange={(event)=>{editor.handleChange(event,editor)}} />
          </form>
        </div>
      );
    } else {
      var editName = () => this.setState({editing: true, name:''})
      return (
        <OptionLabel thing={this.props.thing} wrap={this.props.wrap} icon={this.props.icon}
                     street="street fa fa-pencil pad-1 clickable" callback={editName} />
      );
    }
  }
}

export default App;
