$(document).ready(function() {

    class Shot {
        constructor(v, st, et, t, c, b, cn) {
            this.visual = v;
            this.startTime = st;
            this.endTime = et;
            this.text = t;
            this.courtesy = c;
            this.bold = b;
            this.compilationNumber = cn;
        }
    }

    window.xlSheetData = {
        xlsheet : false
    };

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

    $("#boldColorSquare").click(function(){
        if ($("#boldColorPicker").css('display') == 'none'){
            window.setTimeout (function(){ 
                $("#boldHexValue").select(); 
             },100);
        }
        $("#boldColorPicker").slideToggle();
    });

    $("#boldHexValue").click(function(){
        $("#boldHexValue").select(); 
    });

    $("#boldHexValue").change(function(){
        var hexRegex = /^#([0-9a-f]{6}|[0-9a-f]{3})$/i;
        if (!$(this).val().startsWith('#')) {
            var originalVal = $(this).val();
            $(this).val("#" + originalVal);
        }
        if ($(this).val().match(hexRegex))
            $("#boldColorSquare").css('backgroundColor', $(this).val())
    });

    // reset button and its tooltip
    $("#csvFileUploaderReset").click(function(){
        window.xlSheetData.xlsheet = false;
        //$("#fileList").slideUp();
        //reset the file contents of previous CSV file, and of the file list
        $("#csvContents").text("");
        $("#csvFileList").css("display", "none");
        $("#csvFileList").text("");
        $(this).css("display", "none");
        $("#csvDragBoxText").css("display", "block");
        $("#scriptPreviewButtonHolder").css("display", "none");
        //reset preview
        $('#scriptPreviewBox').find("tr").not("#previewTableHeader").remove();
        $('#scriptPreviewBox').css("display", "none");
    });

    $('[data-toggle="resetFilesTooltip"]').tooltip();

    $("#csvFileUploaderReset").hover(function () {
        $(this).animate({color: "#ff1500"}, 150);
    }, function(){
        $(this).animate({color: "#424242"});
    });

    // parsing button clicks
    $("#csvParser").click(function(){
        sendShotstoPremiere($("#csvParser").text());
    });

    $("#scriptPreviewButton").click(function(){
        if (window.xlSheetData.xlsheet){
            var shots;
            try {
                shots = makeShotsFromXlsx();
            } catch (error) {
                alert("Error parsing the XLSX file: " + error)
                return 0;
            }

            $('#scriptPreviewBox').find("tr").not("#previewTableHeader").remove();
            $('#scriptPreviewBox').css("display", "block");
            for (shot in shots){
                var v = shots[shot].visual == "N/A" ? "" : shots[shot].visual;
                var st = shots[shot].startTime == "NULLSTARTTIME" ? "" : shots[shot].startTime;
                var et = shots[shot].endTime == "N/A" ? "" : shots[shot].endTime;
                var t = shots[shot].text == "NULLTEXT" ? "" : shots[shot].text;
                var c = shots[shot].courtesy == "NULLCOURTESY" ? "" : shots[shot].courtesy;
                var b = shots[shot].bold == "0" ? "" : shots[shot].bold;
                var cn = shots[shot].compilationNumber == "N/A" ? "" : shots[shot].compilationNumber;
                var lightClass = "";
                if (shot % 2 == 1)
                    lightClass = " class='lighterTD'"

                $('#scriptPreviewBox').append( 
                "<tr" + lightClass + "><td>" + v + "</td>" + 
                "<td>" + st + "</td>" + 
                "<td>" + et + "</td>" + 
                "<td>" + t + "</td>" + 
                "<td>" + c + "</td>" + 
                "<td>" + b + "</td>" + 
                "<td>" + cn + "</td></tr>");
            }
        }
    });


    function makeShotsFromXlsx(){
        var workbook = window.xlSheetData.xlsheet;
        var firstSheetName = workbook.SheetNames[0];
        var worksheet = workbook.Sheets[firstSheetName];
        var jsonObj = XLSX.utils.sheet_to_json(worksheet);

        var shots = [];
        var regex = /Shot\s[0-9]*/; // find rows formatted with "Shot 1", "Shot 29", etc
        var visualRowLabel = "Visual | Timecodes";
        var textRowLabel = "Overlay text (optional):"
        for (row in jsonObj){
            if (typeof jsonObj[row].PROPERTY == 'string'){
            // if this is a row that's labeled HOOK SHOT or "Shot 1", etc, we're looking at a shot construction.
                if (jsonObj[row].PROPERTY.trim().match(regex) || jsonObj[row].PROPERTY.trim() == "HOOK SHOT"){
                    var visualRowsInThisShot = []   //the next row starts the visuals, but there can be more than one.
                    var firstRowNumber = parseInt(row) + 1;
                    var theTextRow;
                    for (rowNumber = firstRowNumber; rowNumber < firstRowNumber + 100; rowNumber++){    //max number of visuals in a shot is 100
                        if (typeof jsonObj[rowNumber] != 'undefined') {   //row exists. Is it a visual? 
                            if (jsonObj[rowNumber].PROPERTY.trim() == visualRowLabel) 
                                visualRowsInThisShot.push(jsonObj[rowNumber]);
                            else if (jsonObj[rowNumber].PROPERTY.trim() == textRowLabel) { // if this is a text row, stop finding new visuals
                                theTextRow = jsonObj[rowNumber];
                                break;
                            }
                            else {
                                theTextRow = "";
                                break;
                            }
                        }                            
                    }
                    for (visualItem in visualRowsInThisShot) {
                        var htmlText = "";
                        var thisRow = theTextRow.__rowNum__ + 1;
                        var address_of_cell = "B" + thisRow;
                        var text_cell = worksheet[address_of_cell];
                        //console.log(text_cell)

                        var text_value = (text_cell ? text_cell.h : undefined);
                        if (text_value) 
                            htmlText = text_value;

                        var newShot = createShotObject(visualRowsInThisShot[visualItem], theTextRow, htmlText);
                        shots.push(newShot);
                    }
                }
            }
        }
        return shots;
    }

    // for user to upload file using file explorer
    $("#csvUploadInput").change(function(e){
        extractFileData(e);
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
        }, 
        'drop': function(e) {
            var csvContents = extractFileData(e);
        }
    });

    function extractFileData(e){
        var dataTransfer =  e.originalEvent.dataTransfer;
        if( dataTransfer && dataTransfer.files.length) {
            e.preventDefault();
            e.stopPropagation();
            var file = dataTransfer.files[0];
            var fileNameArray = (file.name).split(".");
            if (fileNameArray[fileNameArray.length - 1].toLowerCase() == "xlsx" ) {
                var reader = new FileReader();
                reader.onload = function(e) {
                    // code from sheetJS documentation
                    var data = new Uint8Array(reader.result);
                    var workbook = XLSX.read(data, {type: 'array', cellStyles: true});
                    window.xlSheetData.xlsheet = workbook;
                    $("#csvFileList").css("display", "inline");
                    $("#csvFileList").append("<li>" + file.name + "</li>")
                }
                reader.readAsArrayBuffer(file);
                $("#csvFileUploaderReset").css("display", "inline");
                $("#csvDragBoxText").css("display", "none");
                $("#scriptPreviewButtonHolder").css("display", "block");
            }
            else {
                var cs = new CSInterface;	
                cs.evalScript('$.runScript.premiereAlert("That\'s not a XLSX file. Please upload a valid file." )');
            }
        }
    }

    function createShotObject(visualRow, TOSRow, htmlText) {
        var shotVisual;
        var startTime;
        var endTime;
        var boldWords;
        var compilationNumber;

        // go through all visuals that were separated by a newline
        if (typeof visualRow.SCENE != "undefined"){
            shotVisual = visualRow.SCENE;
            // parse timecodes
            var startTimecode = "";
            var endTimecode = "";
            if (typeof visualRow.IN != "undefined")
                startTimecode = visualRow.IN;
            if (typeof visualRow.OUT != "undefined")
                endTimecode = visualRow.OUT;
            var regex = /^[0-9:]/;
            var startTimecodeIsValid = regex.test(startTimecode);
            var endTimecodeIsValid = regex.test(endTimecode);

            if (startTimecodeIsValid){
                // if producer just set start to "0"
                if (startTimecode == "0")
                    startTime = "00:00";
                // if they started the timecode with no leading zeros, add them
                else if (startTimecode.toString().substring(0,1) == ':') 
                    startTime = "00" + startTimecode;
                else
                    startTime = startTimecode;
            }
            else { startTime = "NULLSTARTTIME"; }

            if (endTimecodeIsValid){
                // if producer just set start to "0"
                if (endTimecode == "0")
                    endTime = "00:00";
                // if end time starts with no leading zeros, add them
                if (endTimecode.toString().substring(0,1) == ':') 
                    endTime = "00" + endTimecode;
                else 
                    endTime = endTimecode;
            }
            else { endTime = "N/A"; }
        }
        else { shotVisual = "N/A"; startTime = "NULLSTARTTIME"; endTime = "N/A"; }
        
        // get courtesy 
        var shotCourtesy;
        if (typeof visualRow.COURTESY != "undefined")
            shotCourtesy = visualRow.COURTESY;
        else 
            shotCourtesy = "NULLCOURTESY";
        // get text
        var shotText;
        if (typeof TOSRow.SCENE != "undefined"){
            shotText = TOSRow.SCENE; 
            
        }
        else
            shotText = "NULLTEXT";
        // get comp number
        if (typeof visualRow.COMPILATION_NUMBER != "undefined"){
            compilationNumber = visualRow.COMPILATION_NUMBER; 
        }
        else
            compilationNumber = "N/A";

        boldWords = getBoldWordIndexes(htmlText).join(',');
        var newShot = new Shot(shotVisual, startTime, endTime, shotText, shotCourtesy, boldWords, compilationNumber);
        
        return newShot;
    }

    function getBoldWordIndexes(htmlText) {
        var boldIndexes = [];
        var modifiedText = htmlText.replace(/span style/g, 'span_style')
        var allWords = modifiedText.split(" ");
        currentlyBold = false;
        for (i = 0; i < allWords.length; i++){
            if (allWords[i].startsWith('<span_style=""><b>'))
                currentlyBold = true; // start bold 
            if (allWords[i].startsWith('</b></span>'))
                currentlyBold = false; // bold ends before current word 
            if (currentlyBold == true)
                boldIndexes.push(i + 1);
            if (allWords[i].endsWith('</b></span>'))
                currentlyBold = false; //end bold
            if (allWords[i].endsWith('<span_style=""><b>'))
                currentlyBold = true; //next word is bold
        }
        return boldIndexes;
    }

    function sendShotstoPremiere(csvInput){
        if (window.xlSheetData.xlsheet){
            var shotObjects;
            try {
                shotObjects = makeShotsFromXlsx();
            } catch (error) {
                alert("Error parsing the XLSX file: " + error)
                return 0;
            }

            var cs = new CSInterface;	
            cs.evalScript('$.runScript.resetSequenceBuilder()');

            var successArray = [];
            var errorArray = [];
            // for (i = 0; i < 4; i++){
            for (i = 0; i < (shotObjects.length); i++){
                // send object to JSX to insert
                var a = shotObjects[i].visual;
                var b = shotObjects[i].startTime;
                var c = shotObjects[i].endTime;
                var d = shotObjects[i].text;
                var e = shotObjects[i].courtesy;
                var f = shotObjects[i].bold;
                var g = shotObjects[i].compilationNumber;
                //check for newlines and quotes and remove them
                a = a.replace(/[\r\n]+/g, ' ').replace(/["]+/g, '').replace(/['']+/g, "\'");
                d = d.replace(/[\r\n]+/g, ' ').replace(/["]+/g, '').replace(/['']+/g, "\'");
                e = e.replace(/[\r\n]+/g, ' ').replace(/["]+/g, '').replace(/['']+/g, "\'");
                var mode2 = $('#mode2').is(":checked");
                var mode3 = $('#mode3').is(":checked");
                var mode4 = $('#mode4').is(":checked");
                var boldColor = $("#boldColorSquare").css('backgroundColor');  

                cs.evalScript('$.runScript.insertVisualFromXLSX('
                + '"' + a + '"' + ','
                + '"' + b + '"' + ','
                + '"' + c + '"' + ','
                + '"' + d + '"' + ','
                + '"' + e + '"' + ','
                + '"' + f + '"' + ','
                + '"' + g + '"' + ','
                + '"' + mode2 + '"' + ','
                + '"' + mode3 + '"' + ','
                + '"' + mode4 + '"' + ','
                + '"' + boldColor + '"' + ')', function(returnString) {
                    try {
                        if (typeof returnString == 'undefined')
                            successArray.push('Unknown error on shot ' + (successArray.length + errorArray.length + 1) + ' of ' + shotObjects.length)
                        else
                            successArray.push(returnString + ' on shot ' + (successArray.length + errorArray.length + 1) + ' of ' + shotObjects.length);
                        //if we're on the last added shot
                        if (successArray.length + errorArray.length == shotObjects.length - 1){
                            var errorString = 'Error processing these shots: \n';
                            for (j = 0; j < (successArray.length); j++){
                                if (!successArray[j].startsWith('success'))
                                    errorString += '- ' + successArray[j] + "\n";
                            }
                            if (errorArray.length > 0) //there were errors here
                                errorString += ' More errors: ' + errorArray.join(',');
                            
                            if (errorString != 'Error processing these shots: \n')              
                                alert(errorString);

                            //alert(successArray.length + ', ' +  errorArray.length + ', ' +  shotObjects.length - 1)
                        }
                    } catch (error) {
                        errorArray.push(error);
                        //if we're on the last added shot
                        if (successArray.length + errorArray.length == shotObjects.length - 1){
                            alert(successArray.join(',') + ' || ') + errorArray.join(',');                        
                        }
                    }
                });
            }
        }
    }
    
});
