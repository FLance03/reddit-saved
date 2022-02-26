import Vue from 'vue';

import login from './views/login';
import home from './views/home';

export default new VueRouter({
    routes: [
        {
            path: "/login",
            name: "login",
            component: login,
        },
        {
            path: "/home",
            name: "home",
            component: home,
        },
    ]
});