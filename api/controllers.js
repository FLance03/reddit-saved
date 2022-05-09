const axios = require('axios');
const qs = require('qs');

const {Save, Account, Post, Comment, Subreddit} = require('./models/index');

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = `http://127.0.0.1:${process.env.PORT}/retreive-token`;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function keepAliveToken(func, req) {
    const session = req.session;

    if (!('refresh_token' in session) || !('access_token' in session)) {
        return null;
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
            session.access_token = token.data.access_token;
            await req.session.save();
            req.authHeader = {
                'Authorization': `bearer ${token.data.access_token}`,
            };
            return await func(req);
        }else {
            return null
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
        // proxy: {
        //     host: "http://192.168.49.1",
        //     port: 8282,
        // },
    });
    return auth?.status == 200 ? auth : null;
}

async function getUsername(req) {
    const session = req.session;
    let res = await axios({
        method: 'get',
        url: 'https://oauth.reddit.com/api/v1/me',
        headers: req.authHeader,
    });
    
    return res?.data?.name !== undefined ? res.data.name : null;
}

async function getSaves(req) {
    let username = req?.signedCookies?.username ?? false;
    let saves = [];
    let lastName = req.query.after === undefined ? '' : req.query.after;
    let remainingRecords = req.query.limit === undefined ? Infinity : req.query.limit;
    const limit = 50;

    if (username === false) {
        return null;
    }
    while (remainingRecords > 0) {
        var res = await axios({
            method: 'get',
            url: `https://oauth.reddit.com/user/${username}/saved`,
            headers: req.authHeader,
            params: {
                'limit': limit < remainingRecords ? limit : remainingRecords,
                'after': lastName,
            },
        });
        if (res?.data?.data?.children?.[0] === undefined) {
            break
        }else {
            var posts = res.data.data.children;
            for (var [i, post] of res.data.data.children.entries()) {
                var data = post.data;
                saves.push({
                    kind: post.kind,
                    subreddit: data.subreddit,
                    title: post.kind == 't1' ? undefined : data.title,
                    body: post.kind == 't1' ? data.body : data.selftext,
                    link: 'https://www.reddit.com' + data.permalink,
                    name: data.name,
                    ups: data.ups,
                    author: data.author,
                    created: (new Date(data.created * 1000)).toISOString()
                });
            }
            if (i == limit - 1) {
                remainingRecords -= limit;
                lastName = data.name;
                await sleep(500);
            }else {
                break;
            }
        }
    }
    return res?.data?.data?.children !== undefined ? saves : null;
}

async function getSavesDB(req, username) {
    let accountId = await setWhenNotExist(accountIdHandler, 
                username != null ? username : req.signedCookies.username);
    
    return !accountId 
            ? false 
            : await Save.findAll({
                attributes: ['name'],
                where: {
                    account_id: accountId,
                },
            });
}

async function setWhenNotExist(dbHandler, ...params) {
    let retVal = await dbHandler(...params, 'get');
    return retVal === null ? await dbHandler(...params, 'set') : retVal;
}

async function accountIdHandler(username, method) {
    if (!username) {
        return false;
    }else if (method == 'get') {
        let account = await Account.findOne({where: {name: username}});
        return account?.id ?? null;
    }else if (method == 'set') {
        let account = await Account.create({name: username});
        return account?.id ?? false;
    }else {
        return null;
    }
}

async function subredditIdHandler(subredditName, method) {
    if (method == 'get') {
        let subreddit = await Subreddit.findOne({where: {name: subredditName}});
        return subreddit?.id ?? null;
    }else if (method == 'set') {
        let subreddit = await Subreddit.create({name: subredditName});
        return subreddit?.id ?? false;
    }else {
        return null;
    }
}

async function insertSavesDB(req, toAddSaves) {
    const username = req.signedCookies.username;
    const checkAllKeysExist = (save) => {
        let savesTableCheck = save.subreddit && save.kind && save.name && save.author && save.created && save.link;
        let childTableCheck = (save.kind == 't1' && typeof save.body === 'string') || 
                                (save.kind == 't3' && typeof save.title === 'string' && typeof save.body === 'string');
        if (!savesTableCheck || !childTableCheck) {
            console.log(save)
        }
        return savesTableCheck && childTableCheck;
    }

    let accountId = await setWhenNotExist(accountIdHandler, username);

    if (!toAddSaves.every(checkAllKeysExist) || accountId === false) {
        return false;
    }else {
        for (const save of toAddSaves) {
            const subredditId = await setWhenNotExist(subredditIdHandler, save.subreddit);
            const parent = await Save.create({
                subreddit_id: subredditId,
                account_id: accountId,
                saves_type: save.kind == 't1' ? 'c' : 's', // 'c' for Comment, 's' for Submission
                name: save.name,
                author_id: await setWhenNotExist(accountIdHandler, save.author),
                date_posted: save.created,
                link: save.link,
            });
            const child = save.kind == 't1' 
            ? await Comment.create({
                save_id: parent.id,
                title: save.body,
            })
            : await Post.create({
                save_id: parent.id,
                title: save.title,
                selftext: save.body,
            });
            await Save.update(
                {child_id: child.id},
                {where: {id: parent.id}}
            )
        }
        return true;
    }
}

async function deleteSavesDB(req, toDeleteSaves) {
    const username = req.signedCookies.username;
    let accountId = await setWhenNotExist(accountIdHandler, username);

    if (!username || !toDeleteSaves.every(save => save.name) || accountId === false) {
        return false;
    }else {
        for (const save of toDeleteSaves) {
            const parent = await Save.findOne({where: {name: save}});
            console.assert(parent.id !== null);
            const ChildModel = parent.saves_type == 'c' ? Comment : Post;
            const child = ChildModel.findByPk(parent.id);

            await Save.destroy({where: {id: parent.id}});
            await ChildModel.destroy({where: {id: child.id}});
        }
        return true;
    }
}

async function postSaves(req) {
    const username = req?.signedCookies?.username ?? false;
    const fullnames = req?.fullnames;
    const from = req?.from;

    if (username === false || fullnames === undefined || from === undefined || /^[\w\d_]+$/.test(from) === false) {
        return false;
    }else {
        for (fullname of fullnames) {
            let response = await axios({
                url: 'https://oauth.reddit.com/api/save',
                method: 'post',
                headers: req.authHeader,
                data: qs.stringify({
                    id: fullname,
                }),
            });
            if (response.status != 200) {
                console.log(response);
                break
            }else {
                sleep(50)
            }
        }
        return true;
    }
    
}

module.exports = {
    keepAliveToken,
    getAccessToken,
    getUsername,
    getSaves,
    getSavesDB,
    insertSavesDB,
    deleteSavesDB,
    postSaves,
};