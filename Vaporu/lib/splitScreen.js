$(document).ready(function() {

    $("#splitScreenButton").click(function(){
        $("#splitScreenApp").slideToggle();
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

    $("#splitXYButton").click(function(){
        var ySplits = $("#splitScreenYSplits").val();
        var xSplits = $("#splitScreenXSplits").val();
        createSplitScreen(xSplits, ySplits);
    });

    $("#splitWide2").click(function(){ createSplitScreen(2, 1) });
    $("#splitWide3").click(function(){ createSplitScreen(3, 1) });
    $("#splitWide4").click(function(){ createSplitScreen(4, 1) });
    $("#splitSquare4").click(function(){ createSplitScreen(2, 2) });
    $("#splitVertical2").click(function(){ createSplitScreen(1, 2) });
    $("#splitVertical3").click(function(){ createSplitScreen(1, 3) });
    $("#splitVertical4").click(function(){ createSplitScreen(1, 4) });

    function createSplitScreen(xSplits, ySplits){
        var cs = new CSInterface;	
        var splitMethod = $("#splitScreenMethod").val();

        cs.evalScript('$.runScript.splitScreen('  
            + JSON.stringify(ySplits) + ', '  
            + JSON.stringify(xSplits) + ', '  
            + JSON.stringify(splitMethod)
            + ')', function(returnString){
            // parse JSON return value
            try {
            }
            catch (error) {
                alert(error);
            }
        });
    }

});
