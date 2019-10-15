const { Pool } = require('pg');
const debug = require('debug')('baseball-scorekeeper-express:postgresDataStore');

const pool = new Pool();

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
      const selectGame = 'SELECT date, home_team FROM games WHERE id = $1';
      const values = [id];

      const gameRows = await client.query(selectGame, values);

      if (gameRows.rows.length > 0) {
        const row = gameRows.rows[0];
        const game = { id, metadata: { teamName: row.home_team, date: row.date } };

        const selectAtBats = 'SELECT inning, balls, strikes, position, result, farthest_base FROM at_bats WHERE game_id = $1';
        const atBats = await client.query(selectAtBats, values);

        const positions = Array.from({ length: 9 }, (x, i) => ({ position: i + 1, results: [], players: [] }));
        for (const atBatRow of atBats.rows) {
          const { inning, result, balls, strikes, position, farthest_base: farthestBase } = atBatRow;
          const atBat = { inning, result, farthestBase, count: { balls, strikes } };

          positions[position - 1].results[inning - 1] = atBat;
        }

        const selectPositions = 'SELECT player, position, since FROM batting_positions WHERE game_id = $1';
        const positionRows = await client.query(selectPositions, values);

        for (const positionRow of positionRows.rows) {
          const { player: name, since, position } = positionRow;
          positions[position - 1].players.push({ name, since });
        }

        game.innings = positions;
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
      const values = [game.id, game.metadata.date, game.metadata.teamName, null];
      await client.query('BEGIN');
      await client.query(insert, values);

      const insertAtBat = 'INSERT INTO at_bats VALUES ($1, $2, $3, $4, $5, $6, $7)';
      const insertPlayer = 'INSERT INTO batting_positions VALUES ($1, $2, $3, $4)';
      for (const position of game.innings) {
        if (position.results) {
          for (const atBat of position.results) {
            const atBatValues = [game.id, atBat.inning, atBat.count.balls, atBat.count.strikes, position.position, atBat.result, atBat.farthestBase];
            await client.query(insertAtBat, atBatValues);
          }
        }

        if (position.players) {
          for (const player of position.players) {
            const { name, since } = player;
            const playerValues = [game.id, position.position, name, since];
            await client.query(insertPlayer, playerValues);
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
      const updateGame = 'UPDATE games SET date = $1, home_team = $2 WHERE id = $3';
      const values = [new Date(game.metadata.date), game.metadata.teamName, id];
      console.log(values);
      await client.query('BEGIN');
      await client.query(updateGame, values);

      const deleteOldAtBats = 'DELETE FROM at_bats WHERE game_id = $1';
      client.query(deleteOldAtBats, [id]);
      const deleteOldPositions = 'DELETE FROM batting_positions WHERE game_id = $1';
      client.query(deleteOldPositions, [id]);

      const insertAtBat = 'INSERT INTO at_bats VALUES ($1, $2, $3, $4, $5, $6, $7)';
      const insertPlayer = 'INSERT INTO batting_positions VALUES ($1, $2, $3, $4)';
      for (const position of game.innings) {
        if (position.results) {
          for (const atBat of position.results) {
            if (atBat) {
              const atBatValues = [id, atBat.inning, atBat.count.balls, atBat.count.strikes, position.position, atBat.result, atBat.farthestBase];
              await client.query(insertAtBat, atBatValues);
            }
          }
        }

        if (position.players) {
          for (const player of position.players) {
            const { name, since } = player;
            const playerValues = [id, position.position, name, since];
            await client.query(insertPlayer, playerValues);
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
