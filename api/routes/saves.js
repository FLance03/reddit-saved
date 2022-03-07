const router = require('express').Router();
const fs = require('fs');
const {keepAliveToken, getSaves} = require('../controllers.js');

router.get('/number', async (req, res) => {
    res.header("Access-Control-Allow-Origin", "http://127.0.0.1:8080");
    // console.log(res.header());

    // const session = req.session;
    // let username = req.signedCookies.username;

    // if (!username) {
    //     res.send(JSON.stringify({
    //         success: false,
    //     }));
    // }else {
    //     let saves = await keepAliveToken(getSaves, req);

    //     if (saves) {
    //         console.log(saves.length);
            res.send(JSON.stringify({
                number: 236,
                // number: saves.length,
            }));
    //     }else {
    //         res.send(JSON.stringify({
    //             success: false,
    //         }));
    //     }
    // }
});

router.get('/', async (req, res) => {
    console.log('WTF')
    const session = req.session;
    let username = req.signedCookies.username;
    console.log(session)
    
    if (!username) {
        res.send(JSON.stringify({
            success: false,
        }));
    }else {
        let saves = await keepAliveToken(getSaves, req);

        if (saves) {
            // fs.writeFileSync("saves.json", JSON.stringify({saves: saves}));
            res.send(JSON.stringify({
                saves: saves,
            }));
            // fs.writeFile("saves.json", JSON.stringify({saves: saves}), function (err) {
            //     if (err) {
            //         console.log(err);
            //     }
            // });
        }else {
            res.send(JSON.stringify({
                success: false,
            }));
        }
    }
});

module.exports = router;