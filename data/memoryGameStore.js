
class MemoryDataStore {
  constructor () {
    this.games = {
      '00000000-1111-2222-3333-444444444444': {
        id: '00000000-1111-2222-3333-444444444444',
        metadata: {
          homeTeam: 'Rangers',
          awayTeam: 'Astros',
          date: '2019-07-14T05:00:00.000Z'
        },
        innings: {
          home: [
            {
              position: 1,
              results: [
                {
                  inning: 1,
                  result: '2B',
                  farthestBase: 2,
                  count: {
                    balls: 2,
                    strikes: 1
                  }
                }
              ],
              players: [
                {
                  name: 'Andrus',
                  since: 0
                }
              ]
            },
            {
              position: 2,
              results: [],
              players: []
            },
            {
              position: 3,
              results: [],
              players: []
            },
            {
              position: 4,
              results: [],
              players: []
            },
            {
              position: 5,
              results: [],
              players: []
            },
            {
              position: 6,
              results: [],
              players: []
            },
            {
              position: 7,
              results: [],
              players: []
            },
            {
              position: 8,
              results: [],
              players: []
            },
            {
              position: 9,
              results: [],
              players: []
            }
          ],
          away: [
            {
              position: 1,
              results: [],
              players: []
            },
            {
              position: 2,
              results: [],
              players: []
            },
            {
              position: 3,
              results: [],
              players: []
            },
            {
              position: 4,
              results: [],
              players: []
            },
            {
              position: 5,
              results: [],
              players: []
            },
            {
              position: 6,
              results: [],
              players: []
            },
            {
              position: 7,
              results: [],
              players: []
            },
            {
              position: 8,
              results: [],
              players: []
            },
            {
              position: 9,
              results: [],
              players: []
            }
          ]
        }
      }
    };
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
      game.id = id;
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
