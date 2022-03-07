const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const app = express();

const session = require('express-session');
const redis  = require('ioredis');
const cookieParser = require('cookie-parser');
const history = require('connect-history-api-fallback');

const routerAuth = require('./routes/auth');
const routerSaves = require('./routes/saves');

const config = require('./config/config.json');
const controllers = require('./controllers.js');
const port = process.env.PORT;
const secrets = process.env.COOKIE_SECRET;


app.use(express.urlencoded({
    extended: true,
}));
app.use(express.json());
app.use(cookieParser(secrets));

// (async () => {
    const redisClient = redis.createClient({
        // host: 'localhost',
        // port: 6379
    });
    // await redisClient.connect();
    redisClient.on('error', (err) => {
        console.log(err);
    });
    redisClient.on('connect', () => {
        console.log('Initiating connection');
    });
    console.log('oii');
    const redisStore = require('connect-redis')(session);
    app.use(session({
        secret: secrets,
        name: 'connect.sid',
        resave: false,
        saveUninitialized: true,
        cookie: {secure: false},
        store: new redisStore({
            host: 'localhost', 
            port: 6379,
            client: redisClient,
            ttl: 1000 * 60 * 10,
        }),
    }));
// })();

app.use('*', (req, res, next) => {
    req.authHeader = req?.session?.access_token !== undefined 
                        ? {'Authorization': `bearer ${req.session.access_token}`}
                        : undefined;
    next();
});

app.use(history({
    verbose: true,
    rewrites: [
        {from: /\/retreive-token/, to: '/retreive-token'},
        {from: /\/saves/, to: function(context) {
            return context.parsedUrl.pathname;
          }},
        {from: /\/test/, to: '/test'},
    ],
}));

app.use('/', routerAuth);
app.use('/saves', routerSaves);

app.get('/test', (req, res) => {
    res.header("Access-Control-Allow-Origin", "http://127.0.0.1:8080");
    const session = req.session;
    const fs = require('fs');

    fs.readFile('saves.json', (err, data) => {
        console.log(JSON.parse(data).saves.length)
        res.send(data);
    });
});



app.listen(port, (a) => {
    console.log(`Listening on port: ${port}`);
});