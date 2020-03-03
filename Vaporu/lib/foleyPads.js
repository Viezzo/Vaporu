$(document).ready(function() {

    var globalFoleyPads = [];
    var globalRecording = false;
    // set the <option> element before options are dynamically added to it
    var emptyTrackList = $("#foleyAudioTrackOptions").clone();
    // set the <option> element before options are dynamically added to it
    var emptyBankList = $("#foleyBankOptions").clone();


    $("#foleyBankSelect").change(function () {
        setBankOptions();
    });

    $(".fa-circle").click(function(){
        // do something
        var originalColor = $(this).css("color");
        if (globalRecording){
            $(this).css("color", "#ffffff");
            globalRecording = false;
        }
        else {
            $(this).css("color", "#ff1500");
            globalRecording = true;
        }
    });

    $('[data-toggle="recordTooltip"]').tooltip({
        trigger : 'hover'
    });

    $(".fa-circle").hover(function () {
        if (!globalRecording){
            $(this).animate({color: "#ff1500"}, 100);
            $("#recordTooltip").css("visibility", "visible");
        }
    }, function(){
        if (!globalRecording){
            $(this).animate({color:  "white"});
            $("#recordTooltip").css("visibility", "hidden");
        }
    });

    $("#foleyRefreshButton").click(function(){
        initGrid();
    });

    $('[data-toggle="foleyRefreshTooltip"]').tooltip({
        trigger : 'hover'
    });

    $("#foleyRefreshButton").hover(function () {
        $(this).animate({color: "#1cff73"});
        $("#foleyRefreshTooltip").css("visibility", "visible");
    }, function(){
        $(this).animate({color:  "white"});
        $("#foleyRefreshTooltip").css("visibility", "hidden");
    });

    // display grid
    $("#gridButton").click(function(){
        $("#gridModal").slideToggle();
        initGrid();
        var originalColor = $(this).css("background-color");
        if (originalColor == "rgba(0, 0, 0, 0)"){
            $(this).animate({backgroundColor: "rgba(0, 0, 0, .3)"}, 300);
            $(this).css("background-color", "rgba(0, 0, 0, .3)");
        }
        else {
            $(this).animate({backgroundColor: "rgba(0, 0, 0, 0)"}, 300);
            $(this).css("background-color", "rgba(0, 0, 0, 0)");
        }
    });


    $(".grid-pad").click(function(){
        // light up pad and get its sound if it's not red
        var originalColor = $(this).css("background-color");
        if (originalColor != "rgb(255, 21, 0)"){

            // get the number of the pad clicked
            pad_number = $(this).attr("data-padNum");
            //get the current bank
            var selectedBank = $("#foleyBankOptions").val();
            // cut previous animation 
            $(this).stop(1,1);
            // get the selected audioTrack
            var selectedTrack;
            if (globalRecording){
                selectedTrack = $("#foleyAudioTrackOptions").val(); }
            else {
                selectedTrack = 0; }
            
            // get the even-numbered index of the bank and translate it to jsx to search foley bin 
            var bankIndex = (globalFoleyPads.indexOf($("#foleyBankOptions").val()))/2; 
            var cs = new CSInterface;	
            var padHasPath = cs.evalScript('$.runScript.playPadSound(' +
                    (pad_number-1) + ', ' +
                    bankIndex + ', '  +
                    selectedTrack + ' )', function(returnString) {
                try {
                    if (returnString != -1){
                        var audio = new Audio(returnString);
                        audio.play();
                    }

                } catch (error) {
                    alert(error);
                }
            });

            $(this).animate({backgroundColor: "#1cf4ff"}, 50);
            $(this).animate({backgroundColor: originalColor}, 500);
        }
    });
  
    function setBankOptions(bankName) { 
        var originallySelectedBank = $("#foleyBankOptions").val();

        //reset options for audiotrack list
        $("#foleyBankOptions").replaceWith(emptyBankList.clone());
        var cs = new CSInterface;	
        cs.evalScript('$.runScript.gridInit()', function(returnString) {
            try {
                var bankArray = returnString.split(',');
                globalFoleyPads = bankArray;
                
                //if the bank hasn't been set yet
                if (!originallySelectedBank){
                    originallySelectedBank = bankArray[0];
                }
                // get just the names (odd indexes) of the banks
                for (var i = 0; i < bankArray.length; i+=2) {
                    if (originallySelectedBank == bankArray[i]) {
                        $("#foleyBankOptions").append(new Option(bankArray[i], bankArray[i], true, true));
                    }
                    else {
                        $("#foleyBankOptions").append(new Option(bankArray[i], bankArray[i]));
                    }
                }
                // set the pads colors
                setPadsColor();
                
            } catch (error) {
                alert(error);
            }
        });
    }

    function setPadsColor(){
        var bankName = $("#foleyBankOptions").val();
        var bankSize = 0;
        if ( globalFoleyPads[globalFoleyPads.indexOf(bankName) + 1] ) {
            bankSize = globalFoleyPads[globalFoleyPads.indexOf(bankName) + 1];
        }

        // set green pads
        for (var i = 0; i < bankSize; i++){
            var thisPad = $(".grid-pad:eq(" + i + ")");
            thisPad.css("background-color", "#00c59c");
        }
    
        // set red pads
        for (var i = bankSize; i < 9; i++){
            var thisPad = $(".grid-pad:eq(" + i + ")");
            thisPad.css("background-color", "#ff1500");
        }
    }

    function setAudioTracks() {
        var originallySelectedTrack = $("#foleyAudioTrackOptions").val();
        
        //reset options for audiotrack list
        $("#foleyAudioTrackOptions").replaceWith(emptyTrackList.clone());
        var cs = new CSInterface;	
        cs.evalScript('$.runScript.countTracks()', function(returnString){
            try {
                var numTracks = 0;
                numTracks = JSON.parse(returnString);
                for (var i = 1; i < numTracks + 1; i++) {
                    if (originallySelectedTrack == i) {
                        $("#foleyAudioTrackOptions").append(new Option(i, i, true, true));
                    }
                    else {
                        $("#foleyAudioTrackOptions").append(new Option(i, i));
                    }
                }
            } catch (error) {
                alert(error);
            }
        });
    }

    function initGrid(){
        setAudioTracks();
        setBankOptions();
    }

});
