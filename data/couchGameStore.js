const nano = require('nano')('http://pi.hole:5984');
const debug = require('debug')('baseball-scorekeeper-express:couchDataStore');

class CouchDataStore {
    constructor() {
    }

    async init() {
        this.scorecards = await nano.db.use('scorecards');
    }

    async getAll() {
        const docs = await this.scorecards.list({include_docs: true});
        const games = docs.rows.map(rows => rows.doc);
        games.forEach(game => {
            delete game._id;
            delete game._rev;
        })

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
            }
        }
    }

    async addGame(game) {
        game._id = game.id;
        await this.scorecards.insert(game);
    }

    async updateGame(id, game) {
        try {
            const doc = await this.scorecards.get(id);
            game._id = id;
            game._rev = doc._rev;
            debug(`got rev ${game._rev}`);
            await this.scorecards.insert(game)
        } catch (err) {
            if(err.error === 'not_found') {
                debug(`doc id[${id}] does not exist`);
                throw ({id: id, notFound: true});
            } else {
                console.log(err);
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
            }
        }
    }
}

module.exports = CouchDataStore;