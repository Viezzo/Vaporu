$(document).ready(function() {

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
