import sys
import os
import re
from math import log
import pathlib
import webbrowser

import pandas as pd
import numpy as np
from PySide2.QtWidgets import (QApplication, QWidget, QLineEdit, QGridLayout,
                             QLabel, QPushButton, QListWidget, QListWidgetItem,
                             QScrollBar, QGroupBox, QVBoxLayout, QScrollArea, QHBoxLayout)
from PySide2.QtCore import Qt
from PySide2.QtGui import QKeyEvent

from reddit import Account, AuthenticationStatus
import widget_management


class Login(QWidget):
    def __init__(self):
        super().__init__()
        self.main_window = None

        self.setWindowTitle('Login')
        self.setFixedWidth(600)
        self.setFixedHeight(150)

        layout = QGridLayout()

        username_label = QLabel('<font size="4">Username</font>')
        self.username_lineEdit = QLineEdit()
        self.username_lineEdit.setPlaceholderText('Enter Username')
        layout.addWidget(username_label, 0, 0)
        layout.addWidget(self.username_lineEdit, 0, 1)

        password_label = QLabel('<font size="4">Password</font>')
        self.password_lineEdit = QLineEdit()
        self.password_lineEdit.setPlaceholderText('Enter Password')
        self.password_lineEdit.setEchoMode(QLineEdit.Password)
        layout.addWidget(password_label, 1, 0)
        layout.addWidget(self.password_lineEdit, 1, 1)

        twofactor_label = QLabel('<font size="4">Two Factor (if applicable)</font>')
        self.twofactor_lineEdit = QLineEdit()
        self.twofactor_lineEdit.setPlaceholderText('Enter Two Factor Code')
        layout.addWidget(twofactor_label, 2, 0)
        layout.addWidget(self.twofactor_lineEdit, 2, 1)

        login_button = QPushButton('Login')
        login_button.clicked.connect(self.verify_account)
        layout.addWidget(login_button, 3, 0, 1, 2)
        layout.setRowMinimumHeight(3, 75)

        self.setLayout(layout)

    def keyPressEvent(self, e:QKeyEvent):
        if e.key() in (Qt.Key_Return, Qt.Key_Enter):
            self.verify_account()

    def verify_account(self):
        account = Account()
        account.login(self.username_lineEdit.text(), self.password_lineEdit.text(),
                      two_factor=self.twofactor_lineEdit.text())
        if account.authentication_status != AuthenticationStatus.NEVER_AUTHENTICATED:
            self.main_window = MainWindow(account)
            self.main_window.show()
            self.hide()


class MainWindowHeader(QWidget):
    def __init__(self, main_window:"MainWindow"):
        super().__init__()
        self.filter = 'text'
        self.main_window = main_window

        layout = QHBoxLayout()

        self.search_bar = QLineEdit()
        self.search_bar.setPlaceholderText('Search...')

        self.search_button = QPushButton('Search')
        self.search_button.clicked.connect(self.initiate_search)

        layout.addWidget(self.search_bar)
        layout.addWidget(self.search_button)

        self.setLayout(layout)

    def initiate_search(self, *args, **kwargs):
        self.main_window.search(self.search_bar.text(), self.filter)

    def keyPressEvent(self, e:QKeyEvent):
        if e.key() in (Qt.Key_Return, Qt.Key_Enter):
            self.initiate_search()


class MainWindowBody(QWidget):
    def __init__(self, saves_df:pd.DataFrame):
        super().__init__()
        saves_df.index = range(len(saves_df))
        self.saves_df = saves_df
        self.show_df = saves_df.copy(deep=False)

        self.scroll_layout = QVBoxLayout()

        self.show_saves_from_subreddit()

        self.setLayout(self.scroll_layout)

    def show_saves_from_subreddit(self):
        widget_management.clear_layout(self.scroll_layout)
        for index, row in self.show_df.iterrows():
            saves_groupbox = QGroupBox()
            test_layout = QVBoxLayout()

            kind = QLabel("Kind: Comment" if row['kind'] == 't1' else "Kind: Post")
            kind.setTextInteractionFlags(Qt.TextSelectableByMouse)
            author = QLabel("Author: " + row['author'])
            author.setTextInteractionFlags(Qt.TextSelectableByMouse)
            text = QLabel("Text: " + row['text'] if len(row['text']) <= 100 else "Text: " + row['text'][:100] + " ...")
            text.setTextInteractionFlags(Qt.TextSelectableByMouse)
            created = QLabel("Created: " + row['created'])
            created.setTextInteractionFlags(Qt.TextSelectableByMouse)
            link = QLabel(f"<a href='{row['link']}'>Go to Link</a>")
            link.setTextInteractionFlags(Qt.TextSelectableByMouse | Qt.LinksAccessibleByMouse)
            link.setOpenExternalLinks(True)
            test_layout.addWidget(kind)
            test_layout.addWidget(author)
            test_layout.addWidget(created)
            test_layout.addWidget(text)
            test_layout.addWidget(link)

            saves_groupbox.setLayout(test_layout)
            self.scroll_layout.addWidget(saves_groupbox)

    def alphanum_to_index(self, char):
        return ord(char)

    def edit_distance(self, A, B):
        Wd, Wi, Wc, Ws = 1, 1, 2, 1
        max_distance = len(A) * Wd + len(B) * Wi + 1

        H = [[0 for j in range(len(B) + 1)] for i in range(len(A) + 1)]
        for i in range(len(A) + 1):
            H[i][0] = i * Wd
        for j in range(len(B) + 1):
            H[0][j] = 0

        DA = [-1] * 256

        for i in range(len(A)):
            DB = -1
            for j in range(len(B)):
                i1 = DA[self.alphanum_to_index(B[j])]
                j1 = DB
                cost = Wc
                if A[i] == B[j]:
                    cost = 0
                    DB = j
                H[i + 1][j + 1] = min(H[i][j] + cost, H[i + 1][j] + Wi, H[i][j + 1] + Wd,
                                      max_distance if i1 == -1 or j1 == -1
                                      else H[i1][j1] + Ws + (i - i1 - 1) * Wd + (j - j1 - 1) * Wi)
            DA[self.alphanum_to_index(A[i])] = i
        return min(H[len(A)])

    def search(self, query:str, filter:str):
        documents = self.saves_df.loc[:, filter]
        query = query.split(' ')
        candidates = [document.split() for document in documents]
        # candidates_matches[i][j] is > 0 iff the ith candidate (starting 0) passes the jth word in the query
        candidates_matches = [[0 for j in range(len(query))] for i in range(len(candidates))]
        # matchCounts is an array where each element gives the number of matches for each word in the query
        match_counts = [0 for i in range(len(query))]
        threshold = 0.5
        for query_index, query_word in enumerate(query):
            for candidate_index, candidate in enumerate(candidates):
                for candidate_word in candidate:
                    query_word = re.sub(r'[^a-zA-Z0-9]', '', query_word).lower()
                    candidate_word = re.sub(r'[^a-zA-Z0-9]', '', candidate_word).lower()
                    word_score = self.edit_distance(query_word, candidate_word)
                    if (scaled_score := word_score / len(query_word)) < threshold:
                        candidates_matches[candidate_index][query_index] = 1 - scaled_score
                        match_counts[query_index] += 1 - scaled_score
        non_empty_candidates = [candidate for candidate in candidates if len(candidate) > 0]
        match_info_content = [log(len(non_empty_candidates) / match_count) if match_count != 0 else 0
                              for match_count in match_counts]

        # Get the total score for every candidate using the specific scores for query words given by match_info_content
        candidates_scores = [[sum_scores, i] for i, candidates_match in enumerate(candidates_matches)
                             if (sum_scores := sum(
                [match * match_info_content[j] for j, match in enumerate(candidates_match)])) > 0]

        sorted_row_order = [row[1] for row in sorted(candidates_scores, key=lambda x: x[0])[::-1]]
        self.show_df = self.saves_df.reindex(sorted_row_order)
        self.show_saves_from_subreddit()


class MainWindow(QWidget):
    def __init__(self, account:Account):
        super().__init__()
        self.setWindowTitle('Saved Posts')
        self.resize(800, 300)

        over = QVBoxLayout()
        header = MainWindowHeader(self)
        over.addWidget(header)

        layout = QGridLayout()

        subreddit_list = QListWidget()
        self.saves_df = account.saves(overwrite=False)

        subreddits = self.get_subreddits_from_saves()
        subreddits = np.array((['All'] + sorted(subreddits, key=str.casefold)))
        subreddit_list.addItems(subreddits)
        subreddit_list.currentItemChanged.connect(self.show_saves_from_subreddit)

        scroll_bar = QScrollBar(self)
        subreddit_list.setVerticalScrollBar(scroll_bar)

        layout.addWidget(subreddit_list)

        self.scroll_widget = MainWindowBody(self.saves_df)

        self.groupboxes_scrollable = QScrollArea()
        self.groupboxes_scrollable.setWidgetResizable(True)
        self.groupboxes_scrollable.setWidget(self.scroll_widget)

        # self.saves_groupbox = QGroupBox()
        # test_layout = QVBoxLayout()
        # test_layout.addWidget(QLabel('111'))
        # test_layout.addWidget(QLabel('222'))
        # test_layout.addWidget(QLabel('333'))
        # self.saves_groupbox.setLayout(test_layout)
        # self.saves_list_groupboxes.addWidget(self.saves_groupbox)

        layout.addWidget(self.groupboxes_scrollable, 0, 1)

        layout.setColumnStretch(0, 1)
        layout.setColumnStretch(1, 5)

        over.addLayout(layout)

        self.setLayout(over)

    def get_subreddits_from_saves(self):
        return self.saves_df['subreddit'].unique()

    def show_saves_from_subreddit(self, list_item:QListWidgetItem):
        if list_item.text() == 'All':
            df = self.saves_df
        else:
            df = self.saves_df.loc[self.saves_df['subreddit'] == list_item.text()]
        self.scroll_widget = MainWindowBody(df)
        self.groupboxes_scrollable.setWidget(self.scroll_widget)
        self.update()

    def search(self, query, filter='text'):
        self.scroll_widget.search(query, filter)



def except_hook(cls, exception, traceback):
    sys.__excepthook__(cls, exception, traceback)


if __name__ == '__main__':
    sys.excepthook = except_hook
    app = QApplication(sys.argv)
    login_window = Login()
    login_window.show()
    app.exec_()
