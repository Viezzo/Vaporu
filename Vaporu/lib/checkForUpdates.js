$(document).ready(function() {

    // $("#MOGRTToSRT").click(function(){
        
    //     var cs = new CSInterface;	
    //     cs.evalScript('$.runScript.convertMOGRTToSRT()');
    // });

    checkForUpdates();

    function checkForUpdates(){
        var spreadSheetURL = "https://docs.google.com/document/d/e/2PACX-1vQrcLegnB41354fFA0CZUjrquuyA3mZC3oPqvYxACIAiiCtgK9yIFrEs9_b4U3iPSOZw2xAv3IjbLVE/pub";
        $.ajax({
          type: "GET",
          url: spreadSheetURL,
          dataType: 'jsonp',
          success: function(data){
            alert("data");
          }
        });
    }

});
