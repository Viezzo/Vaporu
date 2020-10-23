$(document).ready(function() {

    setVideoTrackOptions();

    window.copiedSettings = {
        properties : []
    };

    function setVideoTrackOptions(){
        var cs = new CSInterface;	
        // get return value from countTracks() in jsx
        cs.evalScript('$.runScript.countVideoTracks()', function(returnString){
          var numTracks = 0;
          // parse JSON return value
          try {
            if (returnString && typeof returnString != "undefined")
                numTracks = JSON.parse(returnString);
          }
          catch (error) {
            //alert(error);
          }
          // add option elements to HTML
          for (var i = 0; i < numTracks; i++){
            // set default selection to A2
            if (i == 4){
              $("#MOGRTTrackOptions").append(new Option(i + 1, i + 1, true, true));
            }
            else{
              $("#MOGRTTrackOptions").append(new Option(i + 1, i + 1));
            }
          }
        });
    }

    $("#reframeMOGRTButton").click(function(){

        $("#reframeMOGRTControls").slideToggle();
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

    $("#reframeMOGRTJSXButton").click(function(){

        var cs = new CSInterface;
        cs.evalScript('$.runScript.fitAllMOGRTs()', function(returnString){
            try {
                
               // alert(JSON.parse(returnString));
            }
            catch (error) {
                alert(error);
            }
        });
    });

    $("#copyMOGRTPropertiesButton").click(function(){

        var cs = new CSInterface;
        cs.evalScript('$.runScript.getMOGRTSettings()', function(returnString){
            try {
                //var propertiesArray = returnString.split(',');
                var propertiesArray = JSON.parse(returnString);
                window.copiedSettings.properties = propertiesArray;
            }
            catch (error) {
                alert(error);
            }
        });
    });

    $("#pasteMOGRTPropertiesButton").click(function(){
        
        var cs = new CSInterface;
        //alert(window.copiedSettings.properties.length)
        cs.evalScript('$.runScript.setMOGRTSettings(' + JSON.stringify(window.copiedSettings.properties) + ')', function(returnString){
            try {
                
               // alert(JSON.parse(returnString));
            }
            catch (error) {
                alert(error);
            }
        });
    });

    $("#convertToMOGRTButton").click(function(){
        var trackNumber = $("#MOGRTTrackOptions").val();
        var mogrtType = $("#mogrtTypeOptions").val();

        var cs = new CSInterface;
        cs.evalScript('$.runScript.convertToMOGRT(' + trackNumber + ', ' + JSON.stringify(mogrtType) + ')', function(returnString){
            try {

            }
            catch (error) {
                alert(error);
            }
        });
    });

    $("#updateCaptionsLengthButton").click(function(){
        var characterNumber = $("#updateCaptionsLengthInput").val();

        var cs = new CSInterface;
        cs.evalScript('$.runScript.updateCaptionSplitLength(' + JSON.stringify(characterNumber) +')');
    });
    

});

