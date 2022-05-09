const router = require('express').Router();
const fs = require('fs');
const {keepAliveToken, getSaves, getSavesDB, insertSavesDB, deleteSavesDB, postSaves} = require('../controllers.js');

router.get('/number', async (req, res) => {
    let saves = await keepAliveToken(getSaves, req);

    if (saves == null) {
        // console.log(saves.length);
        res.send(JSON.stringify({
            success: false,
        }));
    }else {
        res.send(JSON.stringify({
            number: saves.length,
        }));
    }
});

router.get('/', async (req, res) => {
    let saves = await keepAliveToken(getSaves, req);

    if (saves == null) {
        res.send(JSON.stringify({
            success: false,
        }));
    }else {
        // fs.writeFileSync("saves.json", JSON.stringify({saves: saves}));
        res.send(JSON.stringify({
            saves: saves,
        }));
        // fs.writeFile("saves.json", JSON.stringify({saves: saves}), function (err) {
        //     if (err) {
        //         console.log(err);
        //     }
        // });
    }
});

router.post('/sync', async (req, res) => {
    console.log(req.signedCookies)
    let saves = await keepAliveToken(getSaves, req);
    if (saves == null) {
        res.send(JSON.stringify({
            success: false,
        }));
    }else {
        saves = saves.sort((left, right) => left.name < right.name ? -1 : 1);
        let syncedSaves = await getSavesDB(req);
        syncedSaves = syncedSaves.sort((left, right) => left.name < right.name ? -1 : 1);
        let toAddSaves = [], toDeleteSaves = [];
        for (var i=0, j=0 ; i < saves.length && j < syncedSaves.length ; ) {
            if (saves[i].name < syncedSaves[j].name) {
                toAddSaves.push(save);
                i++;
            }else if (saves[i].name > syncedSaves[j].name) {
                toDeleteSaves.push(syncedSaves[j]);
                j++;
            }else {
                i++; j++;
            }
        }
        var [i, remain, saveMethodArr] = i < saves.length ? [i, saves, toAddSaves] : [j, syncedSaves, toDeleteSaves];
        for ( ; i < remain.length ; i++) {
            saveMethodArr.push(remain[i]);
        }
        await insertSavesDB(req, toAddSaves);
        await deleteSavesDB(req, toDeleteSaves);
        res.send(JSON.stringify({
            success: true,
        }));
    }
});

router.post('/duplicate', async(req, res) => {
    const from = req.body?.from;
    const saves = await getSavesDB(req, from);
    const fullnames = saves?.slice(0, 5)?.map(save => `${save?.name}`);

    console.log(saves[0].name, from)
    if (from === undefined || saves == null) {
        res.send(JSON.stringify({
            success: false,
        }));
    }else {
        req.fullnames = fullnames;
        req.from = from;
        let a = await keepAliveToken(postSaves, req);
        console.log(a);
        res.send(JSON.stringify({
            success: true,
        }));
    }
});

module.exports = router;