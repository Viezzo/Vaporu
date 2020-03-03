$(document).ready(function() {

    $("#MOGRTToSRT").click(function(){
        
        var cs = new CSInterface;	
        cs.evalScript('$.runScript.convertMOGRTToSRT()');
    });

    $("#srtToMOGRT").click(function(){
        var textAndTimecodes = parseToMOGRT($("#srtContents").text());
        var includeMarkers = $('#addCaptionWarnings').is(":checked");

        if (textAndTimecodes.length == 4){
            // create file and download it to path
            var textArrray = textAndTimecodes[0];
            var startTimecodesArray = textAndTimecodes[1];
            var endTimecodesArray = textAndTimecodes[2];
            var widthArray = textAndTimecodes[3];

            var cs = new CSInterface;	
            cs.evalScript('$.runScript.convertCaptionsToMOGRT('
                + JSON.stringify(textArrray)
                + ', ' + JSON.stringify(startTimecodesArray)
                + ', ' + JSON.stringify(endTimecodesArray)
                + ', ' + JSON.stringify(widthArray)
                + ', ' + JSON.stringify(includeMarkers)
                + ' )', function(returnString) {
                try {
                    
                }
                catch (error) {
                    alert(error);
                }
            });
        }

    });

    $("#srtParser").click(function(){
        var fileText = addLineBreaks($("#srtContents").text());
        // create file and download it to path
        var filecontents = fileText;
        var filename = $("#srtFileList").find("li").first().text().split(".srt")[0];
        if (!filename){
            filename = "converted_captions";
        }
        var cs = new CSInterface;	
        cs.evalScript('$.runScript.saveSRT(' + JSON.stringify(filename) + ', ' + JSON.stringify(filecontents) + ' )', function(returnString) {
            try {
                if (returnString != "NULL"){
                    if ($("#importCaptions").is(":checked")){
                        cs.evalScript('$.runScript.importSRT(' + JSON.stringify(returnString) + ' )'); 
                    }
                }
                
            } catch (error) {
                alert(error);
            }
        });
    });

    $("#srtImporterButton").click(function(){
        $("#srtImporterControls").slideToggle();
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

    // for user to upload file using file explorer
    $("#srtUploadInput").change(function(e){
        var fileName = e.target.files[0].name;
        var fileNameArray = fileName.split(".");
        if (fileNameArray[fileNameArray.length - 1].toLowerCase() == "srt" ) {
            var reader = new FileReader();
            reader.onload = function () {
                $("#srtContents").text(reader.result);
                $("#srtFileList").css("display", "inline");
                $("#srtFileList").prepend($("<li>").append(fileName));
            };
            // start reading the file. When it is done, calls the onload event defined above.
            reader.readAsText(e.target.files[0]);
            $("#srtFileUploaderReset").css("display", "inline");
            $("#srtDragBoxText").css("display", "none");
        }
        else {
            var cs = new CSInterface;	
            cs.evalScript('$.runScript.premiereAlert("That\'s not an SRT file. Please upload a valid file." )');
        }
    });
    $("#srtUploadLink").on('click', function(e){
        e.preventDefault();
        $("#srtUploadInput:hidden").trigger('click');
    });

    // file drag and dropper
    $('#srtHolder').on({
        'dragover': function(e) {
            e.preventDefault();
            e.stopPropagation();
            //$(this).animate({backgroundColor: "#ffffff"}, 100);
        }, 
        'drop': function(e) {
            var srtContents = extractFileData(e);
        }
    });

    // reset button and its tooltip
    $("#srtFileUploaderReset").click(function(){
        //reset the file contents of previous SRT file, and of the file list
        $("#srtContents").text("");
        $("#srtFileList").css("display", "none");
        $("#srtFileList").text("");
        $(this).css("display", "none");
        $("#srtDragBoxText").css("display", "block");
    });
    $('[data-toggle="resetFilesTooltip"]').tooltip();
    $("#srtFileUploaderReset").hover(function () {
        $(this).animate({color: "#ff1500"}, 150);
    }, function(){
        $(this).animate({color: "#424242"});
    });

    function extractFileData(e){
        var dataTransfer =  e.originalEvent.dataTransfer;
        if( dataTransfer && dataTransfer.files.length) {
            e.preventDefault();
            e.stopPropagation();
            // go through all uploaded files, but set #srtContents to the top file
            $.each( dataTransfer.files, function(i, file) {
                var fileNameArray = (file.name).split(".");
                if (fileNameArray[fileNameArray.length - 1].toLowerCase() == "srt" ) {
                    var reader = new FileReader();
                    reader.onload = $.proxy(function(file, $fileList, event) {
                        $("#srtContents").text(event.target.result);
                        $("#srtFileList").css("display", "inline");
                        $fileList.prepend( $("<li>").append(file.name));
                    }, this, file, $("#srtFileList"));
                    reader.readAsText(file);
                    $("#srtFileUploaderReset").css("display", "inline");
                    $("#srtDragBoxText").css("display", "none");
                }
                else {
                    var cs = new CSInterface;	
                    cs.evalScript('$.runScript.premiereAlert("That\'s not an SRT file. Please upload a valid file." )');
                }
            });
        }
    }

    function addLineBreaks(srtText){
        // separate by lines
        var allCaptions = srtText.split(/[\r\n][0-9]+[\r\n]/gm);
        var finalText = "";
        for (i = 0; i < allCaptions.length; i++){

            var timeAndText = allCaptions[i].split("\r\n");
            //remove the first item for the first instance
            if (i == 0){
                timeAndText.shift();
            }
            var timestamp = timeAndText[0];
            var combinedText = "";
            for (j = 1; j < timeAndText.length; j++){
                combinedText += (timeAndText[j].replace(/[\r\n]+/g, ' ') + " ");
            }
            combinedText = combinedText.replace("  ", " ")
            // get the width of the line in pixels
            $("#hiddenText").text(combinedText);
            var formattedText = "";
            var fullLineWidth = $("#hiddenText").width();
            //var maxLineWidth = 155;
            var maxLineWidth = 155;

            var howManyLines = Math.ceil(fullLineWidth / maxLineWidth);
            //don't do an odd number of lines
            if (howManyLines % 3 == 0){
                howManyLines += 1;
            }

            var finalCaptionsArray = [];

            if (fullLineWidth > maxLineWidth) {
                var words = combinedText.split(" ");
                for (j = 0; j < words.length; j++){
                    var nextLine = formattedText + " " + words[j];
                    $("#hiddenText").text(formattedText);
                    var thisLineWidth = $("#hiddenText").width();
                    $("#hiddenText").text(nextLine);
                    var nextLineWidth = $("#hiddenText").width();
                    //calculate offset (distance from midpoint of text)
                    lengthDifference1 = Math.abs(fullLineWidth/2 - thisLineWidth);
                    lengthDifference2 = Math.abs(fullLineWidth/2 - nextLineWidth);
                    // if we reached the word in the middle of the length
                    if (thisLineWidth < fullLineWidth/2 && nextLineWidth > fullLineWidth/2) {
                        //alert(words[j]);
                        // if less space is used to insert newline before word
                        if (lengthDifference1 < lengthDifference2) {
                            formattedText += ("\r\n" + words[j] + " ");
                        }
                        else {
                            formattedText += (words[j] + "\r\n");
                        }
                    }
                    // if both sides are exactly the same size
                    else if (thisLineWidth == fullLineWidth/2){
                        formattedText += ("\r\n" + words[j] + " ");
                    }
                    else {
                        formattedText += words[j];
                        // add a space to separate words
                        if (j != words.length - 1) {
                            formattedText += " ";
                        }
                    }
                }
            }
            else {
                formattedText = combinedText;
            }
            //concatenate, remove trailing whitespace
            if (i == 0){
                finalText += (i + 1) + "\r\n" + timestamp + "\r\n" + formattedText.trim();
            }
            else {
                finalText += (i + 1) + timestamp + "\r\n" + formattedText.trim();
            }
            // to ensure there are only two newline characters at the end of file. Otherwise, file import error
            if (i == allCaptions.length - 1){
                finalText += "\r\n";
            }
            else {
                finalText += "\r\n\r\n";
            }
        }
        return finalText;
    }

    // AE uses a different algorithm that might change where line breaks are. Run it through that first.
    function AEtextParse(inputText){
        // change these default values if they don't match the AE caption MOGRT comp
        var midpointOffset = 0;
        var maxLineLength = 28;
        var formattedText = "";
        var fullLineWidth = inputText.length;
        var howManyLines = 2;

        var theText = inputText.replace(/[\r\n]+/g, ' ').replace("  ", " ");

        if (fullLineWidth > maxLineLength) {
            var words = (theText).split(" ");
            for (j = 0; j < words.length; j++){
                var nextLine = formattedText + " " + words[j];
                var thisLineWidth = formattedText.length;
                var nextLineWidth = nextLine.length;
                //calculate offset (distance from midpoint of text)
                lengthDifference1 = Math.abs(fullLineWidth/howManyLines - thisLineWidth);
                lengthDifference2 = Math.abs(fullLineWidth/howManyLines - nextLineWidth);
                // if we reached the word in the middle of the length
                if (thisLineWidth < fullLineWidth/howManyLines + midpointOffset && nextLineWidth > fullLineWidth/howManyLines + midpointOffset) {
                    // if less space is used to insert newline before word
                    if (lengthDifference1 < lengthDifference2) {
                        formattedText += ("\n" + words[j] + " ");
                    }
                    else {
                        formattedText += (words[j] + "\n");
                    }
                }
                // if both sides are exactly the same size
                else if (thisLineWidth == fullLineWidth/howManyLines){
                    formattedText += ("\n" + words[j] + " ");
                }
                else {
                    formattedText += words[j];
                    // add a space to separate words
                    if (j != words.length - 1) {
                        formattedText += " ";
                    }
                }
            }
        }
        else {
            formattedText = theText;
        }
        return formattedText;
    }


    function parseToMOGRT(srtText){
        var textArray = [];
        var startTimesArray = [];
        var endTimesArray = [];
        var widthArray = []
        // separate by lines
        var allCaptions = srtText.split(/[\r\n][0-9]+[\r\n]/gm);
        for (i = 0; i < allCaptions.length; i++){
            var timeAndText = allCaptions[i].split("\r\n");
            //remove the first item for the first instance
            if (i == 0){
                timeAndText.shift();
            }
            var timestamp = timeAndText[0];
            var combinedText = "";
            for (j = 1; j < timeAndText.length; j++){
                combinedText += (timeAndText[j].replace(/[\r\n]+/g, ' ') + " ");
            }
            combinedText = combinedText.replace("  ", " ")

            // add the text to the array
            textArray.push(combinedText.replace(/["]+/g, '\"').replace(/[']+/g, "\'").trim());

            var htmlCaptions = AEtextParse(combinedText.trim()).split("\n");
            var thisCaptionWidth = 0;
            // check each line of the text and log the longest one
            for (j = 0; j < htmlCaptions.length; j++){
                $("#hiddenText").text(htmlCaptions[j]);
                if ($("#hiddenText").width() > thisCaptionWidth){
                    thisCaptionWidth = $("#hiddenText").width();
                }
            }
            widthArray.push(thisCaptionWidth);

            // parse start and end timecodes to seconds
            var separateTimeCodes = timestamp.split(" --> ");
            if (separateTimeCodes.length == 2){
                startTimeCode = separateTimeCodes[0];
                endTimeCode = separateTimeCodes[1];

                // separate the milliseconds
                var startSecondsAndMs = startTimeCode.split(",");
                var endSecondsAndMs = endTimeCode.split(",");

                if (startSecondsAndMs.length == 2 && endSecondsAndMs.length == 2){
                    var startSeconds = startSecondsAndMs[0].split(":");
                    var endSeconds = endSecondsAndMs[0].split(":");
                    // parse the seconds
                    if (startSeconds.length == 3 && endSeconds.length == 3){
                        var totalStartSeconds = 0;
                        var totalEndSeconds = 0;
                        // add hours, minutes, seconds, then milliseconds to total
                        totalStartSeconds += parseInt(startSeconds[0]) * 3600;
                        totalStartSeconds += parseInt(startSeconds[1]) * 60;
                        totalStartSeconds += parseInt(startSeconds[2]);
                        var finalStartSeconds = totalStartSeconds + "." + startSecondsAndMs[1];

                        totalEndSeconds += parseInt(endSeconds[0]) * 3600;
                        totalEndSeconds += parseInt(endSeconds[1]) * 60;
                        totalEndSeconds += parseInt(endSeconds[2]);
                        var finalEndSeconds = totalEndSeconds + "." + endSecondsAndMs[1];

                        startTimesArray.push(finalStartSeconds);
                        endTimesArray.push(finalEndSeconds);
                    }
                }

                // add the start and end times to the array
            }
    
        }
        return [textArray, startTimesArray, endTimesArray, widthArray];
    }

});
