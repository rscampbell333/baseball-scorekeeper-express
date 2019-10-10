const { Pool } = require('pg');
const debug = require('debug')('baseball-scorekeeper-express:postgresDataStore');

const pool = new Pool();

class PostgresDataStore {
    constructor() {
    }

    async init() {
        
    }

    async getAll(includeScores) {
        const client = await pool.connect();

        try {
            const selectGames = "SELECT id, date, home_team FROM games";
            const gameRows = await client.query(selectGames);
            const games = gameRows.rows.map(({ id, date, home_team }) => ({ id, metadata: { date, teamName: home_team}}));

            return games;
        } finally {
            client.release();
        }
    }

    async getGame(id) {
        const client = await pool.connect();

        try {
            const selectGame = "SELECT date, home_team FROM games WHERE id = $1";
            const values = [ id ];

            const gameRows = await client.query(selectGame, values);
            
            if(gameRows.rows.length > 0) {
                const row = gameRows.rows[0];
                const game = { id, metadata: { teamName: row.home_team, date: row.date }};

                const selectAtBats = "SELECT inning, balls, strikes, position, result FROM at_bats WHERE game_id = $1";
                const atBats = await client.query(selectAtBats, values);

                const positions = Array.from({length: 9}, (x, i) => ({ position: i + 1, results: [], players: []}));
                for(let atBatRow of atBats.rows) {
                    const { inning, result, balls, strikes, position } = atBatRow;
                    const atBat = { inning, result, count: { balls, strikes }};

                    positions[position - 1].results.push(atBat);
                }

                const selectPositions = "SELECT player, position, since FROM batting_positions WHERE game_id = $1";
                const positionRows = await client.query(selectPositions, values);

                for(let positionRow of positionRows.rows) {
                    const { player, since, position } = positionRow;
                    positions[position - 1].players.push({ player, since });
                }

                game.innings = positions;
                return game;
            }
        } finally {
            client.release();
        }
    }

    async addGame(game) {
        const client = await pool.connect();
        
        try {
            const insert = "INSERT INTO games VALUES ($1, $2, $3, $4)";
            const values = [ game.id, game.metadata.date, game.metadata.teamName, null ];
            await client.query('BEGIN');
            await client.query(insert, values);

            const insertAtBat = "INSERT INTO at_bats VALUES ($1, $2, $3, $4, $5, $6)";
            const insertPlayer = "INSERT INTO batting_positions VALUES ($1, $2, $3, $4)";
            for(let position of game.innings) {
                if(position.results) {
                    for(let atBat of position.results) {
                        const atBatValues = [ game.id, atBat.inning, atBat.count.balls, atBat.count.strikes, position.position, atBat.result ];
                        await client.query(insertAtBat, atBatValues);
                    }
                }

                if(position.players) {
                    for(let player of position.players) {
                        const { name, since } = player;
                        const playerValues = [ game.id, position.position, name, since];
                        await client.query(insertPlayer, playerValues);
                    }
                }
            }

            await client.query('COMMIT');
        } catch (err) {
            await client.query('ROLLBACK');
            console.log(err);
        } finally {
            client.release();
        }
    }

    async updateGame(id, game) {
        const client = await pool.connect();

        try {
            const updateGame = "UPDATE games SET date = $1, home_team = $2 WHERE id = $3";
            const values = [ new Date(game.metadata.date), game.metadata.teamName, id ];
            console.log(values);
            await client.query('BEGIN');
            await client.query(updateGame, values);

            const deleteOldAtBats = "DELETE FROM at_bats WHERE game_id = $1";
            client.query(deleteOldAtBats, [ id ]);
            const deleteOldPositions = "DELETE FROM batting_positions WHERE game_id = $1";
            client.query(deleteOldPositions, [ id ]);

            const insertAtBat = "INSERT INTO at_bats VALUES ($1, $2, $3, $4, $5, $6)";
            const insertPlayer = "INSERT INTO batting_positions VALUES ($1, $2, $3, $4)";
            for(let position of game.innings) {
                if(position.results) {
                    for(let atBat of position.results) {
                        const atBatValues = [ game.id, atBat.inning, atBat.count.balls, atBat.count.strikes, position.position, atBat.result ];
                        await client.query(insertAtBat, atBatValues);
                    }
                }

                if(position.players) {
                    for(let player of position.players) {
                        const { name, since } = player;
                        const playerValues = [ game.id, position.position, name, since];
                        await client.query(insertPlayer, playerValues);
                    }
                }
            }

            await client.query('COMMIT');
        } catch (err) {
            await client.query('ROLLBACK');
            console.log(err);
        } finally {
            client.release();
        }
    }

    async deleteGame(id) {
        const client = await pool.connect();

        try {
            const deleteGame = "DELETE FROM games WHERE id = $1";
            await client.query(deleteGame, [ id ]);
        } finally {
            client.release();
        }
    }   
}

(async () => {
    const game = {"_id":"7cf38328-9af7-459f-8228-08f876f687a3","_rev":"18-02fb4df9d0a3976f649137c49461e576","metadata":{"teamName":"Rangers","date":"2019-06-19T05:00:00.000Z"},"innings":[{"position":1,"results":[{"inning":1,"result":"2B","bases":[{"name":"first","reached":true},{"name":"second","reached":true},{"name":"third","reached":true},{"name":"home","reached":true}],"count":{"balls":2,"strikes":1}}],"players":[{"name":"Andrus","since":0}]},{"position":2,"results":[{"inning":1,"result":"K","bases":[{"name":"first","reached":false},{"name":"second","reached":false},{"name":"third","reached":false},{"name":"home","reached":false}],"count":{"balls":2,"strikes":2}}],"players":[{"name":"Beltre","since":0}]},{"position":3,"results":[{"inning":1,"result":"HR","bases":[{"name":"first","reached":true},{"name":"second","reached":true},{"name":"third","reached":true},{"name":"home","reached":true}],"count":{"balls":0,"strikes":0}}],"players":[{"name":"Mazara","since":0}]},{"position":4,"results":[{"inning":1,"result":"1B","bases":[{"name":"first","reached":true},{"name":"second","reached":false},{"name":"third","reached":false},{"name":"home","reached":false}],"count":{"balls":0,"strikes":0}}],"players":[{"name":"Gallo","since":0}]},{"position":5,"results":[],"players":[{"name":"Kiner-Falefa","since":0}]},{},{},{},{}],"id":"7cf38328-9af7-459f-8228-08f876f687a3"}
    const gameStore = new PostgresDataStore();
    console.log(JSON.stringify(await gameStore.getGame('7cf38328-9af7-459f-8228-08f876f687a3'), null, 2));
})();

module.exports = PostgresDataStore;