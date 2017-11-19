$(window).load(function () {

    map = newMap('#map', doneMap);

    var namespace = '/map-dashboard';
    var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port + namespace);


    var currentUserId;

    /**
     * Initializing a map
     */
    function newMap(selector, doneFunc) {
        var $elem = $(selector), $parent = $elem.parent(), mapHeight = $parent[0].offsetHeight;
        $elem.height(mapHeight);

        return new Datamap({
            element: $elem[0],
            scope: 'esp',
            fills: {
                defaultFill: "#ABDDA4"
            },
            done: doneFunc,
            geographyConfig: {
                dataUrl: '/static/libs/json/esp.topo.json',
                highlightBorderColor: '#6e71da',
                popupTemplate: function (geography, data) {
                    return '<div class="hoverinfoww">' + geography.properties.name + '</div>'
                },
                highlightBorderWidth: 3
            },
            setProjection: function (element) {
                var projection = d3.geo.mercator()
                    .scale(2300)
                    .center([-4, 40])
                    .translate([element.offsetWidth / 2, element.offsetHeight / 2]);
                var path = d3.geo.path().projection(projection);
                return {path: path, projection: projection};
            }
        });
    }

    /**
     * Function to be called on map rendered is done
     */
    function doneMap(map) {
        map.labels();

        // Adding all the posibilities to the select input
        var provinceIDs = [];
        d3.selectAll(".labels text").each(function (d, i) {
            var provinceID = d3.select(this).attr("id");
            if (provinceID !== "-99") // library default value for unmmaped nodes
                provinceIDs.push(provinceID)
        });

        // Adding a select with all the provinces
        var $provincesSelector = $('#provinceElement');
        provinceIDs.forEach(function (provinceID, idx) {
            $provincesSelector.append($('<option/>').attr('id', provinceID).text(provinceID))
        });


        // Initializing materialize
        $('select').material_select();

        $('#Huelva').text('78');
        $('#Madrid').text('46');
    }

    /**
     * Initializing this user
     */
    socket.on('message', function (data) {
        if (data.userId) currentUserId = data.userId;
    });

    /**
     * Updating the connected users
     */
    socket.on('users_connected', function (lenUsers) {
        $('#user-cnt').text(lenUsers)
    });


    /**
     * Updating a city number
     */
    socket.on('city_update', function (data) {

    });

    /**
     * Getting the whole map status, usually to initialize it
     */
    socket.on('map_status', function (grid) {

    });

    /**
     * Updating a city of the map
     * @param position: list of 2 elements, [X,Y], starting on 1,1
     * @param symbol: string with the symbol representing this cell
     * @param positionUserId: userId that owns the position we need to move
     * @param remove: if some value is here, the position will be removed
     */
    function updateCityData(position, symbol, positionUserId, remove) {

    }

    $('#btn-up').on('click', function (e) {
        voteCity('up');
    });
    $('#btn-down').on('click', function (e) {
        voteCity('down');
    });

    function voteCity(direction) {
        var cityInfo = 'Cordoba';
        socket.emit('userVote', {direction: direction, city: cityInfo});
    }

    $(document).keydown(function (e) {
        switch (e.which) {
            case 38: // up
                voteCity('up');
                break;

            case 40: // down
                voteCity('down');
                break;

            default:
                return; // exit this handler for other keys
        }
        e.preventDefault(); // prevent the default action (scroll / move caret)
    });
});