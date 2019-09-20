const express = require('express');
const router = express.Router();
const uuidv4 = require('uuid/v4');
const debug = require('debug')('baseball-scorekeeper-express:games');
const gamesStore = require('../data/gameDataStoreFactory')('couch');

router.get('/', async (req, res) => res.json(await gamesStore.getAll()));
router.get('/:id', async (req, res) => {
    const id = req.params['id'];
    debug(`got request for id: ${id}`);

    try {
        const game = await gamesStore.getGame(id);
        res.json(game);
    } catch (err) {
        debug(`game [${id}] not found`);
        res.sendStatus(404);
    }
});
router.post('/', async (req, res) => {
    const game = req.body;
    game.id = uuidv4();

    console.log(game);
    await gamesStore.addGame(game);
    res.location(`${req.originalUrl}/${game.id}`);
    res.sendStatus(204);
});
router.put('/:id', async (req, res) => {
    const id = req.params['id'];
    debug(`got update request for id: ${id}`);

    const game = req.body;

    try {
        await gamesStore.updateGame(id, game);
        res.sendStatus(204);
    } catch (err) {
        console.dir(err);
        if(err.notFound) {
            debug(`game [${id}] not found`);
            res.sendStatus(404);
        }
    }
});

router.delete('/:id', async (req, res) => {
    const id = req.params['id'];
    debug(`got delete request for id: ${id}`);

    await gamesStore.deleteGame(id);
    res.sendStatus(204);
});

module.exports = router;