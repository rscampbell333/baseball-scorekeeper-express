const MemoryGameStore = require('./memoryGameStore')
const CouchGameStore = require('./couchGameStore')
const PostgresGameStore = require('./postgresGameStore')
const debug = require('debug')('baseball-scorekeeper-express:gamesStoreFactory')

function getStore (storeType) {
  switch (storeType) {
    case 'memory':
      debug('creating in-memory game store')
      return new MemoryGameStore()
    case 'couch': {
      debug('creating couch game store')
      const gamesStore = new CouchGameStore()
      gamesStore.init()
      return gamesStore
    }
    case 'postgres':
      debug('creating postgres game store')
      return new PostgresGameStore()
    default:
      debug('defaulting to in-memory game store')
      return new MemoryGameStore()
  }
}

module.exports = getStore
