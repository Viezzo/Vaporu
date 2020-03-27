$(document).ready(function() {
    $("#projectSetupButton").click(function(){

        $("#projectSetupControls").slideToggle();
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

    $("#convertSequenceContentsButton").click(function(){
        var cs = new CSInterface;
        cs.evalScript('$.runScript.sequenceTranscode()');
    });

    $("#replaceSequenceContentsButton").click(function(){
        var cs = new CSInterface;
        cs.evalScript('$.runScript.replaceTranscodes()');
    });

});
