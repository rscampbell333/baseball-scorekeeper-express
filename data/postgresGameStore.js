const { Pool } = require('pg');
const debug = require('debug')('baseball-scorekeeper-express:postgresDataStore');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'true'
});

class PostgresDataStore {
  async init () {

  }

  async getAll (includeScores) {
    const client = await pool.connect();

    try {
      const selectGames = 'SELECT id, date, home_team FROM games';
      const gameRows = await client.query(selectGames);
      const games = gameRows.rows.map(({ id, date, home_team: homeTeam }) => ({ id, metadata: { date, teamName: homeTeam } }));

      return games;
    } catch (err) {
      console.error('Error getting games', err.stack);
      throw Error('DB error');
    } finally {
      client.release();
    }
  }

  async getGame (id) {
    const client = await pool.connect();

    try {
      const selectGame = 'SELECT date, home_team, away_team FROM games WHERE id = $1';
      const values = [id];

      const gameRows = await client.query(selectGame, values);

      if (gameRows.rows.length > 0) {
        const row = gameRows.rows[0];
        const game = { id, metadata: { homeTeam: row.home_team, awayTeam: row.away_team, date: row.date } };

        const selectAtBats = 'SELECT inning, balls, strikes, position, result, farthest_base, home FROM at_bats WHERE game_id = $1';
        const atBats = await client.query(selectAtBats, values);

        const homePositions = Array.from({ length: 9 }, (x, i) => ({ position: i + 1, results: [], players: [] }));
        const awayPositions = Array.from({ length: 9 }, (x, i) => ({ position: i + 1, results: [], players: [] }));
        for (const atBatRow of atBats.rows) {
          const { inning, result, balls, strikes, position, farthest_base: farthestBase, home } = atBatRow;
          const atBat = { inning, result, farthestBase, count: { balls, strikes } };

          const positions = home ? homePositions : awayPositions;

          positions[position - 1].results[inning - 1] = atBat;
        }

        const selectPositions = 'SELECT player, position, since, home FROM batting_positions WHERE game_id = $1';
        const positionRows = await client.query(selectPositions, values);

        for (const positionRow of positionRows.rows) {
          const { player: name, since, position, home } = positionRow;
          const positions = home ? homePositions : awayPositions;
          positions[position - 1].players.push({ name, since });
        }

        game.innings = { home: homePositions, away: awayPositions };
        return game;
      }
    } catch (err) {
      console.error('Error getting game', err.stack);
      throw Error('DB error');
    } finally {
      client.release();
    }
  }

  async addGame (game) {
    const client = await pool.connect();

    try {
      const insert = 'INSERT INTO games VALUES ($1, $2, $3, $4)';
      const values = [game.id, game.metadata.date, game.metadata.homeTeam, game.metadata.awayTeam];
      debug(`Creating game meta data with query ${insert} and values ${values}`);
      await client.query('BEGIN');
      await client.query(insert, values);

      const insertAtBat = 'INSERT INTO at_bats(game_id, inning, balls, strikes, position, result, farthest_base, home) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)';
      const insertPlayer = 'INSERT INTO batting_positions(game_id, position, player, since, home) VALUES ($1, $2, $3, $4, $5)';
      
      for (const team of ['home', 'away']) {
        const innings = game.innings[team];
        const isHome = team === 'home';
        for (const position of innings) {
          if (position.results) {
            for (const atBat of position.results) {
              if (atBat && atBat.inning && atBat.count && atBat.result) {
                const farthestBase = atBat.farthestBase || 0;
                const atBatValues = [game.id, atBat.inning, atBat.count.balls, atBat.count.strikes, position.position, atBat.result, farthestBase, isHome];
                await client.query(insertAtBat, atBatValues);
              }
            }
          }

          if (position.players) {
            for (const player of position.players) {
              const { name, since } = player;
              const playerValues = [game.id, position.position, name, since, isHome];
              await client.query(insertPlayer, playerValues);
            }
          }
        }
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Error creating game', err.stack);
      throw new Error('DB error');
    } finally {
      client.release();
    }
  }

  async updateGame (id, game) {
    const client = await pool.connect();

    try {
      const updateGame = 'UPDATE games SET date = $1, home_team = $2, away_team = $3 WHERE id = $4';
      const values = [new Date(game.metadata.date), game.metadata.homeTeam, game.metadata.awayTeam, id];
      debug(`Updating game metadata with query ${updateGame} and values ${values}`);
      await client.query('BEGIN');
      await client.query(updateGame, values);

      const deleteOldAtBats = 'DELETE FROM at_bats WHERE game_id = $1';
      client.query(deleteOldAtBats, [id]);
      const deleteOldPositions = 'DELETE FROM batting_positions WHERE game_id = $1';
      client.query(deleteOldPositions, [id]);

      const insertAtBat = 'INSERT INTO at_bats(game_id, inning, balls, strikes, position, result, farthest_base, home) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)';
      const insertPlayer = 'INSERT INTO batting_positions(game_id, position, player, since, home) VALUES ($1, $2, $3, $4, $5)';
      for (const team of ['home', 'away']) {
        const innings = game.innings[team];
        const isHome = team === 'home';

        for (const position of innings) {
          if (position.results) {
            for (const atBat of position.results) {
              if (atBat && atBat.inning && atBat.count && atBat.result) {
                const { farthestBase = 0 } = atBat;
                const atBatValues = [id, atBat.inning, atBat.count.balls, atBat.count.strikes, position.position, atBat.result, farthestBase, isHome];
                await client.query(insertAtBat, atBatValues);
              }
            }
          }

          if (position.players) {
            for (const player of position.players) {
              const { name, since } = player;
              const playerValues = [id, position.position, name, since, isHome];
              await client.query(insertPlayer, playerValues);
            }
          }
        }
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Error creating game', err.stack);
      throw new Error('DB error');
    } finally {
      client.release();
    }
  }

  async deleteGame (id) {
    const client = await pool.connect();

    try {
      const deleteGame = 'DELETE FROM games WHERE id = $1';
      await client.query(deleteGame, [id]);
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Error creating game', err.stack);
      throw new Error('DB error');
    } finally {
      client.release();
    }
  }
}

module.exports = PostgresDataStore;
