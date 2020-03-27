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
        $("#csvUploadInput:hidden").trigger('click');
    });

    // file drag and dropper
    $('#renameCsvHolder').on({
        'dragover': function(e) {
            e.preventDefault();
            e.stopPropagation();
        }, 

        'drop': function(e) {
            $("#renameCsvContents").text("");
            var csvContents = extractFileData(e);
        }
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
                        $("#renameCsvContents").text(event.target.result);
                        $("#renameCsvFileList").css("display", "inline");
                        //var img = file.type.match('image.*') ? "<img src='" + event.target.result + "' /> " : "";
                        $fileList.prepend( $("<li>").append(file.name));
                    }, this, file, $("#renameCsvFileList"));
                    reader.readAsText(file);
                    $("#renameCsvFileUploaderReset").css("display", "inline");
                    $("#renameCsvDragBoxText").css("display", "none");
                }
                else {
                    var cs = new CSInterface;	
                    cs.evalScript('$.runScript.premiereAlert("That\'s not a CSV file. Please upload a valid file." )');
                }
            });
        }
    }

});
