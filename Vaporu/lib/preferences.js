$(document).ready(function() {

    getPreferences();

    $(".fa-save").hover(function () {
        $("#saveMessage").text("Save layout");
    }, function () {
        $("#saveMessage").text("");
    }); 

    $(".fa-save").click(function () {
        writePreferences();
        $("#saveMessage").text("Layout saved.");
    }); 

    $("#showHideApps").click(function () {
        var caratElement = $(this).html();
        if (caratElement.includes("caret-up")) {
            $("#appButtons").slideUp();
            $(this).html('<i class="fas fa-caret-down"></i>');
        }
        else {
            $("#appButtons").slideDown();
            $(this).html('<i class="fas fa-caret-up"></i>');
        }
    }); 

    function getPreferences() {
        var cs = new CSInterface;	
        cs.evalScript('$.runScript.readPreferences()', function(returnString){
            // parse JSON return value
            try {
                if (returnString && typeof returnString != "undefined")
                    configs = JSON.parse(returnString);

                    //HIDE/SHOW APPS
                    if (configs.areAppsHidden == true) {
                        $("#appButtons").slideUp(2);
                        $("#showHideApps").html('<i class="fas fa-caret-down"></i>');
                    }
                    
                    //OPEN APPS
                    for (i = 0; i < configs.openApps.length; i++)
                        openApp(configs.openApps[i])

                    //SEGMENT EXPORTER
                    $('#exportPresetOptions').val(configs.segmentExporter.exportPreset);

                    //CAPTIONS REFORMAT
                    $('#addCaptionWarnings').prop('checked', configs.captionsReformat.addMarkers);

                    //THUMBS EXPORT
                    $('#lockAR').prop('checked', configs.thumbsExport.lock);

                    //FIT TO FRAME
                    $('#scaleCenterCheckbox').prop('checked', configs.fitToFrame.center);
                    $('#scaleToValue').val(configs.fitToFrame.scaleTo);

                    //MOGRT MASTER
                    $('#mogrtTypeOptions').val(configs.mogrtMaster.textToMogrtType);
                    $('#updateCaptionsLengthInput').val(configs.mogrtMaster.captionCharacters);

                    //SCRIPT IMPORTER
                    $('#mode2').prop('checked', configs.scriptImporter.courtesies);
                    $('#mode3').prop('checked', configs.scriptImporter.tos);
                    $('#mode4').prop('checked', configs.scriptImporter.bold);
                    $('#boldHexValue').val(configs.scriptImporter.color);
                    $("#boldColorSquare").css('backgroundColor', configs.scriptImporter.color)

                    //PROJECT TOOLS
                    $('#showVaporuMessages').prop('checked', configs.projectTools.displayHelp);
                    $('#replaceProxyOptions').val(configs.projectTools.relinkWith);
                    $('#renameFilesOrClips').val(configs.projectTools.renameFrom);
                    $('#renameByOptions').val(configs.projectTools.renameTo);
                    updateRenameCSV(configs.projectTools.renameTo);
                    $('#addCommentsXMLOptions').val(configs.projectTools.addCommentsTo);

                    //COLORS
                    var hiddenColorGroups = configs.colorPalettes.hiddenColorGroups;
                    for (i = 0; i < hiddenColorGroups.length; i++)
                        hideColorGroup(hiddenColorGroups[i])
                    $("#sizeSlider").val(configs.colorPalettes.size);
                    updateSize(configs.colorPalettes.size);
                    $('#showLabels').prop('checked', configs.colorPalettes.labels);
                    updateLabels();

                    //SPLIT SCREEN
                    $('#splitScreenXSplits').val(configs.splitScreen.x);
                    $('#splitScreenYSplits').val(configs.splitScreen.y);

                    //PIGEON
                    $('#pigeonUser').val(configs.pigeon.username);
                }
            catch (error) {
                alert(error);
            }
        });
    }

    function writePreferences() {
        var newJSON = {
            "areAppsHidden":false,
            "openApps":[],
            "segmentExporter": {"exportPreset": "HQ"},
            "captionsReformat": {"addMarkers": false},
            "thumbsExport": {"lock": false},
            "fitToFrame": {"center": true, "scaleTo": 100},
            "mogrtMaster": {"textToMogrtType": "TOS", "captionCharacters": 28},
            "scriptImporter": {"courtesies": false, "tos": false, "bold": false, "color": "#007EFF"},
            "projectTools": {"displayHelp": true, "relinkWith":"1", "renameFrom": "1", "renameTo": "4", "addCommentsTo":"Clip"},
            "colorPalettes": {"hiddenColorGroups":[], "size":75, "labels":true},
            "splitScreen": {"x":1, "y":2},
            "pigeon": {"username":""}
        }
        // HIDE/SHOW APPS
        newJSON.areAppsHidden = $("#showHideApps").html().includes("caret-down");

        // OPEN APPS
        var openAppsArray = [];
        $('.app').each(function() { 
            if ($(this).css('display') != "none"){
                var appName = $(this).attr('id');
                openAppsArray.push(appName);
            }
        });            
        newJSON.openApps = openAppsArray; 

        //SEGMENT EXPORTER
        newJSON.segmentExporter.exportPreset = $('#exportPresetOptions').val();

        //CAPTIONS REFORMAT
        newJSON.captionsReformat.addMarkers = $('#addCaptionWarnings').is(":checked");

        //THUMBS EXPORT
        newJSON.thumbsExport.lock = $('#lockAR').is(":checked");

        //FIT TO FRAME
        newJSON.fitToFrame.center = $('#scaleCenterCheckbox').is(":checked");
        newJSON.fitToFrame.scaleTo = $('#scaleToValue').val();

        //TEXT TO MOGRT
        newJSON.mogrtMaster.textToMogrtType = $('#mogrtTypeOptions').val();
        newJSON.mogrtMaster.captionCharacters = $('#updateCaptionsLengthInput').val();

        //SCRIPT IMPORTER
        newJSON.scriptImporter.courtesies = $('#mode2').is(":checked");
        newJSON.scriptImporter.tos = $('#mode3').is(":checked");
        newJSON.scriptImporter.bold = $('#mode4').is(":checked");
        newJSON.scriptImporter.color = $('#boldHexValue').val();

        //PROJECT TOOLS
        newJSON.projectTools.displayHelp = $('#showVaporuMessages').is(":checked");
        newJSON.projectTools.relinkWith = $('#replaceProxyOptions').val();
        newJSON.projectTools.renameFrom = $('#renameFilesOrClips').val();
        newJSON.projectTools.renameTo = $('#renameByOptions').val();
        newJSON.projectTools.addCommentsTo = $('#addCommentsXMLOptions').val();


        //COLORS
        var hiddenColorGroupsArray = [];
        $('.colorGroup').each(function() {
            if ($(this).css('display') == "none"){
                var label = $(this).parent().find($('.groupLabel')).text().trim();
                hiddenGroupsArray.push(label);
            }
        });        
        newJSON.colorPalettes.hiddenColorGroups = hiddenColorGroupsArray;
        newJSON.colorPalettes.size = $("#sizeSlider").val();
        newJSON.colorPalettes.labels = $('#showLabels').is(":checked");

        //SEGMENT EXPORTER
        newJSON.splitScreen.x = $('#splitScreenXSplits').val();
        newJSON.splitScreen.y = $('#splitScreenYSplits').val();

        //PIGEON
        newJSON.pigeon.username = $('#pigeonUser').val();

        var cs = new CSInterface;	
        cs.evalScript('$.runScript.writePreferences(' + JSON.stringify(newJSON) + ')');
    }

    function openApp(appName) {
        $(".app").each(function() {
            if ($(this).attr('id') == appName){
                $(this).slideDown(2);
                // if we found an open app, also turn its button background darker
                $(".appButton").each(function() {
                    if ($(this).attr("data-appName") == appName){
                        $(this).css("background-color", "rgba(0, 0, 0, .3)");
                    }
                });
            }
        });
    }

    function hideColorGroup(groupName) {
        $(".groupLabel").each(function() {
                label = $(this).text().trim();
                if (label == groupName)
                    $(this).parent().find($('.colorGroup')).slideToggle(5);
                //alert(label)
        });
    }

    function updateSize(newWidth){
        $(".swatch").each(function() {
            $(this).css('width',newWidth);
            $(this).css('height',newWidth * 0.8);
        });
        $(".swatchText").each(function() { // change the size of the label text
            $(this).css('font-size', Math.floor( (10/Math.pow(newWidth, 0.08)) + newWidth/10));
        });
    }

    function updateLabels(newWidth){
        var setting = $("#showLabels").is(":checked") ? 'block' : 'none';
        $(".swatchText").css('display', setting);
    }

    function updateRenameCSV (renameByInput) {
        if (renameByInput == "1" || renameByInput == "2")
            $("#renameCsvHolder").slideDown(5);
        else
            $("#renameCsvHolder").slideUp(5);
    }
    
});