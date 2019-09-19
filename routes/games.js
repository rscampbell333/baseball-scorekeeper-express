var express = require('express');
var router = express.Router();
var uuidv4 = require('uuid/v4');
var debug = require('debug')('baseball-scorekeeper-express:games');
var MemoryDataStore = require('../data/memoryGameStore');

const gamesStore = new MemoryDataStore();

router.get('/', (req, res) => res.json(gamesStore.getAll()));
router.get('/:id', (req, res) => {
    const id = req.params['id'];
    debug(`got request for id: ${id}`);

    const game = gamesStore.getGame(id);

    if(game) {
        res.json(game);
    } else {
        debug(`game [${id}] not found`);
        res.sendStatus(404);
    }
});
router.post('/', (req, res) => {
    const game = req.body;
    game.id = uuidv4();

    console.log(game);
    gamesStore.addGame(game);
    res.location(`${req.originalUrl}/${game.id}`);
    res.sendStatus(204);
});
router.put('/:id', (req, res) => {
    const id = req.params['id'];
    debug(`got update request for id: ${id}`);

    const game = req.body;

    try {
        gamesStore.updateGame(id, game);
        res.sendStatus(204);
    } catch (err) {
        console.dir(err);
        if(err.notFound) {
            debug(`game [${id}] not found`);
            res.sendStatus(404);
        }
    }
});

router.delete('/:id', (req, res) => {
    const id = req.params['id'];
    debug(`got delete request for id: ${id}`);

    gamesStore.deleteGame(id);
    res.sendStatus(204);
});

module.exports = router;