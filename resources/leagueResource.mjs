import {
  mapSettings,
  mapStandings,
  mapScoreboard,
  mapTeams,
  mapDraft,
  mapTransactions,
} from "../helpers/leagueHelper.mjs";

import { mapPlayers } from "../helpers/gameHelper.mjs";

import { extractCallback } from "../helpers/argsParser.mjs";

class LeagueResource {
  constructor(yf) {
    this.yf = yf;
  }

  meta(leagueKey, cb = () => {}) {
    return this.yf
      .api(
        this.yf.GET,
        `https://fantasysports.yahooapis.com/fantasy/v2/league/${leagueKey}/metadata`
      )
      .then((data) => {
        const meta = data.fantasy_content.league[0];

        cb(null, meta);
        return meta;
      })
      .catch((e) => {
        cb(e);
        throw e;
      });
  }

  settings(leagueKey, cb = () => {}) {
    return this.yf
      .api(
        this.yf.GET,
        `https://fantasysports.yahooapis.com/fantasy/v2/league/${leagueKey}/settings`
      )
      .then((data) => {
        const settings = mapSettings(
          data.fantasy_content.league[1].settings[0]
        );
        const league = data.fantasy_content.league[0];

        league.settings = settings;
        cb(null, league);
        return league;
      })
      .catch((e) => {
        cb(e);
        throw e;
      });
  }

  standings(leagueKey, cb = () => {}) {
    return this.yf
      .api(
        this.yf.GET,
        `https://fantasysports.yahooapis.com/fantasy/v2/league/${leagueKey}/standings`
      )
      .then((data) => {
        const standings = mapStandings(
          data.fantasy_content.league[1].standings[0].teams
        );
        const league = data.fantasy_content.league[0];

        league.standings = standings;
        cb(null, league);
        return league;
      })
      .catch((e) => {
        cb(e);
        throw e;
      });
  }

  // h2h only
  scoreboard(leagueKey, ...args) {
    let url = `https://fantasysports.yahooapis.com/fantasy/v2/league/${leagueKey}/scoreboard`;
    const cb = extractCallback(args);

    if (args.length) {
      url += `;week=${args.pop()}`;
    }

    url += "";

    return this.yf
      .api(this.yf.GET, url)
      .then((data) => {
        const week = data.fantasy_content.league[1].scoreboard.week;
        const scoreboard = mapScoreboard(
          data.fantasy_content.league[1].scoreboard[0].matchups
        );
        const league = data.fantasy_content.league[0];

        league.scoreboard = scoreboard;
        league.scoreboard.week = week;
        cb(null, league);
        return league;
      })
      .catch((e) => {
        cb(e);
        throw e;
      });
  }

  teams(leagueKey, cb = () => {}) {
    return this.yf
      .api(
        this.yf.GET,
        `https://fantasysports.yahooapis.com/fantasy/v2/league/${leagueKey}/teams`
      )
      .then((data) => {
        const teams = mapTeams(data.fantasy_content.league[1].teams);
        const league = data.fantasy_content.league[0];

        league.teams = teams;
        cb(null, league);
        return league;
      })
      .catch((e) => {
        cb(e);
        throw e;
      });
  }

  draft_results(leagueKey, cb = () => {}) {
    return this.yf
      .api(
        this.yf.GET,
        `https://fantasysports.yahooapis.com/fantasy/v2/league/${leagueKey}/draftresults`
      )
      .then((data) => {
        const draft = mapDraft(data.fantasy_content.league[1].draft_results);
        const league = data.fantasy_content.league[0];

        league.draft_results = draft;
        cb(null, league);
        return league;
      })
      .catch((e) => {
        cb(e);
        throw e;
      });
  }

  transactions(leagueKey, cb = () => {}) {
    return this.yf
      .api(
        this.yf.GET,
        `https://fantasysports.yahooapis.com/fantasy/v2/league/${leagueKey}/transactions`
      )
      .then((data) => {
        const transactions = mapTransactions(
          data.fantasy_content.league[1].transactions
        );
        const league = data.fantasy_content.league[0];

        league.transactions = transactions;
        cb(null, league);
        return league;
      })
      .catch((e) => {
        cb(e);
        throw e;
      });
  }

  players(leagueKey, ...args) {
    const cb = extractCallback(args);
    const limit = 25;
    let allPlayers = [];

    // Extract status if present (should be the first argument before callback)
    const statusFilter = typeof args[0] === 'string' ? args[0] : null;

    // Function to fetch players with pagination
    const fetchPlayersPage = (start = 0) => {
      let url = `https://fantasysports.yahooapis.com/fantasy/v2/league/${leagueKey}/players;start=${start};count=${limit};out=ownership`;

      // Add status filter if provided
      if (statusFilter) {
        url += `;status=${statusFilter}`;
      }

      return this.yf.api(this.yf.GET, url)
        .then((data) => {
          // Handle case where no players are returned
          if (!data.fantasy_content.league[1].players) {
            const league = data.fantasy_content.league[0];
            league.players = allPlayers;
            cb(null, league);
            return league;
          }

          const players = mapPlayers(data.fantasy_content.league[1].players);
          allPlayers = allPlayers.concat(players);

          // If we received fewer players than the limit, we're done
          if (players.length < limit) {
            const league = data.fantasy_content.league[0];
            league.players = allPlayers;

            cb(null, league);
            return league;
          } else {
            // Fetch the next page
            return fetchPlayersPage(start + limit);
          }
        });
    };

    return fetchPlayersPage(0)
      .catch((e) => {
        cb(e);
        throw e;
      });
  }

}

export default LeagueResource;
