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
        
        var cs = new CSInterface;	
        var precompose = $("#splitScreenMethod").val() == 'nest' ? true : false;

        cs.evalScript('$.runScript.splitScreen2('  
            + JSON.stringify(ySplits) + ', '  
            + JSON.stringify(xSplits) + ', '  
            + JSON.stringify(precompose)
            + ')', function(returnString){
            // parse JSON return value
            try {
            }
            catch (error) {
                alert(error);
            }
        });
    });

    // $("#splitWide2").click(function(){ createSplitScreen("Wide", 2) });
    // $("#splitWide3").click(function(){ createSplitScreen("Wide", 3) });
    // $("#splitWide4").click(function(){ createSplitScreen("Wide", 4) });
    // $("#splitSquareLeftRight2").click(function(){ createSplitScreen("Square", 2) });
    // $("#splitSquareUpDown2").click(function(){ createSplitScreen("Square", 3) });
    // $("#splitSquare4").click(function(){ createSplitScreen("Square", 4) });
    // $("#splitVertical2").click(function(){ createSplitScreen("Vertical", 2) });
    // $("#splitVertical3").click(function(){ createSplitScreen("Vertical", 3) });
    // $("#splitVertical4").click(function(){ createSplitScreen("Vertical", 4) });

    // function createSplitScreen(ARchoice, numberOfClips) {
    //     var cs = new CSInterface;	
    //     var precompose = $("#splitScreenMethod").val() == 'nest' ? true : false;

    //     cs.evalScript('$.runScript.splitScreen('  
    //         + JSON.stringify(ARchoice) + ', '  
    //         + JSON.stringify(numberOfClips) + ', '  
    //         + JSON.stringify(precompose)
    //         + ')', function(returnString){
    //         // parse JSON return value
    //         try {
    //         }
    //         catch (error) {
    //             alert(error);
    //         }
    //     });
    // }



});
