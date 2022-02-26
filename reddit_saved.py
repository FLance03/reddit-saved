import sys
import os
import pathlib
import webbrowser

import numpy as np
from PyQt5.QtWidgets import (QApplication, QWidget, QLineEdit, QGridLayout,
                             QLabel, QPushButton, QListWidget, QListWidgetItem,
                             QScrollBar, QGroupBox, QVBoxLayout, QScrollArea)
from PyQt5.QtCore import Qt
from PyQt5.QtGui import QKeyEvent

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

    def keyPressEvent(self, e: QKeyEvent):
        if e.key() in (Qt.Key_Return, Qt.Key_Enter):
            self.verify_account()

    def verify_account(self):
        print('hoi')
        account = Account()
        print('hoi')
        account.login(self.username_lineEdit.text(), self.password_lineEdit.text(),
                      two_factor=self.twofactor_lineEdit.text())
        print('hoi')
        if account.authentication_status != AuthenticationStatus.NEVER_AUTHENTICATED:
            print(account.username)
            self.main_window = MainWindow(account)
            self.main_window.show()
            self.hide()


class MainWindow(QWidget):
    def __init__(self, account:Account):
        super().__init__()
        self.setWindowTitle('Saved Posts')
        self.resize(800, 300)

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

        self.scroll_layout = QVBoxLayout()

        scroll_widget = QWidget()
        scroll_widget.setLayout(self.scroll_layout)

        groupboxes_scrollable = QScrollArea()
        groupboxes_scrollable.setWidgetResizable(True)
        groupboxes_scrollable.setWidget(scroll_widget)

        # self.saves_groupbox = QGroupBox()
        # test_layout = QVBoxLayout()
        # test_layout.addWidget(QLabel('111'))
        # test_layout.addWidget(QLabel('222'))
        # test_layout.addWidget(QLabel('333'))
        # self.saves_groupbox.setLayout(test_layout)
        # self.saves_list_groupboxes.addWidget(self.saves_groupbox)

        layout.addWidget(groupboxes_scrollable, 0, 1)

        layout.setColumnStretch(0, 1)
        layout.setColumnStretch(1, 5)

        self.setLayout(layout)

    def get_subreddits_from_saves(self):
        return self.saves_df['subreddit'].unique()

    def show_saves_from_subreddit(self, list_item:QListWidgetItem):
        widget_management.clear_layout(self.scroll_layout)
        if list_item.text() == 'All':
            df = self.saves_df
        else:
            df = self.saves_df.loc[self.saves_df['subreddit'] == list_item.text()]
        for index, row in df.iterrows():
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

        print(list_item.text())


def except_hook(cls, exception, traceback):
    sys.__excepthook__(cls, exception, traceback)


if __name__ == '__main__':
    sys.excepthook = except_hook
    app = QApplication(sys.argv)
    login_window = Login()
    login_window.show()
    app.exec()
