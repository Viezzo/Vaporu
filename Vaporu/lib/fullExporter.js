$(document).ready(function() {

$("#fullExporterButton").click(function(){

    $("#fullExporterControls").slideToggle();
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

  // dynamically creates the HTML options for Audio Track selector
  $("#exportHiResButton").click(function () {
    var cs = new CSInterface;	
    cs.evalScript('$.runScript.fullExporter(' + JSON.stringify("FINAL") + ')');
  });

  $("#exportPreviewButton").click(function () {
    var preset = $("#fullExportPreset").val();
    var cs = new CSInterface;	
    cs.evalScript('$.runScript.fullExporter(' + JSON.stringify("PREVIEW") + ')');
  });

  
});
