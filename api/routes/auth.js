const router = require('express').Router();
const getRandomValues = require('get-random-values')

const {keepAliveToken, getAccessToken, getUsername} = require('../controllers.js');
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = `http://127.0.0.1:${process.env.PORT}/retreive-token`;

router.post('/login', (req, res) => {
    const session = req.session;
    session.test = req.body.username;
    res.end('success');
});

router.post('/redirect-authorize', (req, res) => {
    const session = req.session;

    let state = new Uint8Array(10);
    state = getRandomValues(state).join('');
    
    req.session.state = state;
    req.session.save(function(err) {
        res.redirect(`https://www.reddit.com/api/v1/authorize?client_id=${CLIENT_ID}&response_type=code&state=${state}&redirect_uri=${REDIRECT_URI}&duration=permanent&scope=identity,history,save`);
    });


});

router.get('/retreive-token', async (req, res) => {
    const session = req.session;
    let {error, code, state} = req.query
    
    console.log(error, code, state, session.state)
    if (!error && state == session.state) {
        let auth = await getAccessToken(code);
        console.log(1)
        if (auth === null) {
            console.log(2, code)
            res.send(JSON.stringify({
                success: false,
            }));
        }else if (auth?.data?.access_token !== undefined && 
                     auth?.data?.refresh_token !== undefined){
            console.log(3)
            let {access_token, refresh_token} = auth.data
            let username;
            session.access_token = access_token;
            session.refresh_token = refresh_token;
            console.log(access_token, refresh_token);

            req.authHeader = {'Authorization': `bearer ${req.session.access_token}`};
            username = await keepAliveToken(getUsername, req);
            
            if (username) {
                console.log(4)
                res.cookie('username', username, {signed: true});
                res.redirect('http://127.0.0.1:8080/saves');
            }else {
                res.send(JSON.stringify({
                    success: false,
                }));
            }
        }else {
            res.send(JSON.stringify({
                success: false,
            }));
        }
    }else {
        res.send(JSON.stringify({
            success: false,
        }));
    }
});

module.exports = router;