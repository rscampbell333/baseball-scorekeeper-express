const nano = require('nano')('http://pi.hole:5984');
const debug = require('debug')('baseball-scorekeeper-express:couchDataStore');

class CouchDataStore {
    constructor() {
    }

    async init() {
        this.scorecards = await nano.db.use('scorecards');
    }

    async getAll(includeScores) {
        try {
            const docs = await this.scorecards.list({include_docs: true});
            const games = docs.rows.map(rows => rows.doc);
            games.forEach(game => {
                delete game._id;
                delete game._rev;

                if(!includeScores) {
                    delete game.innings;
                }
            });
        } catch (err) {
            console.log(err);
            throw { connectionError: true };
        }

        return games;
    }

    async getGame(id) {
        try {
            const game = await this.scorecards.get(id);
            console.log(game);
            return game;
        } catch (err) {
            if(err.error === 'not_found') {
                debug(`doc id[${id}] does not exist`);
                throw ({id: id, notFound: true})
            } else {
                console.log(err);
                throw { connectionError: true };
            }
        }
    }

    async addGame(game) {
        game._id = game.id;
        try {
            await this.scorecards.insert(game);
        } catch (err) {
            console.log(err);
            throw { connectionError: true };
        }
    }

    async updateGame(id, game) {
        try {
            const doc = await this.scorecards.get(id);
            game._id = id;
            game._rev = doc._rev;
            game.id = game;
            debug(`got rev ${game._rev}`);
            await this.scorecards.insert(game)
        } catch (err) {
            if(err.error === 'not_found') {
                debug(`doc id[${id}] does not exist`);
                throw ({id: id, notFound: true});
            } else {
                console.log(err);
                throw { connectionError: true };
            }
        }
    }

    async deleteGame(id) {
        try {
            const doc = await this.scorecards.get(id);
            debug(`got rev ${doc._rev}`);
            await this.scorecards.destroy(id, doc._rev);
        } catch (err) {
            if(err.error === 'not_found') {
                debug(`doc id[${id}] does not exist`);
            } else {
                console.log(err);
                throw { connectionError: true };
            }
        }
    }
}

module.exports = CouchDataStore;