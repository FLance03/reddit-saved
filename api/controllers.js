const axios = require('axios');
const qs = require('qs');

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = `http://127.0.0.1:${process.env.PORT}/retreive-token`;

async function keepAliveToken(func, req) {
    const session = req.session;

    if (!('refresh_token' in session) || !('access_token' in session)) {
        return false;
    }
    let response = await func(req);
    
    if (response) {
        return response;
    }else {
        console.log('refreshing');
        let token = await axios({
            method: 'post',
            url: 'https://www.reddit.com/api/v1/access_token',
            auth: {
                username: CLIENT_ID,
                password: CLIENT_SECRET,
            },
            headers: {'content_type': 'application/x-www-form-urlencoded'},
            data: qs.stringify({
                grant_type: 'refresh_token',
                refresh_token: session.refresh_token,
            }),
        });
        if (token?.data?.access_token !== undefined) {
        console.log(token.data.access_token);
            session.access_token = token.data.access_token;
            req.authHeader = {
                'Authorization': `bearer ${token.data.access_token}`,
            }
            return await func(req);
        }else {
            return false
        }
        
    }
}

axios.interceptors.response.use(
    function (response) {
        return response;
    }, 
    function (error) {
        return Promise.resolve(error.response);
    }
);


async function getAccessToken(code) {
    let auth = await axios({
        method: 'post',
        url: 'https://www.reddit.com/api/v1/access_token',
        auth: {
            username: CLIENT_ID,
            password: CLIENT_SECRET,
        },
        headers: {'content_type': 'application/x-www-form-urlencoded'},
        data: qs.stringify({
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: REDIRECT_URI,
        }),
    });
    // console.log(auth);
    return auth.status == 200 ? auth : false;
}

async function getUsername(req) {
    const session = req.session;
    // console.log(`bearer ${session.access_token}`)
    // return true
    let res = await axios({
        method: 'get',
        url: 'https://oauth.reddit.com/api/v1/me',
        headers: req.authHeader,
    });
    
    return res?.data?.name !== undefined ? res.data.name : false;
}

async function getSaves(req) {
    let cookies = req.signedCookies;
    let saves = [];
    let lastName = ''
    const limit = 50;

    if (cookies.username === false) {
        return false;
    }
    console.log('req.authHeader', req.authHeader);
    while (true) {
        var res = await axios({
            method: 'get',
            url: `https://oauth.reddit.com/user/${cookies.username}/saved`,
            headers: req.authHeader,
            params: {
                'limit': limit,
                'after': lastName,
            },
        });
        console.log(lastName)
        if (res?.data?.data?.children?.[0] === undefined) {
            break
        }else {
            var posts = res.data.data.children;
            for (var [i, post] of res.data.data.children.entries()) {
                var data = post.data;
                console.log(data.created)
                saves.push({
                    kind: data.kind,
                    subreddit: data.subreddit,
                    text: post.kind == 't1' ? data.body : data.title,
                    link: 'https://www.reddit.com' + data.permalink,
                    name: data.name,
                    ups: data.ups,
                    author: data.author,
                    created: (new Date(data.created * 1000)).toISOString().split('T')[0]
                });
            }
            if (i == limit - 1) {
                lastName = data.name;
                console.log(lastName);
                await sleep(50);
            }else {
                break;
            }
        }
    }
    return res?.data?.data?.children !== undefined ? saves : false;
}

module.exports = {
    keepAliveToken,
    getAccessToken,
    getUsername,
    getSaves,
};