$(window).load(function () {

    var namespace = '/map-dashboard',
        currentUserId;
    socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port + namespace);


    /**
     * Initializing the map
     */
    map = newMap('#map', doneMap);

    /**
     * Initializing this user
     */
    socket.on('message', function (data) {
        if (data.userId) currentUserId = data.userId;
    });

    /**
     * Updating the connected users
     */
    socket.on('usersConnected', function (lenUsers) {
        $('#user-cnt').text(lenUsers)
    });


    /**
     * Updating a list of cities
     * @param {Object} cities - Object with key as provinceID and value as updated number of votes
     */
    socket.on('updateCities', function (cities) {
        for (var provinceID in cities) {
            if (cities.hasOwnProperty(provinceID)) {
                var $text = $('#' + provinceID),
                    actualValue = parseInt($text.text()),
                    newValue = cities[provinceID],
                    direction = newValue < actualValue ? 'down' : 'up',
                    newClass = 'updated-' + direction;


                $text.text(newValue);
                $text.addClass(newClass);
                var removeUpdated = function () {
                    $text.removeClass();
                };
                setTimeout(removeUpdated, 100);
            }
        }
    });

    /**
     * Initializing a map
     * @param {String} selector - JQuery selector
     * @param {Function} doneFunc - Callback function to be executed when the map is plot
     */
    function newMap(selector, doneFunc) {
        var
            $elem = $(selector),
            $parent = $elem.parent(),
            mapHeight = $parent[0].offsetHeight;
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
                    return '<div class="hoverinfo">' + geography.properties.name + '</div>'
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
     * @param {Datamap} map - Datamap object
     */
    function doneMap(map) {
        map.labels();

        // Adding all the possibilities to the select input
        var provinceIDs = [];
        d3.selectAll(".labels text").each(function (d, i) {
            var provinceID = d3.select(this).attr("id");
            if (provinceID !== "-99") // library default value for unmmaped nodes
                provinceIDs.push(provinceID)
        });

        // Adding a select with all the provinces
        var $provincesSelector = $('#provinceElement');
        provinceIDs.forEach(function (provinceID) {
            $provincesSelector.append($('<option/>').attr('value', provinceID).text(provinceID.replace(/-/g, ' ')))
        });

        // Getting one province randomly selected
        var optionIdx = Math.floor((Math.random() * provinceIDs.length)),
            randomProvinceID = provinceIDs[optionIdx];

        $provincesSelector.val(randomProvinceID);

        // Initializing materialize
        $provincesSelector.material_select();


        // Voting for a province
        $('button').on('click', function (e) {
            var direction;
            if ($(e.target).text() === 'thumb_down') direction = 'down';
            if ($(e.target).text() === 'thumb_up') direction = 'up';
            voteCity(direction);
        });

        // Selecting the province on click
        map.svg.selectAll('.datamaps-subunit').on('click', function (geography) {
            var provinceID = geography.properties.name.replace(/ /g, '-'),
                $provincesSelector = $('#provinceElement');

            $provincesSelector.val(provinceID);
            // Initializing materialize
            $provincesSelector.material_select();

        });
    }

    /**
     * Sending information about this vote to the server
     * @param {String} direction - (up, down)
     */
    function voteCity(direction) {
        if (!direction) return;

        var selectedID = $('#provinceElement').val();
        if (!selectedID) {
            Materialize.toast('Please select a province', 2000); // 4000 is the duration of the toast
            return;
        }

        Materialize.toast('Voting ' + selectedID + ' ' + direction, 200);

        // Sending to the server the vote of the user
        socket.emit('userVote', {direction: direction, provinceID: selectedID});
    }

    // Allow the user to use the arrow keys
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

    // Reset all the provinces text
    socket.on('resetVotes', function () {
        $('.labels text').text('')
    })
});