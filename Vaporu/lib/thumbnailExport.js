$(document).ready(function() {

    $("#thumbExportButton").click(function(){
        var cs = new CSInterface;
        // fill dimensions fields with this sequence's resolution
        cs.evalScript('$.runScript.getSequenceResolution()', function(returnString){
            try {
                var dimensions = returnString.split(",");
                if (dimensions.length == 2){
                    if (dimensions[0] == "1080" && dimensions[1] == "1920"){
                        $("#horizontalThumbPixels").val(540);
                        $("#verticalThumbPixels").val(900);
                    }
                    else {
                        $("#horizontalThumbPixels").val(dimensions[0]);
                        $("#verticalThumbPixels").val(dimensions[1]);
                    }
                }
                else { // wrong dimensions for sequence retrieved 
                    $("#horizontalThumbPixels").val(0);
                    $("#verticalThumbPixels").val(0);
                }
            }
            catch (error) {
                alert(error);
            }
        });

        $("#thumbExportControls").slideToggle();
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

    $("#horizontalThumbPixels").change(function() {
        if ($("#lockAR").is(":checked")){
            var ARselection = $("#thumbAROptions").val();
            if (ARselection == "WIDE"){
                $("#verticalThumbPixels").val( Math.round($(this).val()*9/16) );
            }
            else if (ARselection == "SQUARE"){
                $("#verticalThumbPixels").val( Math.round($(this).val()) );
            }
            else { // vertical
                $("#verticalThumbPixels").val( Math.round($(this).val()*16/9) );
            }
        }
    });

    $("#verticalThumbPixels").change(function() {
        if ($("#lockAR").is(":checked")){
            var ARselection = $("#thumbAROptions").val();
            if (ARselection == "WIDE"){
                $("#horizontalThumbPixels").val( Math.round($(this).val()*16/9) );
            }
            else if (ARselection == "SQUARE"){
                $("#horizontalThumbPixels").val($(this).val());
            }
            else { // vertical
                $("#horizontalThumbPixels").val( Math.round($(this).val()*9/16) );
            }
        }
    });

    $("#lockAR").change(function() {
        if ($("#lockAR").is(":checked")){
            // check whether horizontal pixels have been specified. If not, check vertical
            var horizontalPixels = $("#horizontalThumbPixels").val();
            var verticalPixels = $("#verticalThumbPixels").val();
            var pixels = 0;
            var goHorizontal = true;

            if (horizontalPixels && typeof horizontalPixels != "undefined"){
                pixels = horizontalPixels;
            }
            else if (verticalPixels && typeof verticalPixels != "undefined"){
                pixels = verticalPixels;
                goHorizontal = false;
            }

            var ARselection = $("#thumbAROptions").val();
            if (ARselection == "WIDE"){
                if (goHorizontal) {
                    $("#verticalThumbPixels").val( Math.round(pixels*9/16) );
                }
                else {
                    $("#horizontalThumbPixels").val( Math.round($(this).val()*16/9) );
                }
            }
            else if (ARselection == "SQUARE"){
                if (goHorizontal) {
                    $("#verticalThumbPixels").val((pixels));
                }
                else {
                    $("#horizontalThumbPixels").val($(this).val());
                }
            }
            else { // vertical
                if (goHorizontal) {
                    $("#verticalThumbPixels").val( Math.round(pixels*16/9) );
                }
                else {
                    $("#horizontalThumbPixels").val( Math.round($(this).val()*9/16) );
                }
            }
        }
    });

    $("#thumbAROptions").change(function() {
        if ($("#lockAR").is(":checked")){
            // check whether horizontal pixels have been specified. If not, check vertical
            var horizontalPixels = $("#horizontalThumbPixels").val();
            var verticalPixels = $("#verticalThumbPixels").val();
            var pixels = 0;
            var goHorizontal = true;

            if (horizontalPixels && typeof horizontalPixels != "undefined"){
                pixels = horizontalPixels;
            }
            else if (verticalPixels && typeof verticalPixels != "undefined"){
                pixels = verticalPixels;
                goHorizontal = false;
            }

            var ARselection = $("#thumbAROptions").val();
            if (ARselection == "WIDE"){
                if (goHorizontal) {
                    $("#verticalThumbPixels").val( Math.round(pixels*9/16) );
                }
                else {
                    $("#horizontalThumbPixels").val( Math.round($(this).val()*16/9) );
                }
            }
            else if (ARselection == "SQUARE"){
                if (goHorizontal) {
                    $("#verticalThumbPixels").val((pixels));
                }
                else {
                    $("#horizontalThumbPixels").val($(this).val());
                }
            }
            else { // vertical
                if (goHorizontal) {
                    $("#verticalThumbPixels").val( Math.round(pixels*16/9) );
                }
                else {
                    $("#horizontalThumbPixels").val( Math.round($(this).val()*9/16) );
                }
            }
        }
    });

    $("#thumbExporter").click(function(){
        var hpixels = 0;
        var vpixels = 0;

        var hpixels = $("#horizontalThumbPixels").val();
        var vpixels = $("#verticalThumbPixels").val();

        var cs = new CSInterface;
        cs.evalScript('$.runScript.thumbExport(' + hpixels + ', ' + vpixels + ', ' +  ' )', function(returnString){
            try {
                
               // alert(JSON.parse(returnString));
            }
            catch (error) {
                alert(error);
            }
        });
    });

});
