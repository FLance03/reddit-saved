import sys
import os
import pathlib
import re
from pprint import pprint as p
from time import sleep
from datetime import datetime
from enum import Enum

import requests
import pandas as pd

class AuthenticationStatus(Enum):
    NEVER_AUTHENTICATED = 0
    HAS_AUTHENTICATED = 1
    IS_AUTHENTICATED = 2

class Account:
    def __init__(self):
        super().__init__()
        self.CLIENT_ID = 'drccp9VbeLZRSjh1G0h6Pg'
        self.SECRET_KEY = 'HbxMNNv71FKLDSdy9Mi0FfRWIWK-fw'
        self.authentication_status = AuthenticationStatus.NEVER_AUTHENTICATED
        self.username = None
        self.password = None
        self.headers = {'User-Agent': 'API'}

        if self.CLIENT_ID == '' or self.SECRET_KEY == '':
            raise Exception('Please specify both client id and secret key')

    def login(self, username, password='', two_factor='', access_token=''):
        if password == '' and access_token == '':
            parent_dir = pathlib.Path(__file__).parent.resolve()
            print(os.path.join(parent_dir, 'bin', f'{username}_saves.pkl'))
            if not os.path.exists(os.path.join(parent_dir, 'bin', f'{username}_saves.pkl')):
                raise Exception("User has either not been authenticated at least once or file has been deleted")
            else:
                self.username = username
                self.authentication_status = AuthenticationStatus.HAS_AUTHENTICATED
        elif access_token == '':
            auth = requests.auth.HTTPBasicAuth(self.CLIENT_ID, self.SECRET_KEY)
            data = {
                'grant_type': 'password',
                'username': username,
                'password': password if two_factor == '' else password + ':' + two_factor,
            }
            res = requests.post('https://www.reddit.com/api/v1/access_token', auth=auth, data=data, headers=self.headers).json()
            try:
                token = res['access_token']
            except KeyError:
                return False
            else:
                self.username = username
                self.password = password
                self.authentication_status = AuthenticationStatus.IS_AUTHENTICATED
                self.headers['Authorization'] = f'bearer {token}'
                print(token)
                return True
        else:
            res = requests.get('https://oauth.reddit.com/api/v1/me', headers={**self.headers, 'Authorization': f'bearer {access_token}'})
            print(res)
            if res.status_code != 200:
                return False
            else:
                self.username = res.json()['name'].lower()
                self.password = password
                self.authentication_status = AuthenticationStatus.IS_AUTHENTICATED
                self.headers['Authorization'] = f'bearer {access_token}'
                return True

    def saves(self, overwrite=False):
        """Get all the saved posts and comments from the account
        """

        if self.authentication_status == AuthenticationStatus.NEVER_AUTHENTICATED:
            raise Exception('User is not Authenticated and no prior file exists')
        elif self.authentication_status == AuthenticationStatus.HAS_AUTHENTICATED and overwrite:
            raise Exception('Cant overwrite file without re-authentication')

        def retrieve_saves_from_reddit():
            print('oiiiiiiiiiiiiiiiiiiiiiiiiiiiii')
            saves_df = []
            last_name = ''
            while True:
                saves = requests.get(f'https://oauth.reddit.com/user/{self.username}/saved', headers=self.headers,
                                     params={'limit': 50, 'after': last_name}).json()
                for post_num, post in enumerate(saves['data']['children']):
                    data = post['data']
                    saves_df.append({
                        'kind': post['kind'],
                        'subreddit': data['subreddit'],
                        'text': data['body'] if post['kind'] == 't1' else data['title'],
                        'link': 'https://www.reddit.com' + data['permalink'],
                        'name': data['name'],
                        'ups': data['ups'],
                        'author': data['author'],
                        'created': str(datetime.fromtimestamp(data['created']))
                    })
                if post_num == 49:
                    last_name = data['name']
                    print(last_name)
                    sleep(3)
                else:
                    print(post_num)
                    break
            saves_df = pd.DataFrame(saves_df)
            parent_dir = pathlib.Path(__file__).parent.resolve()
            if not os.path.exists(os.path.join(parent_dir, 'bin')):
                os.mkdir(os.path.join(parent_dir, 'bin'))
            saves_df.to_pickle(f'./bin/{self.username}_saves.pkl')
            return saves_df

        # If overwrite is False, check if a past pickle file already exists
        if overwrite:
            return retrieve_saves_from_reddit()
        else:
            # parent_dir = pathlib.Path(__file__).parent.resolve()
            # bin_dir = os.path.join(parent_dir, 'bin')
            # if not os.path.exists(bin_dir):
            #     os.mkdir(bin_dir)
            # _, _, filenames = next(os.walk(bin_dir), (None, None, []))
            # for filename in filenames:
            #     p = re.match(r'\bsaves\.pkl\b')
            #     if p is not None:
            #         saves_df = pd.read_pickle('./bin/saves.pkl')
            try:
                return pd.read_pickle(f'./bin/{self.username}_saves.pkl')
            except FileNotFoundError:
                return retrieve_saves_from_reddit()







