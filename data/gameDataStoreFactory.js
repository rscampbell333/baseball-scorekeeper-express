const MemoryGameStore = require('./memoryGameStore');
const CouchGameStore = require('./couchGameStore');
const debug = require('debug')('baseball-scorekeeper-express:gamesStoreFactory');

function getStore(storeType) {
    switch(storeType) {
        case 'memory':
            debug('creating in-memory game store');
            return new MemoryGameStore();
        case 'couch':
            debug('creating couch game store');
            const gamesStore = new CouchGameStore();
            gamesStore.init();
            return gamesStore;
        default:
            debug('defaulting to in-memory game store');
            return new MemoryGameStore();
    }
}

module.exports = getStore;