$(document).ready(function() {

    $("#colorPalettesButton").click(function(){

        $("#colorPalettesApp").slideToggle();
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

    getCSV();

    function getCSV(){
        csvArray = $('#colorPresets').text().split("\n");
        for (line in csvArray) {
            var swatches = csvArray[line].split(",");
            if (typeof swatches[0] != 'undefined' && swatches[0].trim().length > 0){
                var newColorGroup = $('<div class="colorGroupParent"></div>').appendTo($('#colorsContainer'));
                newColorGroup.append('<span class="groupLabel">' + swatches[0] + '</span>');
                var newSwatches = $('<div class="colorGroup"></div>').appendTo((newColorGroup)); // this is the group of just the color swatches
                for (i = 1; i < swatches.length; i++){ // add each new swatch
                    var theSwatch = swatches[i].trim().split(" "); // space is used as delimeter between hex color and swatch type (base, accent, etc)
                    var theColor = theSwatch[0].trim();
                    var swatchType = "";
                    if (theSwatch.length > 1) // swatch type was specified.
                        swatchType = theSwatch[1].trim();
                    var newSwatch = $('<span class="swatch" data-hexcode=' + theColor + '></span>').appendTo(newSwatches);
                    newSwatch.css('background-color',theColor);
                    $('<span class="swatchText">' + theColor + '</span>').appendTo(newSwatch);
                    //$('<span class="swatchText">' + swatchType + '</span>').appendTo(newSwatch);
                    $('<span class="swatchCopyText">Copied!</span>').appendTo(newSwatch);
                }
            }
        }
    }

    $("#sizeSlider").change(function () {
        var newWidth = $(this).val();
        $(".swatch").each(function() {
            $(this).css('width',newWidth);
            $(this).css('height',newWidth * 0.8);
        });
        $(".swatchText").each(function() { // change the size of the label text
            $(this).css('font-size', Math.floor( (10/Math.pow(newWidth, 0.08)) + newWidth/10));
        });
    });

    $("#showLabels").change(function () {
        $(".swatchText").fadeToggle("fast");
    });

    $(document).on('mouseover', '.swatch', function () {
        $(this).css('border-color', '#63B1FF');
    });
    $(document).on('mouseout', '.swatch', function () {
        $(this).css('border-color', 'white');
    });

    $(document).on('click', '.swatch', function () { // copy a color to clipboard on click
        var swatchColor = $(this).css('background-color');
        var hexcode = $(this).data("hexcode").replace("#", "");
        //alert(hexcode)
        //$(this).find(".swatchCopyText").slideToggle();
        $(this).css('background-color', 'white');
        $("#copiedColorText").css('display', 'block');
        $("#copiedColorText").val(hexcode);
        $("#copiedColorText").select();
        document.execCommand("copy");
        $(this).animate({backgroundColor:swatchColor}, 600, 'easeOutQuad');
        $(this).find(".swatchCopyText").slideToggle(200, 'easeOutQuad').delay(700).slideToggle();
        $("#copiedColorText").css('display', 'none');
    });

    // hide color swatches
    $(document).on('click', '.groupLabel', function () { // show or hide swatch groups when label is clicked
        $(this).parent().find($('.colorGroup')).slideToggle();
    });
    // highlight labels
    $(document).on('mouseover', '.groupLabel', function () { // highlight name of swatch group when label is hovered on
        $(this).animate({color:'#63B1FF'}, 100, 'easeOutQuad');
        $(this).parent().find($('.plusMinusMessage')).text("Show/hide " + $(this).text() + " colors");
    });
    $(document).on('mouseout', '.groupLabel', function () { // 
        $(this).animate({color:'white'}, 200, 'easeOutQuad');
        $(this).parent().find($('.plusMinusMessage')).text("");
    });

});
