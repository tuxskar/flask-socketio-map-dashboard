#!/usr/bin/env python
from flask import Flask, render_template, request
from flask_assets import Environment

from controller import get_rooms, get_word_counter_processed, get_room_name, get_username, process_word_cnts
from flask_socketio import SocketIO, join_room, send, emit
# Set this variable to "threading", "eventlet" or "gevent" to test the
# different async modes, or leave it set to None for the application to choose
# the best option based on installed packages.
from models import Message, MessagesCollection, get_users, SENTENCES

app = Flask(__name__)
app.config['SECRET_KEY'] = 'SuperMegaSecret!'
socketio = SocketIO(app)

assets = Environment(app)


@app.route('/', defaults=dict(room=None))
@app.route('/<room>')
def index(room):
    return render_template('index.html', async_mode=socketio.async_mode)


@socketio.on('join')
def join(message):
    room, room_name = get_room_name(message)
    join_room(room)

    join_data = {'roomMessages': MessagesCollection.to_json(room), 'username': get_username(), 'users': get_users(),
                 'words': get_word_counter_processed(room), 'sentences': SENTENCES[room], 'room': room,
                 'roomName': room_name}

    send(join_data)
    emit_user_count(room)


@socketio.on('disconnect')
def on_disconnect():
    emit_user_count(exclude_sid=request.sid)


def emit_user_count(room=None, exclude_sid=None):
    for room in get_rooms(room):
        users = [x for x in socketio.server.manager.rooms.get('/', {}).get(room, []) if x != exclude_sid]
        emit('userCnt', dict(cnt=len(users)), room=room)


@socketio.on('newMsg')
def new_msg(user_message):
    sent_msg = user_message.get('data')
    username = user_message.get('username')
    new_message = Message(msg=sent_msg, username=username)

    room = user_message['room']

    process_word_cnts(sent_msg, room)

    if room not in MessagesCollection:
        MessagesCollection[room] = []

    MessagesCollection[room].append(new_message)
    MessagesCollection[room] = MessagesCollection[room][:30]
    emit('newMsg', new_message.to_json(), room=room)

    emit('newWordUpdate', get_word_counter_processed(room), room=room)


def get_cnt_users(room):
    return len(socketio.server.manager.rooms.get('/', {}).get(room))


if __name__ == '__main__':
    socketio.run(app, debug=True)
