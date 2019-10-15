
class MemoryDataStore {
  constructor () {
    this.games = { '00000000-1111-2222-3333-444444444444': { id: '00000000-1111-2222-3333-444444444444', metadata: { teamName: 'Rangers', date: 'Jan-01-2019' }, innings: [{ position: 1, results: [{ inning: 1, result: '2B', bases: [{ name: 'first', reached: false }, { name: 'second', reached: false }, { name: 'third', reached: false }, { name: 'home', reached: false }], count: { balls: 2, strikes: 1 } }], players: [{ name: 'Andrus', since: 0 }] }, { position: 2, results: [{ inning: 1, result: 'HR', bases: [{ name: 'first', reached: false }, { name: 'second', reached: false }, { name: 'third', reached: false }, { name: 'home', reached: false }], count: { balls: 3, strikes: 2 } }], players: [{ name: 'Beltre', since: 0 }] }, { position: 3, results: [{ inning: 1, result: 'K', bases: [{ name: 'first', reached: false }, { name: 'second', reached: false }, { name: 'third', reached: false }, { name: 'home', reached: false }], count: { balls: 2, strikes: 2 } }], players: [{ name: 'Solak', since: 0 }] }, { position: 4, results: [{ inning: 1, result: '2B', bases: [{ name: 'first', reached: false }, { name: 'second', reached: false }, { name: 'third', reached: false }, { name: 'home', reached: false }], count: { balls: 0, strikes: 0 } }], players: [{ name: 'Gallo', since: 0 }] }, { position: 5, results: [{ inning: 1, result: '1B', bases: [{ name: 'first', reached: false }, { name: 'second', reached: false }, { name: 'third', reached: false }, { name: 'home', reached: false }], count: { balls: 0, strikes: 0 } }], players: [{ name: 'Pence', since: 0 }] }, { position: 6, results: [{ inning: 1, result: 'GIDP', bases: [{ name: 'first', reached: false }, { name: 'second', reached: false }, { name: 'third', reached: false }, { name: 'home', reached: false }], count: { balls: 0, strikes: 0 } }], players: [{ name: 'Kinsler', since: 0 }] }, { position: 7, results: [{ inning: 1, result: 'F8', bases: [{ name: 'first', reached: false }, { name: 'second', reached: false }, { name: 'third', reached: false }, { name: 'home', reached: false }], count: { balls: 0, strikes: 0 } }], players: [{ name: 'Odor', since: 0 }] }, { position: 8, results: [], players: [{ name: 'DeShields', since: 0 }] }, { position: 9, results: [], players: [{ name: 'Mazara', since: 0 }] }] } };
  }

  getAll () {
    return Object.values(this.games);
  }

  getGame (id) {
    return this.games[id];
  }

  addGame (game) {
    this.games[game.id] = game;
  }

  updateGame (id, game) {
    if (this.games[id]) {
      this.games[id] = game;
    } else {
      throw ({ id: id, notFound: true });
    }
  }

  deleteGame (id) {
    delete this.games[id];
  }
}

module.exports = MemoryDataStore;
