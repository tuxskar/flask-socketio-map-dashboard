$(document).ready(function () {
    var options = ['vote-up', 'vote-down'],
        timeoutFunc = {},
        maxTimeWait = userMaxTimeWait,
        minTimeWait = 300,
        $selectProvince = $('#provinceElement');


    callFunc(makeVote, minTimeWait);
    callFunc(changeProvince, 5000);

    /**
     * Voting for a province
     */
    function makeVote() {
        var optionIdx = Math.floor((Math.random() * 100)),
            optionToSelect = optionIdx > 30 ? 1 : 0;
        $('#' + options[optionToSelect]).click();
    }

    /**
     * Selecting a random province
     */
    function changeProvince() {
        var provincesLength = $selectProvince.find('option').length,
            optionIdx = getRandomInt(1, provincesLength);

        if (provincesLength.length <= 1) return; // the first is disabled

        var newVal = $selectProvince.find('option:eq(' + optionIdx + ')').val();

        $selectProvince.val(newVal);
        $selectProvince.material_select();

        Materialize.toast('Changed province to: ' + newVal, 500);
    }

    function callFunc(funcToCall, minTime) {
        funcToCall();
        timeoutFunc[funcToCall] = setTimeout(function () {
                callFunc(funcToCall, minTime);
            }
            , Math.floor((Math.random() * maxTimeWait) + (minTime || minTimeWait))
        );
    }


    /**
     * Returns a random integer between min (inclusive) and max (inclusive)
     * Using Math.round() will give you a non-uniform distribution!
     */
    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

});