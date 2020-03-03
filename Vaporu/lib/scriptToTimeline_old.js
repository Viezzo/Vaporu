$(document).ready(function() {

    class Shot {
        constructor(v, st, et, t, c) {
            this.visual = v;
            this.startTime = st;
            this.endTime = et;
            this.text = t;
            this.courtesy = c;
        }
    }

    $("#scriptImporterButton").click(function(){
        $("#scriptImporterControls").slideToggle();
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

    // reset button and its tooltip
    $("#csvFileUploaderReset").click(function(){
        //$("#fileList").slideUp();
        //reset the file contents of previous CSV file, and of the file list
        $("#csvContents").text("");
        $("#csvFileList").css("display", "none");
        $("#csvFileList").text("");
        $(this).css("display", "none");
        $("#csvDragBoxText").css("display", "block");
    });
    $('[data-toggle="resetFilesTooltip"]').tooltip();
    $("#csvFileUploaderReset").hover(function () {
        $(this).animate({color: "#ff1500"}, 150);
    }, function(){
        $(this).animate({color: "#424242"});
    });

    // for user to upload file using file explorer
    $("#csvUploadInput").change(function(e){
        var fileName = e.target.files[0].name;
        var fileNameArray = fileName.split(".");
        if (fileNameArray[fileNameArray.length - 1].toLowerCase() == "csv" ) {
            var reader = new FileReader();
            reader.onload = function () {
                $("#csvContents").text(reader.result);
                $("#csvFileList").css("display", "inline");
                $("#csvFileList").prepend($("<li>").append(fileName));
            };
            // start reading the file. When it is done, calls the onload event defined above.
            reader.readAsText(e.target.files[0]);
            $("#csvFileUploaderReset").css("display", "inline");
            $("#csvDragBoxText").css("display", "none");
        }
        else {
            var cs = new CSInterface;	
            cs.evalScript('$.runScript.premiereAlert("That\'s not a CSV file. Please upload a valid file." )');
        }
    });
    $("#csvUploadLink").on('click', function(e){
        e.preventDefault();
        $("#csvUploadInput:hidden").trigger('click');
    });

    // file drag and dropper
    $('#csvHolder').on({
        'dragover': function(e) {
            e.preventDefault();
            e.stopPropagation();
            //$(this).animate({backgroundColor: "#ffffff"}, 100);
        }, 

        'drop': function(e) {
            var csvContents = extractFileData(e);
        }
    });

    $("#csvParser").click(function(){
        sendShotstoPremiere($("#csvContents").text());
    });

    function extractFileData(e){
        var dataTransfer =  e.originalEvent.dataTransfer;
        if( dataTransfer && dataTransfer.files.length) {
            e.preventDefault();
            e.stopPropagation();
            // go through all uploaded files, but set #csvContents to the top file
            $.each( dataTransfer.files, function(i, file) {
                var fileNameArray = (file.name).split(".");
                if (fileNameArray[fileNameArray.length - 1].toLowerCase() == "csv" ) {
                    var reader = new FileReader();
                    reader.onload = $.proxy(function(file, $fileList, event) {
                        $("#csvContents").text(event.target.result);
                        $("#csvFileList").css("display", "inline");
                        //var img = file.type.match('image.*') ? "<img src='" + event.target.result + "' /> " : "";
                        $fileList.prepend( $("<li>").append(file.name));
                    }, this, file, $("#csvFileList"));
                    reader.readAsText(file);
                    $("#csvFileUploaderReset").css("display", "inline");
                    $("#csvDragBoxText").css("display", "none");
                }
                else {
                    var cs = new CSInterface;	
                    cs.evalScript('$.runScript.premiereAlert("That\'s not a CSV file. Please upload a valid file." )');
                }
            });
        }
    }

    function createShotObject (inputShotCell) {

        var finalShotArray = [];
        var shotDetails = inputShotCell.split(",");
        var visualsToConvert = [];
        var shotVisual;
        var startTime;
        var endTime;

        if (shotDetails[1]){
            // make an array containing all the visuals separated by a + sign
            var allVisualNames = shotDetails[1].split("+ ");
            for (var visualName in allVisualNames){
                visualsToConvert.push(allVisualNames[visualName]);
            }
        }

        for (var i in visualsToConvert){
            //alert(shotDetails[i]);
            if (shotDetails[1]){
                //separate on the last parenthesis
                var visualAndTimeArray = visualsToConvert[i].split(' (');
                var visString = visualAndTimeArray[0];
                //if more than one " (" in the visual string, concatenate the first ones
                for (j = 1; j < visualAndTimeArray.length - 1; j++){
                    visString += " (" + visualAndTimeArray[j];
                }
                shotVisual = visString;

                // parse timecodes
                var initialTimeCode = "";
                var timecodeIsValid;
                if (visualAndTimeArray.length == 1){
                    timecodeIsValid = false;
                    visualAndTimeArray.push("");
                }
                else if (visualAndTimeArray.length > 1){
                    initialTimeCode = visualAndTimeArray[visualAndTimeArray.length - 1].split(")")[0];
                }
                var regex = /^[0-9:\-]/;
                timecodeIsValid = regex.test(initialTimeCode);

                // check if there's a ) to split on and if so, take the first part of the string
                if (timecodeIsValid){
                    var timeCodeArray = initialTimeCode.split("-");
                    // if producer just set start to "0"
                    if (timeCodeArray[0] == "0"){
                        startTime = "00:00";
                    }
                    // if they started the timecode with no leading zeros, add them
                    else if (timeCodeArray[0].substring(0,1) == ':') {
                        startTime = "00" + timeCodeArray[0];
                    }
                    else {
                        startTime = timeCodeArray[0];
                    }
                    // if end time starts with no leading zeros, add them
                    if (timeCodeArray[0].substring(0,1) == ':') {
                        endTime = "00" + timeCodeArray[1];
                    }
                    else {
                        endTime = timeCodeArray[1];
                    }
                }
                else { startTime = "NULLSTARTTIME"; endTime = "NULLENDTIME"; }
            }
            else { shotVisual = "NULLVISUAL"; startTime = "NULLTIMECODE"; endTime = "NULLTIMECODE"; }
            
            // get courtesy 
            var shotCourtesy;
            if (shotDetails[2]){ shotCourtesy = shotDetails[2];  }
            else { shotCourtesy = "NULLCOURTESY";  }

            // get text. to find it, first offset by the number of separating commas
            var numberOfCommas = 0;
            for (i = inputShotCell.length - 1; i >= 0; i--){
                if (inputShotCell[i] == ","){
                    numberOfCommas++;
                }
                else if (inputShotCell[i] == "\n" || inputShotCell[i] == "\r"){
                    continue;
                }
                else {
                    break;
                }
            }
            //default to 3 if no comma separators found
            if (numberOfCommas == 0){
                numberOfCommas = 3;
            }
            //alert(numberOfCommas);
            var shotText;
            if (shotDetails[numberOfCommas + 1]){
                // if the CSV starts with quotes at the beginning, there are commas. Get the full string
                if (shotDetails[numberOfCommas + 1].substring(0,1) == '"') {
                    // concatenate the rest of the string
                    var fullString = shotDetails[numberOfCommas + 1].substring(1);
                    // starting from the comma-split right after shotDetails[4], re-add a comma and concat
                    for (j = numberOfCommas + 2; j < (shotDetails.length); j++){
                        fullString += "," + shotDetails[j];
                    }
                    // the original full string was terminated with a " sign. Get only what's before that terminator
                    shotText = fullString.split('"')[0];
                }
                else {
                    shotText = shotDetails[numberOfCommas + 1]; }
            }
            else { shotText = "NULLTEXT"; }

            var newShot = new Shot(shotVisual, startTime, endTime, shotText, shotCourtesy);

            finalShotArray.push(newShot);
        }

        return finalShotArray;
    }

    function sendShotstoPremiere(csvInput){
        // create master array with all cell splits on ',,,'
        var shotsArray = csvInput.split("Visual (timestamp");
        var shotObjects = [];
        for (i = 0; i < shotsArray.length; i++){
            // make another array for each Visual cell, and make an object out of it
            if (shotsArray[i].startsWith("):")){
                // get an array of Shot objects back, and add each one to shotObjects array
                var newShotObjectArray = createShotObject(shotsArray[i]);
                for (j = 0; j < newShotObjectArray.length; j++){
                     shotObjects.push(newShotObjectArray[j]);
                }
            }
        }
        var cs = new CSInterface;	
        var cs = new CSInterface;	
        cs.evalScript('$.runScript.resetSequenceBuilder()');
        //for (i = 0; i < 4; i++){
        for (i = 0; i < (shotObjects.length); i++){
            // send object to JSX to insert
            var a = shotObjects[i].visual;
            var b = shotObjects[i].startTime;
            var c = shotObjects[i].endTime;
            var d = shotObjects[i].text;
            var e = shotObjects[i].courtesy;
            //check for newlines and quotes and remove them
            a = a.replace(/[\r\n]+/g, ' ').replace(/["]+/g, '').replace(/['']+/g, "\'");
            d = d.replace(/[\r\n]+/g, ' ').replace(/["]+/g, '').replace(/['']+/g, "\'");
            e = e.replace(/[\r\n]+/g, ' ').replace(/["]+/g, '').replace(/['']+/g, "\'");
            var mode2 = $('#mode2').is(":checked");
            var mode3 = $('#mode3').is(":checked");
            
            //alert(a + " " + b + " " + c + " " + d + " " + e + " " + i);

            cs.evalScript('$.runScript.insertVisual('
            + '"' + a + '"' + ','
            + '"' + b + '"' + ','
            + '"' + c + '"' + ','
            + '"' + d + '"' + ','
            + '"' + e + '"' + ','
            + '"' + mode2 + '"' + ','
            + '"' + mode3 + '"' + ')', function(returnString) {
                try {

                } catch (error) {
                    alert(error);
                }
            });
        }
    }
    
});
