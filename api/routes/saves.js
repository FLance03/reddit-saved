const router = require('express').Router();
const {keepAliveToken, getSaves} = require('../controllers.js');

router.get('/', async (req, res) => {
    const session = req.session;
    let username = req.signedCookies.username
    
    if (!username) {
        res.send(JSON.stringify({
            success: false,
        }));
    }else {
        let saves = await keepAliveToken(getSaves, req);

        if (saves) {
            res.send(JSON.stringify({
                saves: saves,
            }))
        }else {
            res.send(JSON.stringify({
                success: false,
            }));
        }
    }
    // res.cookie('test', 'eyyy', {signed: true});
    // const session = req.session;

    // if (!('refresh_token' in session)) {
    //     res.send(JSON.stringify({
    //         success: false,
    //     }))
    // }else {

    // }
});

module.exports = router;