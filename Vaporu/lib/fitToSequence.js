$(document).ready(function() {

    $("#fitToSequenceButton").click(function(){

        $("#reframeClipsControls").slideToggle();
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

    $("#reframeClipsButton").click(function(){
        var centerIsChecked = $("#scaleCenterCheckbox").is(":checked");

        var cs = new CSInterface;
        cs.evalScript('$.runScript.fitAllToSeq(' + centerIsChecked + ')');
    });

    $("#scaleToButton").click(function(){
        var newScale = $("#scaleToValue").val();

        var cs = new CSInterface;
        cs.evalScript('$.runScript.scaleTo(' + newScale + ')');
    });

});
