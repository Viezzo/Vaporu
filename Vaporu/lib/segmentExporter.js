$(document).ready(function() {

  // set global seqID variable to detect changes
  var oldAudioTrackSeqID = 0;
  var oldTileSeqID = 0;
  var oldAudioTrack = 0;
  // set the <option> element before options are dynamically added to it
  var emptyAudioTrackList = $("#audioTrackOptions").clone();
  // set the <option> element before options are dynamically added to it
  var emptyStartTileList = $("#startTileOptions").clone();
  var emptyEndTileList = $("#endTileOptions").clone();
  // set audiotrack options for initial sequence
  setAudioTrackOptions();

  // dynamically creates the HTML options for Audio Track selector
  function setAudioTrackOptions(){
    var cs = new CSInterface;	
    // get return value from countTracks() in jsx
    cs.evalScript('$.runScript.countAudioTracks()', function(returnString){
      var numTracks = 2;
      // parse JSON return value
      try {
        if (returnString && typeof returnString != "undefined")
          numTracks = JSON.parse(returnString);
      }
      catch (error) {
        //alert(error);
      }
      // add option elements to HTML
      for (var i = 0; i < numTracks; i++){
        // set default selection to A2
        if (i == 1){
          $("#audioTrackOptions").append(new Option(i + 1, i + 1, true, true));
        }
        else{
          $("#audioTrackOptions").append(new Option(i + 1, i + 1));
        }
      }
      //alert("finished adding audiotrack options");
      setTileOptions();
    });
  }

  // when audioTrack selector is clicked, refresh it with the # of tracks
  $("#audioTrackSelect").change(function () {
    var newAudioTrackSeqID = 0;

    // get sequence ID from getSequenceId in JSX
    var cs = new CSInterface;	
    cs.evalScript('$.runScript.getSequenceId()', function(returnString){
      // parse JSON return value
      try {
        if (returnString && typeof returnString != "undefined")
          newAudioTrackSeqID = JSON.parse(returnString);
        //if this is the first click, set it
        if (oldAudioTrackSeqID == 0){
          oldAudioTrackSeqID = newAudioTrackSeqID;
        }
        //if we're in a different sequence from the last click
        if (newAudioTrackSeqID != oldAudioTrackSeqID){
          oldAudioTrackSeqID = newAudioTrackSeqID;
          //reset options for audiotrack list
          $("#audioTrackOptions").replaceWith(emptyAudioTrackList.clone());
          // set audio track options, and then set tile options for that track
          setAudioTrackOptions();
        }
        else {
          // audiotrack was changed but same sequence, so don't update audiotrack options
          setTileOptions();
        }

      } catch (error) {
        alert("No sequence selected.");
        newAudioTrackSeqID = 0;
      }
    });	
  });

  // dynamically creates the HTML options for tile selector
  function setTileOptions(){
    var newAudioTrack;
    var selectedAudioTrack = $("#audioTrackOptions").val();
    //alert("selected track " + selectedAudioTrack);
    var cs = new CSInterface;	
    // get return value from countSegments() in jsx for user's selected track
    cs.evalScript('$.runScript.countSegments(' + selectedAudioTrack + ')', function(returnString){
      var numClips = 0;
      // parse JSON return value
      try {
        if (returnString && typeof returnString != "undefined")
           numClips = JSON.parse(returnString);
        //alert("numclips " + numClips);
      }
      catch (error) {
        //alert(error);
      }
      //reset options for the two tile lists
      $("#startTileOptions").replaceWith(emptyStartTileList.clone());
      $("#endTileOptions").replaceWith(emptyEndTileList.clone());
      // add option elements to HTML
      for (var i = 0; i < numClips; i++){
        // set default selection for start to 1, and for end to last tile
        if (i == 0){
          $("#startTileOptions").append(new Option(i + 1, i + 1, true, true));
          $("#endTileOptions").append(new Option(i + 1, i + 1));
        }
        else if (i == numClips - 1){
          $("#startTileOptions").append(new Option(i + 1, i + 1));
          $("#endTileOptions").append(new Option(i + 1, i + 1, true, true));
        }
        else{
          $("#startTileOptions").append(new Option(i + 1, i + 1));
          $("#endTileOptions").append(new Option(i + 1, i + 1));
        }
      }
    });
  }

  // when audioTrack selector is clicked, refresh it with the # of tracks
  $(".tileSelect").click(function () {
    var newTileSeqID;
    var newAudioTrack;
    //alert("in tileselect");

    // get sequence ID from getSequenceId in JSX
    var cs = new CSInterface;	
    cs.evalScript('$.runScript.getSequenceId()', function(returnString){
      // parse JSON return value
      try {
        newTileSeqID = JSON.parse(returnString);
        newAudioTrack = $("#audioTrackOptions").val();
        //if this is the first click, set it
        if (oldTileSeqID == 0){
          //alert("first time here");
          oldTileSeqID = newTileSeqID;
        }
        //if we're in a different sequence from the last click
        if (newTileSeqID != oldTileSeqID){
          //alert("in the mainframe");
          oldTileSeqID = newTileSeqID;
          oldAudioTrack = newAudioTrack;
          setTileOptions();
        }

      } 
      catch (error) {
        alert("No sequence selected.");
        newTileSeqID = 0;
      }
    });	
  });

  // button clicks
  $(".fa-stop-circle").click(function () {
    var cs = new CSInterface;			
    cs.evalScript('$.runScript.stopExporter()')
  });

  $(".fa-info-circle").click(function(){
    $("#infoModal").slideToggle();
  });

  $(".fa-info-circle").hover(function () {
    $(this).animate({color: "#1cf4ff"});
    //$("#infotooltip").css("visibility", "visible");
  }, function(){
    $(this).animate({color:  "white"});
    //$("#infotooltip").css("visibility", "hidden");
  });

  $('[data-toggle="infoTooltip"]').tooltip({
    trigger : 'hover'
  });
  $('[data-toggle="stopTooltip"]').tooltip({
    trigger : 'hover'
  });

  $("#clickForLink").click(function(){
    $(this).animate({color: "#1cf4ff"});
    try {
      // copy hidden text
      $("#manualLink").show();
      $("#manualLink").focus();
      $("#manualLink").select();
      document.execCommand('copy');
      $("#manualLink").hide();
      $("#copiedConfirmation").slideDown()
      //reset the window
      setTimeout(function (){
        $("#copiedConfirmation").slideUp();
      }, 2000);
    } catch (err) {
      console.error('Fallback: Oops, unable to copy', err);
    }
    $(this).animate({color: "white"});
  });

  // $('[data-toggle="exporterRefreshTooltip"]').tooltip({
  //     trigger : 'hover'
  // });
  $("#exportRefreshButton").hover(function () {
      $(this).animate({color: "#1cff73"});
      //$("#exporterRefreshTooltip").css("visibility", "visible");
  }, function(){
      $(this).animate({color:  "white"});
      //$("#exporterRefreshTooltip").css("visibility", "hidden");
  });
  $("#exportRefreshButton").click(function () {
      $("#audioTrackOptions").replaceWith(emptyAudioTrackList.clone());
      setAudioTrackOptions();
  });

  // $('[data-toggle="runExporterTooltip"]').tooltip({
  //   trigger : 'hover'
  // });
  $("#runExporterButton").hover(function () {
      $(this).animate({color: "#ff0000"});
      //$("#runExporterTooltip").css("visibility", "visible");
  }, function(){
      $(this).animate({color:  "white"});
      //$("#runExporterTooltip").css("visibility", "hidden");
  });

  $("#exporterButton").click(function(){
    
      $("#exportControls").slideToggle();
      var originalColor = $(this).css("background-color");
      if (originalColor == "rgba(0, 0, 0, 0)"){
        $(this).animate({backgroundColor: "rgba(0, 0, 0, .3)"}, 300);
        $(this).css("background-color", "rgba(0, 0, 0, .3)");
      }
      else {
        $(this).animate({backgroundColor: "rgba(0, 0, 0, 0)"}, 300);
        $(this).css("background-color", "rgba(0, 0, 0, 0)");
      }

      // get sequence size for Thumbnail exporter
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

  });

});
