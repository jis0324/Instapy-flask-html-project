from instapy import InstaPy
from instapy import smart_run
from flask import Flask, render_template, request
import json
import ast
import threading
import datetime
import time
import sqlite3
from sqlite3 import Error
import os.path
import hashlib

app = Flask(__name__)

# login credentials
insta_username = ''
insta_password = ''

session = None
total_userlist = []
start_accountlist = []
white_accountlist = []
black_accountlist = []
follow_amount = 0
follow_every = 0
unfollow_amount = 0
unfollow_every = 0
follow_weekdays = []
unfollow_weekdays = []
follow_timerange = {}
unfollow_timerange = {}
runState = False
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
db_file = os.path.join(BASE_DIR, "pythonsqlite.db")

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/getUserlist/')
def getUserlist():
    global total_userlist
    global db_file
    conn = sqlite3.connect(db_file)
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM instapy")
    rows = cursor.fetchall()
    conn.commit()
    cursor.close()
    
    total_userlist = []
    for row in rows:
        total_userlist.append({ 'id': row[0], 'username': row[1], 'password': row[2], 'start_accounts': row[3], 'follow_days': row[4], 'follow_amount': row[5], 'follow_every': row[6], 'follow_timerange': row[7], 'unfollow_days': row[8], 'unfollow_amount': row[9], 'unfollow_every': row[10], 'unfollow_timerange': row[11], 'whitelist': row[12], 'blacklist': row[13], 'status': row[14]})
    return(json.dumps(total_userlist))

@app.route('/addUser/')
def addUser():
    username = request.args.get('username')
    password = request.args.get('password')

    global db_file
    conn = sqlite3.connect(db_file)
    cursor = conn.cursor()
    hashed_password = hashlib.md5(password.encode()).hexdigest()
    query = "INSERT INTO instapy ( name, password ) VALUES ( '" + username + "', '" + password + "' )"
    count = cursor.execute(query)
    cursor.execute("SELECT * FROM instapy")
    rows = cursor.fetchall()
    conn.commit()
    cursor.close()
    
    total_userlist = []
    for row in rows:
        total_userlist.append({ 'id': row[0], 'username': row[1], 'password': row[2], 'start_accounts': row[3], 'follow_days': row[4], 'follow_amount': row[5], 'follow_every': row[6], 'follow_timerange': row[7], 'unfollow_days': row[8], 'unfollow_amount': row[9], 'unfollow_every': row[10], 'unfollow_timerange': row[11], 'whitelist': row[12], 'blacklist': row[13], 'status': row[14]})
    return(json.dumps(total_userlist))

@app.route('/delUser/')
def delUser():
    username = request.args.get('username')
    global db_file
    conn = sqlite3.connect(db_file)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM instapy WHERE name=?", (username,))
    conn.commit()
    cursor.close()
    return('True')

def createSession():
    # get an InstaPy session!
    # set headless_browser=True to run InstaPy in the background
    global session
    session = InstaPy(username=insta_username,
                password=insta_password,
                headless_browser=False)

def smart_runBotForFollow():
    try:
        with smart_run(session, threaded=True):
            """ Activity flow """
            # general settings
            session.set_relationship_bounds(enabled=True,
                                            delimit_by_numbers=True,
                                            max_followers=4590,
                                            min_followers=45,
                                            min_following=77,
                                            max_following=1000)    
        

            # activities
            session.set_dont_include(["zabacards", "pokemonobsession"])
            session.set_dont_like(["zabacards", "pokemonobsession"])
            
            """ Massive Follow of users followers (I suggest to follow not less than
            3500/4000 users for better results)... 
            """
            session.follow_user_followers(start_accountlist, amount=int(follow_amount),
                                        randomize=False, interact=False)
            
            """ Joining Engagement Pods...
            """
            photo_comments = ['Nice shot! @{}',
                'Awesome! @{}',
                'Cool :thumbsup:',
                'Just incredible :open_mouth:',
                'What camera did you use @{}?',
                'Love your posts @{}',
                'Looks awesome @{}',
                'Nice @{}',
                ':raised_hands: Yes!',
                'I can feel your passion @{} :muscle:']

            session.set_do_comment(enabled = True, percentage = 95)
            session.set_comments(photo_comments, media = 'Photo')
            session.join_pods(topic='fashion', engagement_mode='no_comments')
    except:
        print("Session terminated successfully")
        
def smart_runBotForUnfollow():
    try:
        with smart_run(session, threaded=True):
            """ Activity flow """
            # general settings
            session.set_relationship_bounds(enabled=True,
                                            delimit_by_numbers=True,
                                            max_followers=4590,
                                            min_followers=45,
                                            min_following=77,
                                            max_following=1000)

            session.set_dont_include(white_accountlist)
            session.set_dont_like(black_accountlist)

            global unfollow_amount

            """ First step of Unfollow action - Unfollow not follower users...
            """
            session.unfollow_users(amount=int(unfollow_amount), instapy_followed_enabled=True, instapy_followed_param="nonfollowers",
                                style="FIFO",
                                unfollow_after=168 * 60 * 60, sleep_delay=601)

            """ Clean all followed user - Unfollow all users followed by bot...
            """
            session.unfollow_users(amount=int(unfollow_amount), instapy_followed_enabled=True, instapy_followed_param="all",
                                style="FIFO", unfollow_after=336 * 60 * 60,
                                sleep_delay=601)

    except:
        print("Session terminated successfully")

@app.route('/getRunData')
def getRunDate():
        
    global follow_weekdays
    follow_weekdays = []
    global unfollow_weekdays
    unfollow_weekdays = []
        
    userdata = ast.literal_eval(request.args.get('userdata'))
    formdata = ast.literal_eval(request.args.get('formdata'))
    for item in formdata:
        if item['name'] == 'follow-amount':
            global follow_amount
            follow_amount = item['value']
        elif item['name'] == 'follow-every':
            global follow_every
            follow_every = item['value']
        elif item['name'] == 'unfollow-amount':
            global unfollow_amount
            unfollow_amount = item['value']
        elif item['name'] == 'unfollow-every':
            global unfollow_every
            unfollow_every = item['value']
        elif item['name'] == 'follow-checkbox-Ma':
            follow_weekdays.append(0)
        elif item['name'] == 'follow-checkbox-Tu':
            follow_weekdays.append(1)
        elif item['name'] == 'follow-checkbox-We':
            follow_weekdays.append(2)
        elif item['name'] == 'follow-checkbox-Th':
            follow_weekdays.append(3)
        elif item['name'] == 'follow-checkbox-Fr':
            follow_weekdays.append(4)
        elif item['name'] == 'follow-checkbox-Sa':
            follow_weekdays.append(5)
        elif item['name'] == 'follow-checkbox-Su':
            follow_weekdays.append(6)
        elif item['name'] == 'unfollow-checkbox-Ma':
            unfollow_weekdays.append(0)
        elif item['name'] == 'unfollow-checkbox-Tu':
            unfollow_weekdays.append(1)
        elif item['name'] == 'unfollow-checkbox-We':
            unfollow_weekdays.append(2)
        elif item['name'] == 'unfollow-checkbox-Th':
            unfollow_weekdays.append(3)
        elif item['name'] == 'unfollow-checkbox-Fr':
            unfollow_weekdays.append(4)
        elif item['name'] == 'unfollow-checkbox-Sa':
            unfollow_weekdays.append(5)
        elif item['name'] == 'unfollow-checkbox-Su':
            unfollow_weekdays.append(6)
            
    global insta_username
    insta_username = userdata['username']
    global insta_password
    insta_password = userdata['password']
    global start_accountlist
    start_accountlist = ast.literal_eval(request.args.get('start_accountlist'))
    global white_accountlist
    white_accountlist = ast.literal_eval(request.args.get('white_accountlist'))
    global black_accountlist
    black_accountlist = ast.literal_eval(request.args.get('black_accountlist'))
    global follow_timerange
    follow_timerange = ast.literal_eval(request.args.get('follow_timerange'))
    global unfollow_timerange
    unfollow_timerange = ast.literal_eval(request.args.get('unfollow_timerange'))

    global db_file
    conn = sqlite3.connect(db_file)
    with conn:
        cursor = conn.cursor()
        cursor.execute("UPDATE instapy SET start_accounts = ?, follow_days = ?, follow_amount = ?, follow_every = ?, follow_timerange = ?, unfollow_days = ?, unfollow_amount = ?, unfollow_every = ?, unfollow_timerange = ?, whitelist = ?, blacklist = ?, status = ? WHERE name=?", ( json.dumps(start_accountlist), json.dumps(follow_weekdays), int(follow_amount), int(follow_every), json.dumps(follow_timerange), json.dumps(unfollow_weekdays), int(unfollow_amount), int(unfollow_every), json.dumps(unfollow_timerange), json.dumps(white_accountlist), json.dumps(black_accountlist), True, insta_username))
    
    global runState
    runState = True
    startbot()
    return 'True'

@app.route('/stopBot/')
def stopBot():
    global session
    if session is not None:
        session.end(threaded_session=True)
        session = None
    global runState
    runState = False
    global db_file
    conn = sqlite3.connect(db_file)
    with conn:
        cursor = conn.cursor()
        cursor.execute("UPDATE instapy SET status = ? WHERE name=?", ( False, request.args.get('username')))
    
    return 'True'
    
def startbot():
    
    global session
    
    # for follow start time
    follow_start_time = '';
    follow_end_time = '';
    if 'from' in follow_timerange and str(follow_timerange['from']['period']) == 'AM':
        if follow_timerange['from']['hour'] == '12':
            follow_timerange['from']['hour'] = '00'
        follow_start_time = str(follow_timerange['from']['hour']) + '-' + str(follow_timerange['from']['minute'])
    elif 'from' in follow_timerange and str(follow_timerange['from']['period']) == 'PM':
        follow_start_time = str(int(follow_timerange['from']['hour']) + 12) + '-' + str(follow_timerange['from']['minute'])
    
    # for follow end time
    if 'to' in follow_timerange and str(follow_timerange['to']['period']) == 'AM':
        if follow_timerange['from']['hour'] == '12':
            follow_timerange['from']['hour'] = '00'
        follow_end_time = str(follow_timerange['to']['hour']) + '-' + str(follow_timerange['to']['minute'])
    elif 'to' in follow_timerange and str(follow_timerange['to']['period']) == 'PM':
        follow_end_time = str(int(follow_timerange['to']['hour']) + 12) + '-' + str(follow_timerange['to']['minute'])
    
    # for unfollow start time
    unfollow_start_time = '';
    unfollow_end_time = '';
    if 'from' in unfollow_timerange and unfollow_timerange['from']['period'] == 'AM':
        unfollow_start_time = str(unfollow_timerange['from']['hour']) + '-' + str(unfollow_timerange['from']['minute'])
    elif 'from' in unfollow_timerange and unfollow_timerange['from']['period'] == 'PM':
        unfollow_start_time = str(int(unfollow_timerange['from']['hour']) + 12) + '-' + str(unfollow_timerange['from']['minute'])
    
    # for unfollow end time
    if 'to' in unfollow_timerange and unfollow_timerange['to']['period'] == 'AM':
        unfollow_end_time = str(unfollow_timerange['to']['hour']) + '-' + str(unfollow_timerange['to']['minute'])
    elif 'to' in unfollow_timerange and str(unfollow_timerange['to']['period']) == 'PM':
        unfollow_end_time = str(int(unfollow_timerange['to']['hour']) + 12) + '-' + str(unfollow_timerange['to']['minute'])
    
    global runState
    
    while runState:
        # get now time
        now_time = str(datetime.datetime.now().strftime("%H")) + '-' + str(datetime.datetime.now().strftime("%M"))
        if datetime.datetime.today().weekday() in follow_weekdays and follow_start_time is not '' and follow_end_time is not '':
            if follow_start_time == now_time and follow_start_time <= follow_end_time and session is None:
                createSession()
                smart_runBotForFollow()
                follow_start_time = str(int(follow_start_time.split('-')[0]) + int(follow_every)) + '-' + str(follow_start_time.split('-')[1])
                if int(follow_start_time.split('-')[0]) < 10:
                    follow_start_time = str('0' + str(follow_start_time.split('-')[0])) + '-' + str(follow_start_time.split('-')[1])
                session = None
        
        #only unfollow user
        if datetime.datetime.today().weekday() in unfollow_weekdays and unfollow_start_time is not '' and unfollow_end_time is not '':
            if unfollow_start_time == now_time and unfollow_start_time <= unfollow_end_time and session is None:
                createSession()
                smart_runBotForUnfollow()
                unfollow_start_time = str(int(unfollow_start_time.split('-')[0]) + int(unfollow_every)) + '-' + str(unfollow_start_time.split('-')[1])
                if int(unfollow_start_time.split('-')[0]) < 10:
                    unfollow_start_time = str('0' + str(unfollow_start_time.split('-')[0])) + '-' + str(unfollow_start_time.split('-')[1])
                session = None

if __name__ == '__main__':
    
    app.run(debug=False, use_reloader=False)
    
 