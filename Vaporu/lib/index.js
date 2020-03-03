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

  //FOR FOLEY PADS
  var globalFoleyPads = [];

  // dynamically creates the HTML options for Audio Track selector
  function setAudioTrackOptions(){
    var cs = new CSInterface;	
    // get return value from countTracks() in jsx
    cs.evalScript('$.runScript.countTracks()', function(returnString){
      var numTracks;
      // parse JSON return value
      try {
        numTracks = JSON.parse(returnString);
      } catch (error) {
        alert(error);
        numTracks = 2;
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
    var newAudioTrackSeqID;

    // get sequence ID from getSequenceId in JSX
    var cs = new CSInterface;	
    cs.evalScript('$.runScript.getSequenceId()', function(returnString){
      // parse JSON return value
      try {
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
        alert(error);
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
      var numClips;
      // parse JSON return value
      try {
        numClips = JSON.parse(returnString);
        //alert("numclips " + numClips);
      } catch (error) {
        alert(error);
        numClips = 0;
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
        //alert("seqID "+ newTileSeqID + " track is " + newAudioTrack);
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

      } catch (error) {
        alert(error);
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

  $(".fa-cog").click(function(){
    $("#controls").slideToggle();
  });

  $(".fa-info-circle").hover(function () {
    $(this).animate({color: "#1cf4ff"});
    $("#infotooltip").css("visibility", "visible");
  }, function(){
    $(this).animate({color:  "white"});
    $("#infotooltip").css("visibility", "hidden");
  });

  $(".fa-cog").hover(function () {
    $(this).animate({color: "#1cff73"});
    $("#controlstooltip").css("visibility", "visible");
  }, function(){
    $(this).animate({color: "white"});
    $("#controlstooltip").css("visibility", "hidden");
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

  $("#foleyBox").click(function(){
    var audioSrc = "/Volumes/V01/Xchange/forkmedia/201909/businessinsider_d6e30771_f0.wav";

  });

  // display grid
  $("#gridButton").click(function(){
    //$("#infotooltip").css("display", "grid");
    $("#gridModal").slideToggle();
    var cs = new CSInterface;	
    cs.evalScript('$.runScript.gridInit()', function(returnString) {
      try {
        // alert(returnString);
        var bankArray = returnString.split(',');
        globalFoleyPads = bankArray;
        // get just the names (odd indexes) of the banks
        for (var i = 0; i < bankArray.length; i+=2) {
          $("#foleyBankOptions").append(new Option(bankArray[i], bankArray[i]));
        }
        setPadsColor("Wooshes");

      } catch (error) {
        alert(error);
      }
    });
    
  });

  function setPadsColor(bankName){
    var bankSize = globalFoleyPads[globalFoleyPads.indexOf(bankName) + 1];
    for (var i = bankSize; i < 9; i++){
      var thisPad = $(".grid-pad:eq(" + i + ")");
      thisPad.css("background-color", "#ff1500");
    }
  }

  // 
  $(".grid-pad").click(function(){
    // get the number of the pad clicked
    pad_number = $(this).attr("data-padNum");
    // cut previous animation 
    $(this).stop(1,1);
    //var audioFilePath = "./businessinsider_d6e30771_f0.wav";
    //$("source").attr("src", "./businessinsider_d6e30771_f0.wav");
    
    var cs = new CSInterface;	
    cs.evalScript('$.runScript.getPadSound(' + (pad_number-1) + ' )', function(returnString) {
      try {
        //alert(returnString);
        var audio = new Audio(returnString);
        audio.play();

      } catch (error) {
        alert(error);
      }
    });
    


    // light up pad
    var originalColor = $(this).css("background-color");
    $(this).animate({backgroundColor: "#1cf4ff"}, 50);
    $(this).animate({backgroundColor: "##00c59c"}, 500);
  });
  

});
