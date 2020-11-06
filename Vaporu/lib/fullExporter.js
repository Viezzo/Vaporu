$(document).ready(function() {

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
