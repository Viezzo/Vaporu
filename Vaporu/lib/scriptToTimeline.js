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

    window.transcodesObject = {
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

    // reset button and its tooltip
    $("#csvFileUploaderReset").click(function(){
        window.transcodesObject.xlsheet = false;
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
        if (window.transcodesObject.xlsheet){
            var workbook = window.transcodesObject.xlsheet;
            var firstSheetName = workbook.SheetNames[0];
            var worksheet = workbook.Sheets[firstSheetName];
            var jsonObj = XLSX.utils.sheet_to_json(worksheet);

            console.log(jsonObj)

            var shots = [];
            for (row in jsonObj){
                if (jsonObj[row].PROPERTY.toLowerCase().includes("shot")){
                    var visualRow = jsonObj[parseInt(row) + 1];
                    var textRow = jsonObj[parseInt(row) + 2];
                    var newShotArray = createShotObject(visualRow, textRow)
                    for (newShot in newShotArray){
                        shots.push(newShotArray[newShot]);
                    }
                }
            }
            $('#scriptPreviewBox').find("tr").not("#previewTableHeader").remove();
            $('#scriptPreviewBox').css("display", "block");
            for (shot in shots){
                $('#scriptPreviewBox').append( 
                "<tr><td>" + shots[shot].visual + "</td>" + 
                "<td>" + shots[shot].startTime + "</td>" + 
                "<td>" + shots[shot].endTime + "</td>" + 
                "<td>" + shots[shot].text + "</td>" + 
                "<td>" + shots[shot].courtesy + "</td>" + 
                "<td>" + shots[shot].bold + "</td>" + 
                "<td>" + shots[shot].compilationNumber + "</td></tr>");
            }
        }
    });

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
                    var workbook = XLSX.read(data, {type: 'array'});
                    window.transcodesObject.xlsheet = workbook;
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

    function createShotObject(visualRow, TOSRow) {

        var finalShotArray = [];
        var visualsToConvert = [];
        var shotVisual;
        var startTime;
        var endTime;
        var boldWords;
        var compilationNumber;

        if (typeof visualRow.SCENE != "undefined"){
            // make an array containing all the visuals separated by a + sign
            var allVisualNames = visualRow.SCENE.split("\n");
            for (var visualName in allVisualNames){
                visualsToConvert.push(allVisualNames[visualName]);
            }
        }
        for (var i in visualsToConvert){
            if (typeof visualRow.SCENE != "undefined"){
                shotVisual = visualRow.SCENE.split("\n")[i];
                // parse timecodes
                var startTimecode = "";
                var endTimecode = "";
                if (typeof visualRow.IN != "undefined")
                    startTimecode = visualRow.IN.split("\n")[i];
                if (typeof visualRow.IN != "undefined")
                    endTimecode = visualRow.OUT.split("\n")[i];
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
                else { startTime = "N/A"; }

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
            else { shotVisual = "N/A"; startTime = "N/A"; endTime = "N/A"; }
            
            // get courtesy 
            var shotCourtesy;
            if (typeof visualRow.COURTESY != "undefined")
                shotCourtesy = visualRow.COURTESY;
            else 
                shotCourtesy = "N/A";
            // get text
            var shotText;
            if (typeof TOSRow.SCENE != "undefined"){
                shotText = TOSRow.SCENE; 
                var workbook = window.transcodesObject.xlsheet;
                var firstSheetName = workbook.SheetNames[0];
                var worksheet = workbook.Sheets[firstSheetName];
                var address_of_cell = "B" + "19";
                var desired_cell = worksheet[address_of_cell];
                var desired_value = (desired_cell ? desired_cell.v : undefined);

                console.log(desired_value)

                shotText = desired_value;
                
            }
            else
                shotText = "N/A";
            // get comp number
            if (typeof visualRow.COMPILATION_NUMBER != "undefined"){
                compilationNumber = visualRow.COMPILATION_NUMBER; 
            }
            else
                compilationNumber = "N/A";

            boldWords = 0;
            var newShot = new Shot(shotVisual, startTime, endTime, shotText, shotCourtesy, boldWords, compilationNumber);
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
