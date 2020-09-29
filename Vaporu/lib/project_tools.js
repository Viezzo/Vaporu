$(document).ready(function() {

    $("#projectToolsButton").click(function(){

        $("#projectToolsControls").slideToggle();
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

    $("#generateReportButton").click(function(){
        var cs = new CSInterface;
        cs.evalScript('$.runScript.generateProjectReport()');
    });

    $("#clearCacheButton").click(function(){
        var cs = new CSInterface;
        cs.evalScript('$.runScript.clearCache()');
    });

    $("#relinkFilesButton").click(function(){
        var isProxy = $("#replaceProxyOptions").val() == "1" ? false : true;
        var cs = new CSInterface;
        cs.evalScript('$.runScript.relinkSelectedFiles(' + isProxy + ')');
    });

    $("#renameFilesButton").click(function(){
        var cs = new CSInterface;
        
        var isClips = $("#renameFilesOrClips").val() == "1" ? true : false;
        var renameBy = $("#renameByOptions").val();

        var csv = $("#renameCsvContents").text();
        if (renameBy < 3 && csv.length == 0){
            var err = "Upload a CSV to use this option. Ask Adrian if you need help.";
            cs.evalScript('$.runScript.premiereAlert(' + JSON.stringify(err) + ')');
        }
        else
            cs.evalScript('$.runScript.renameSelectedFiles(' + isClips + ', ' + renameBy + ', ' + JSON.stringify(csv) + ')');
    });

    $("#renameByOptions").change(function(){
        if ($("#renameByOptions").val() == "1" || $("#renameByOptions").val() == "2")
            $("#renameCsvHolder").slideDown();
        else
            $("#renameCsvHolder").slideUp();
    });

    // reset button and its tooltip
    $("#renameCsvFileUploaderReset").click(function(){
        //reset the file contents of previous CSV file, and of the file list
        $("#renameCsvContents").text("");
        $("#renameCsvFileList").css("display", "none");
        $("#renameCsvFileList").text("");
        $(this).css("display", "none");
        $("#renameCsvDragBoxText").css("display", "block");
    });
    $('[data-toggle="resetFilesTooltip"]').tooltip();
    $("#renameCsvFileUploaderReset").hover(function () {
        $(this).animate({color: "#ff1500"}, 150);
    }, function(){
        $(this).animate({color: "#424242"});
    });

    // for user to upload file using file explorer
    $("#renameCsvUploadInput").change(function(e){
        var fileName = e.target.files[0].name;
        var fileNameArray = fileName.split(".");
        if (fileNameArray[fileNameArray.length - 1].toLowerCase() == "csv" ) {
            var reader = new FileReader();
            reader.onload = function () {
                $("#renameCsvContents").text("");
                $("#renameCsvContents").text(reader.result);
                $("#renameCsvFileList").css("display", "inline");
                $("#renameCsvFileList").prepend($("<li>").append(fileName));
            };
            // start reading the file. When it is done, calls the onload event defined above.
            reader.readAsText(e.target.files[0]);
            $("#renameCsvFileUploaderReset").css("display", "inline");
            $("#renameCsvDragBoxText").css("display", "none");
        }
        else {
            var cs = new CSInterface;	
            cs.evalScript('$.runScript.premiereAlert("That\'s not a CSV file. Please upload a valid file." )');
        }
    });
    $("#renameCsvUploadLink").on('click', function(e){
        e.preventDefault();
        $("#renameCsvUploadInput:hidden").trigger('click');
    });

    // file drag and dropper
    $('#renameCsvHolder').on({
        'dragover': function(e) {
            e.preventDefault();
            e.stopPropagation();
        }, 

        'drop': function(e) {
            $("#renameCsvContents").text("");
            var csvContents = extractFileData(e, "csv");
        }
    });

    function extractFileData(e, extension){
        var dataTransfer =  e.originalEvent.dataTransfer;
        if( dataTransfer && dataTransfer.files.length) {
            e.preventDefault();
            e.stopPropagation();
            // go through all uploaded files, but set #csvContents to the top file
            $.each( dataTransfer.files, function(i, file) {
                var fileNameArray = (file.name).split(".");
                if (fileNameArray[fileNameArray.length - 1].toLowerCase() == extension ) {
                    var reader = new FileReader();
                    var csvOrXml = "#renameCsv";
                    if (extension == "xml") // adjust element ids depending on operation
                        csvOrXml = "#addCommentsXML";
                    reader.onload = $.proxy(function(file, $fileList, event) {
                        $(csvOrXml + "Contents").text(event.target.result);
                        $(csvOrXml + "FileList").css("display", "inline");
                        //var img = file.type.match('image.*') ? "<img src='" + event.target.result + "' /> " : "";
                        $fileList.prepend( $("<li>").append(file.name));
                    }, this, file, $(csvOrXml + "FileList"));
                    reader.readAsText(file);
                    $(csvOrXml + "FileUploaderReset").css("display", "inline");
                    $(csvOrXml + "DragBoxText").css("display", "none");
                }
                else {
                    var cs = new CSInterface;	
                    cs.evalScript('$.runScript.premiereAlert("That\'s not a ' + JSON.stringify(extension) + ' file. Please upload a valid file." )');
                }
            });
        }
    }

    //---------------- MAM Comments adder ------------------

    $("#addCommentsXMLButton").click(function(){
        var cs = new CSInterface;
        var xml = $("#addCommentsXMLContents").text();
        var addToTimeline = $("#addCommentsXMLOptions").val() == "Clip" ? false : true;
        if (xml.length == 0 && addToTimeline == true){
            var err = "Upload an XML to use this option. Ask Adrian if you need help.";
            cs.evalScript('$.runScript.premiereAlert(' + JSON.stringify(err) + ')');
        }
        else
            cs.evalScript('$.runScript.addCommentsXML(' + JSON.stringify(xml) + ',' + JSON.stringify(addToTimeline) + ')');
    });
    // reset button and its tooltip
    $("#addCommentsXMLFileUploaderReset").click(function(){
        //reset the file contents of previous xml file, and of the file list
        $("#addCommentsXMLContents").text("");
        $("#addCommentsXMLFileList").css("display", "none");
        $("#addCommentsXMLFileList").text("");
        $(this).css("display", "none");
        $("#addCommentsXMLDragBoxText").css("display", "block");
    });
    $("#addCommentsXMLFileUploaderReset").hover(function () {
        $(this).animate({color: "#ff1500"}, 150);
    }, function(){
        $(this).animate({color: "#424242"});
    });

    // for user to upload file using file explorer
    $("#addCommentsXMLUploadInput").change(function(e){
        var fileName = e.target.files[0].name;
        var fileNameArray = fileName.split(".");
        if (fileNameArray[fileNameArray.length - 1].toLowerCase() == "xml" ) {
            var reader = new FileReader();
            reader.onload = function () {
                $("#addCommentsXMLContents").text("");
                $("#addCommentsXMLContents").text(reader.result);
                $("#addCommentsXMLFileList").css("display", "inline");
                $("#addCommentsXMLFileList").prepend($("<li>").append(fileName));
            };
            // start reading the file. When it is done, calls the onload event defined above.
            reader.readAsText(e.target.files[0]);
            $("#addCommentsXMLFileUploaderReset").css("display", "inline");
            $("#addCommentsXMLDragBoxText").css("display", "none");
        }
        else {
            var cs = new CSInterface;	
            cs.evalScript('$.runScript.premiereAlert("That\'s not a XML file. Please upload a valid file." )');
        }
    });
    $("#addCommentsXMLUploadLink").on('click', function(e){
        e.preventDefault();
        $("#addCommentsXMLUploadInput:hidden").trigger('click');
    });

    // file drag and dropper
    $('#addCommentsXMLHolder').on({
        'dragover': function(e) {
            e.preventDefault();
            e.stopPropagation();
        }, 

        'drop': function(e) {
            $("#addCommentsXMLContents").text("");
            var xmlContents = extractFileData(e, "xml");
        }
    });

    //---------------- HELP BOX ------------------

    $("#showVaporuMessages").change(function() { // show or hide the text box
        if ($("#showVaporuMessages").is(":checked"))
            $("#helpBoxHolder").css("display", "block");
        else
            $("#helpBoxHolder").css("display", "none");
    });

    // functions to reveal and hide the help messages
    function showHelp(helpMessage) {
        $("#helpBox").text(helpMessage)
    }
    function hideHelp(){
        $("#helpBox").text("");
    }

    //INSIDER BUG
    $("#insider-logo").hover(function () { showHelp(
        "Click to refresh the panel to its default state."
    )}, function(){hideHelp()}); 

    $("#segmentExporterButton").hover(function () { showHelp(
        "Export many videos from a Sequence at one time. Especially helpful for Snapchat or Facebook stories."
    )}, function(){hideHelp()}); 
    $("#srtImporterButton").hover(function () { showHelp(
        "Hate working with captions? Try this."
    )}, function(){hideHelp()}); 
    $("#thumbExportButton").hover(function () { showHelp(
        "Save multiple thumbnails automatically. You don't even have to choose where to save them."
    )}, function(){hideHelp()}); 
    $("#projectSetupButton").hover(function () { showHelp(
        "Premiere probably doesn't like your footage. This makes editing your files a lot smoother."
    )}, function(){hideHelp()}); 
    $("#fitToSequenceButton").hover(function () { showHelp(
        "Reframe all your footage with one click, instead of manually scaling each one."
    )}, function(){hideHelp()}); 
    $("#reframeMOGRTButton").hover(function () { showHelp(
        "All the controls Adobe didn\'t want to give you over Motion Graphics Templates."
    )}, function(){hideHelp()}); 
    $("#scriptImporterButton").hover(function () { showHelp(
        "Automatically create a rough cut of your video, with just footage and a script."
    )}, function(){hideHelp()}); 
    $("#projectToolsButton").hover(function () { showHelp(
        "Miscellaneous tools to help you work from home and diagnose your project."
    )}, function(){hideHelp()}); 

    //SEGMENT EXPORTER
    $("#exportRefreshButton").hover(function () { showHelp(
        'Resets the Audio Track to 2 and updates the amount of tiles. Use this when switching between Sequences in Premiere.'
    )}, function(){hideHelp()}); 
    $("#exportPresetOptions").hover(function () { showHelp(
        'Fast uses One-Pass encoding, and HQ uses Two-Pass. Stick to HQ if you aren\'t in a rush.'
    )}, function(){hideHelp()}); 
    $("#runExporterButton").hover(function () { showHelp(
        'Sends every separated video on your selected Audio Track to Adobe Media Encoder and exports them to a chosen folder. They automatically export to your "Exports" folder if you have one next to your "Projects" folder.'
    )}, function(){hideHelp()}); 
    $("#audioTrackSelect").hover(function () { showHelp(
        'This is the special Audio Track in the Exporter uses to split your sequence into separate files. It\'s set to Audio Track 2 by default.'
    )}, function(){hideHelp()}); 
    $("#segmentExporterTileSelection").hover(function () { showHelp(
        'If you want to export the last three out of 5 tiles only, set this to "Export tiles 3 through 5." If you want the first tile only, set this to "Export tiles 1 through 1." Defaults to export all of the tiles.'
    )}, function(){hideHelp()}); 

    //CAPTIONS REFORMAT
    $("#srtHolder").hover(function () { showHelp(
        'Upload your captions here to import it as a MOGRT.'
    )}, function(){hideHelp()}); 
    $("#srtParser").hover(function () { showHelp(
        'Saves a version of your uploaded SRT file where if the first line is too long, it\'s broken into two.'
    )}, function(){hideHelp()}); 
    $("#srtToMOGRT").hover(function () { showHelp(
        'For every subtitle in your uploaded SRT file, a Caption MOGRT with the same text and timecode is inserted into your Sequence. Only works if you are a member of the Insider Shared Library.'
    )}, function(){hideHelp()}); 
    $("#importCaptionsTrack").hover(function () { showHelp(
        'Choose a video layer in your sequence to import to. Refresh by clicking the INSIDER logo if the options don\'t match the number of layers in your Sequence.'
    )}, function(){hideHelp()}); 
    $("#addCaptionWarningsBox").hover(function () { showHelp(
        'If checked, markers will added to your Sequence wherever an inserted Caption MOGRT might be too long to fit in the title safe. You can click through each marker to easily find captions that may need editing.'
    )}, function(){hideHelp()}); 
    $("#MOGRTToSRT").hover(function () { showHelp(
        'Creates a new SRT file in your chosen directory, with a corresponding caption for every selected Caption MOGRT in your sequence. The new SRT will be named "captionsFromVaporu_[YourSequenceName].srt"'
    )}, function(){hideHelp()}); 
    

    // THUMBS EXPORT
    $("#horizontalThumbPixels").hover(function () { showHelp(
        'The horizontal resolution, in pixels, to export your thumbnails with.'
    )}, function(){hideHelp()}); 
    $("#verticalThumbPixels").hover(function () { showHelp(
        'The vertical resolution, in pixels, to export your thumbnails with.'
    )}, function(){hideHelp()}); 
    $("#thumbExportDetails").hover(function () { showHelp(
        'If the checkbox is checked, the resolution numbers will adjust to the selected Aspect Ratio in the dropdown. Makes it easy to stick to wide, square, or vertical sizes.'
    )}, function(){hideHelp()}); 
    $("#thumbExporter").hover(function () { showHelp(
        'If you have a "Thumbnails" or "Thumbs" folder in your project, the thumbnails will export there. If you don\'t, choose where to save them.'
    )}, function(){hideHelp()}); 

    // TRANSCODE
    $("#convertSequenceContentsButton").hover(function () { showHelp(
        'Sends the original video for every clip selected in your timeline to Adobe Media Encoder to create a version of it encoded in the MOV ProRes 422 format. Premiere likes ProRes best!'
    )}, function(){hideHelp()}); 
    $("#replaceSequenceContentsButton").hover(function () { showHelp(
        'Choose the folder your new files were saved to when pressing "Convert" to replace all videos selected in your timeline with their ProRes versions.'
    )}, function(){hideHelp()}); 

    //FIT TO FRAME
    $("#reframeClipsButton").hover(function () { showHelp(
        'Scales every video selected in your timeline to the minimum required for it to fill your Sequence\'s resolution fully.'
    )}, function(){hideHelp()}); 
    $("#centerReframeBox").hover(function () { showHelp(
        'If checked, videos will change their position to the center of the frame when resized. Otherwise, they\'ll shrink or grow around its current anchor point.'
    )}, function(){hideHelp()}); 
    $("#scaleToButton").hover(function () { showHelp(
        'Resizes all selected videos in your timeline to a uniform scale.'
    )}, function(){hideHelp()}); 
    $("#scaleToValue").hover(function () { showHelp(
        'This number corresponds to what will appear under "Scale" in your video\'s Effects Controls.'
    )}, function(){hideHelp()}); 
    
    //MOGRT MASTER
    $("#reframeMOGRTJSXButton").hover(function () { showHelp(
        'Switches the Wide/Square/Vertical setting of MOGRTs selected in your timeline to match the Sequence settings. Perfect for quickly reframing text in your different cuts.'
    )}, function(){hideHelp()});    
    $("#copyMOGRTPropertiesButton").hover(function () { showHelp(
        'Select one MOGRT, then press this button to copy all of its settings to paste them later.'
    )}, function(){hideHelp()});    
    $("#pasteMOGRTPropertiesButton").hover(function () { showHelp(
        'Select as many MOGRTs as you want to reformat, then press this button to match its settings to the MOGRT you selected to Copy settings from (this doesn\'t paste text).'
    )}, function(){hideHelp()});    
    $("#txtToMOGRTBox").hover(function () { showHelp(
        'Takes a regular text element in Premiere and creates a MOGRT of your choice that displays the same text, at the same timecode in your Sequence.'
    )}, function(){hideHelp()});    
    $("#mogrtTypeOptions").hover(function () { showHelp(
        'Choose to either create a text-on-screen or a courtesy MOGRT from the text you have selected in your timeline.'
    )}, function(){hideHelp()});       
    $("#MOGRTTrackOptions").hover(function () { showHelp(
        'Choose a video track to create the MOGRT on. It\'ll appear with the same time and length as the original text. Refresh by clicking the INSIDER logo if the options don\'t match the number of layers in your Sequence.'
    )}, function(){hideHelp()});    
    $("#convertToMOGRTButton").hover(function () { showHelp(
        'Converts every text clip to a MOGRT of your choice with the same text. Useful for reframing sequences.'
    )}, function(){hideHelp()});    

    //SCRIPT IMPORTER
    $("#csvHolder").hover(function () { showHelp(
        'Upload a script here. In Google Sheets, go to File > Download > Microsoft Excel to get the XLSX file.'
    )}, function(){hideHelp()});    
    $("#scriptPreviewButtonHolder").hover(function () { showHelp(
        "Display a preview of how Vaporu reads your script. If the Script Importer isn't working, try seeing if the preview matches what you expect."
    )}, function(){hideHelp()});    
    $("#courtesiesBox").hover(function () { showHelp(
        "Include courtesy MOGRTs from the script. Only works if you're part of the Insider Shared Library."
    )}, function(){hideHelp()});    
    $("#TOSBox").hover(function () { showHelp(
        "Include text-on-screen MOGRTs from the script. Only works if you're part of the Insider Shared Library."
    )}, function(){hideHelp()});    
    $("#csvParser").hover(function () { showHelp(
        'Creates a rough cut of your video from the uploaded script. All footage must be in a bin called "Media from Xchange" to work.'
    )}, function(){hideHelp()});  
    $("#boldColorBox").hover(function () { showHelp(
        "Colors words that are bolded in the script. Doesn't work if the entire cell in the script is bolded."
    )}, function(){hideHelp()});      
    $("#boldColorSquareContainer").hover(function () { showHelp(
        "Bolded words and compilation numbers will appear in this color. Click to modify it."
    )}, function(){hideHelp()});     
    $("#boldColorPicker").hover(function () { showHelp(
        "Input the a color's hex value (in the format #ABC123). If you omit the # sign, it'll be added for you."
    )}, function(){hideHelp()}); 

    //PROJECT TOOLS
    $("#generateReportButton").hover(function () { showHelp(
        "Creates a .txt file with info about this Sequence. If you're having issues with this project, send the .txt file to Adrian."
    )}, function(){hideHelp()});

    $("#clearCacheButton").hover(function () { showHelp(
        "Deletes all audio and video preview files for this project."
     )}, function(){hideHelp()}); 

    $("#helpMessagesBox").hover(function () { showHelp(
        'Show or hide help messages like this one.'
    )}, function(){hideHelp()}); 

    $("#relinkFilesButton").hover(function () { showHelp(
        'Choose a directory to swap videos (in the format "businessinsider_recordID_x") selected in your timeline with.'
    )}, function(){hideHelp()}); 
    $("#replaceProxyOptions").hover(function () { showHelp(
        'Choose whether you want the high-res (ending with "f0") or proxy (ending with "r2") files downloaded from the MAM.'
     )}, function(){hideHelp()}); 

    $("#renameFilesButton").hover(function () { showHelp(
        "Renames all selected videos in your timeline. Useful when you have media in the format 'businessinsider_recordID_f0'."
    )}, function(){hideHelp()});
    $("#renameFilesOrClips").hover(function () { showHelp(
        'Choose whether to rename the clips just in this project or to rename the files on your computer.'
    )}, function(){hideHelp()});
    $("#renameByOptions").hover(function () { showHelp(
        'Choose the format to rename clips or files to.'
    )}, function(){hideHelp()});
    $("#renameCsvHolder").hover(function () { showHelp(
        'Upload a file to match record ID with clip names. Ask Adrian if you need help getting the right file.'
    )}, function(){hideHelp()});

    $("#addCommentsXMLButton").hover(function () { showHelp(
        "Adds the comments from the MAM to your selected clip or sequence."
    )}, function(){hideHelp()});
    $("#addCommentsXMLOptions").hover(function () { showHelp(
        'Do you want to add the MAM comments to the only video selected in your sequence, or to your sequence starting at its In Point?'
    )}, function(){hideHelp()});
    $("#addCommentsXMLHolder").hover(function () { showHelp(
        'Upload a Premiere CC XML file for this clip from the MAM. Ask Adrian if you need help getting the right file.'
    )}, function(){hideHelp()});

    $("#fullExporterButton").hover(function () { showHelp(
        "Export a review or final version of your video."
    )}, function(){hideHelp()});
    $("#exportHiResButton").hover(function () { showHelp(
        'Sends a high-quality version of your video to Media Encoder. Its framerate and resolution will match your Sequence.'
    )}, function(){hideHelp()});
    $("#exportPreviewButton").hover(function () { showHelp(
        'Sends a 360p version of your video to Media Encoder. Its framerate will match your Sequence.'
    )}, function(){hideHelp()});

    $("#colorPalettesButton").hover(function () { showHelp(
        "Easily work with the color palettes for different Insider video teams."
    )}, function(){hideHelp()});
    // $(document).on('mouseover', '.groupLabel', showHelp(
    //     'Click on a group name to expand or collapse its colors.'
    // ));
    // $(document).on('mouseout', '.groupLabel', hideHelp());
    // $(document).on('mouseover', '.swatch', showHelp(
    //     'When you click on a color swatch, its hex code will be copied to your clipboard. The next time you paste, it will be that color.'
    // ));
    // $(document).on('mouseout', '.swatch', hideHelp());
    $("#sizeSlider").hover(function () { showHelp(
        'Adjust the display size for color swatches.'
    )}, function(){hideHelp()})
    $("#showLabels").hover(function () { showHelp(
        'Show or hide the hex color text over the color swatches.'
    )}, function(){hideHelp()})

    $(".fa-save").hover(function () { showHelp(
        'Saves the currently open apps, and if possible, their settings.'
    )}, function(){hideHelp()})


    //SPLIT SCREEN
    $("#splitScreenButton").hover(function () { showHelp(
        'Add split screen effects to your videos.'
    )}, function(){hideHelp()});    
    $("#splitScreenMethodContainer").hover(function () { showHelp(
        'If set to "Nest (Precompose)" your selected clips will be nested and each nest will be positioned. Otherwise, the Transform and Crop effects will be added to each selected clip to position them.'
    )}, function(){hideHelp()});    
    $(".splitOption").hover(function () { 
        var idName = $(this).attr('id'); 
        var numberOfClips = idName.charAt(idName.length-1);
        showHelp(
        'Select ' + numberOfClips + ' clips on different layers in your timeline, then click here to make a splitscreen of them.'
    )}, function(){hideHelp()});   


    //PIGEON
    $("#pigeonButton").hover(function () { showHelp(
        "Import audio from Insider's sound libraries."
    )}, function(){hideHelp()});    
    $("#pigeonLogin").hover(function () { showHelp(
        "Log in using your Vaporu credentials. These are NOT your BI credentials."
    )}, function(){hideHelp()});    
});
