from flask import Flask, render_template, request
from flask_assets import Environment
from flask_socketio import SocketIO, emit

app = Flask(__name__)
socketio = SocketIO(app)

assets = Environment(app)

MAP = {}

users_connected = set()


@app.route('/')
def index():
    auto_move = request.args.get('auto_move')
    max_time_wait = int(auto_move) if auto_move and auto_move.isnumeric() else 300
    return render_template('index.html', auto_move=auto_move, max_time_wait=max_time_wait)


@socketio.on('connect', namespace='/map-dashboard')
def on_connect():
    # Adding the user to the room to count on him
    user_id = request.sid
    users_connected.add(user_id)

    # Sent to the user the map status
    emit('update_cities', MAP)

    # Send in broadcast the actual number of connected users
    emit('users_connected', len(users_connected), broadcast=True)


@socketio.on('userVote', namespace='/map-dashboard')
def on_vote(data):
    # calculate the new position
    direction = data.get('direction')

    province_id = data.get('provinceID')

    delta = 2
    if direction == 'down':
        delta = -1

    # Updating province_id with minimum value of 0 in memory
    MAP[province_id] = max(MAP.get(province_id, 0) + delta, 0)

    # Sending the update to all the users connected
    payload = {province_id: MAP[province_id]}
    emit('update_cities', payload, broadcast=True)


@socketio.on('disconnect', namespace='/map-dashboard')
def on_disconnect():
    # Removing the user from all the rooms where he is and broadcasting the new number
    user_id = request.sid
    users_connected.remove(user_id)

    # Sending the new number of users connected
    emit('users_connected', len(users_connected), broadcast=True)


if __name__ == '__main__':
    socketio.run(app, debug=True)
