from flask_socketio_map_dashboard import socketio, app


def test_connect():
    client = socketio.test_client(app, namespace='/map-dashboard')
    received = client.get_received('/map-dashboard')

    cities_upd_msg, clients_connected_msg = None, None
    for msg in received:
        if msg.get('name') == 'updateCities':
            cities_upd_msg = msg
        if msg.get('name') == 'usersConnected':
            clients_connected_msg = msg

    assert cities_upd_msg is not None, 'The message to get the first state of the map must be sent'
    assert clients_connected_msg is not None, 'The number of connected users must be sent on connect'

    n_clients = clients_connected_msg.get('args')[0]
    assert n_clients > 0, 'The connected users must be > 0'

    client.disconnect()


def test_user_vote():
    namespace = '/map-dashboard'
    client = socketio.test_client(app, namespace=namespace)

    client.emit('userVote', {'direction': 'up',
                             'provinceID': 'Madrid'}, namespace=namespace)
    received = client.get_received(namespace)

    cities_upd_msg = list(filter(lambda x: x.get('name') == 'updateCities', received))

    assert len(cities_upd_msg) > 0, 'After a userVote the updateCities is echoed'
    assert cities_upd_msg[0].get('args')[0].get('Madrid') == 1, 'New value for Madrid is 1'

    client.disconnect()
