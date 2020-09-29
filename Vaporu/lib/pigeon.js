$(document).ready(function() {

    window.selectedAudio = {
        previousID : "",
        name : "",
        downloadURL : ""
    }

    //setAudioTrackOptions();

    function setAudioTrackOptions(){
        var cs = new CSInterface;	
        // get return value from countTracks() in jsx
        cs.evalScript('$.runScript.countAudioTracks()', function(returnString){
            var numTracks = 0;
            // parse JSON return value
            try {
                if (returnString && typeof returnString != "undefined"){
                    numTracks = JSON.parse(returnString);
                    // try retaining previous selection, if it exists
                    var previousSelectedTrack = $("#audioResultTrackOptions").val();
                    if (isNaN(parseInt(previousSelectedTrack))) //if we haven't set the tracks already
                        previousSelectedTrack = 1;

                    $("#audioResultTrackOptions").empty();
                    for (var i = 0; i < numTracks; i++) {
                        if (i == previousSelectedTrack - 1) // set default selection to last one
                            $("#audioResultTrackOptions").append(new Option(i + 1, i + 1, true, true));
                        else
                            $("#audioResultTrackOptions").append(new Option(i + 1, i + 1));
                    }
                }
            }
            catch (error) {
                alert("Couldn't count the number of tracks in this Sequence.");
            }
        });
    }

    $("#pigeonButton").click(function(){
        $("#pigeonControls").slideToggle();
        var originalColor = $(this).css("background-color");
        if (originalColor == "rgba(0, 0, 0, 0)"){
            $(this).animate({backgroundColor: "rgba(0, 0, 0, .3)"}, 300);
            $(this).css("background-color", "rgba(0, 0, 0, .3)");
            checkIfConnected();
        }
        else {
            $(this).animate({backgroundColor: "rgba(0, 0, 0, 0)"}, 300);
            $(this).css("background-color", "rgba(0, 0, 0, 0)");
        }
    });

    $("#loginButton").click(function(){
        $('#loadingSpinner1').addClass('spinner');
        $('#pigeonLoginErrorMessage').hide();
        connectToPigeon();
    });

    $("#audioSearchControlsButton").click(function(){
        if ($("#audioSearchControls").css('display') == "none")
            setAudioTrackOptions();
        $("#audioSearchControls").slideToggle();
    });

    $("#searchSoundsButton").click(function(){
        var searchTag = $("#audioSearch").val();
        var defaultTable = '<tr id="audioResultsHeader"><th>ID</th><th>Name</th></tr>'
        $('#audioResults').empty(); 
        $('#audioResults').append(defaultTable);
        queryForTag(searchTag);
    });

    $("#audioSearch").on("input", function(){
        var searchTag = $("#audioSearch").val();
        // var defaultTable = '<tr id="audioResultsHeader"><th>Name</th><th>Duration</th></tr>'
        $('#audioResults').empty(); 
        // $('#audioResults').append(defaultTable);
        if (searchTag.length > 0) {
            $('#loadingSpinner2').addClass('spinner');
            queryForTag(searchTag);
        }
    });

    $(document).on('click', '.searchResult', function(event){ 
        // click on the download button
        if ($(event.target).parent().hasClass("searchResultDownloadingMessage"))
            downloadSound($(event.target).parent());
        else if ($(event.target).hasClass("searchResultDownloadingMessage")) 
            downloadSound($(event.target))
        else { // clicking on the sound to preview it
            var fileName = $(this).attr("data-name");
            if (window.selectedAudio.previousID.length > 0)
                //('#' + window.selectedAudio.previousID).css("background-color", "rgba(0, 0, 0, 0)"); // make background transparent
                $('#' + window.selectedAudio.previousID).css("border","1px solid #303030"); // make background transparent

            if ($(this).attr('id') == window.selectedAudio.previousID) {
                window.selectedAudio.name = ""; // deselection
                window.selectedAudio.previousID = "";
                window.selectedAudio.downloadURL = "";
            }
            else { //new selection
                url = getSoundURL(fileName, true);
                window.selectedAudio.name = fileName;
                //$(this).css("background-color", "rgba(20, 90, 180, 1)"); // make blue
                $(this).css("border","1px solid #0084ff"); // make blue
                window.selectedAudio.previousID = $(this).attr('id');
            }
        }

    });

    async function getSoundURL(aacName, play){
        var storageRef = firebase.storage().ref();
        var aacRef = storageRef.child(aacName);
        await aacRef.getDownloadURL().then(function(url) {
            if (play){
                //var audioPreviewLink = '<audio id="audioPlayer" class="mejs__player"><source src="' + url + '" type="audio/aac"></audio>'
                //$('#audioPlayerContainer').empty();
                var player = document.getElementById("audioPlayer"); 
                player.setSrc(url);
                player.play(); 
            }
            window.selectedAudio.downloadURL = url;
        }).catch(function(error) { alert(error) });
    }

    async function downloadSound(downloadButton){
        var buttonColor = downloadButton.css("color");
        if (buttonColor == "rgb(255, 255, 255)" || buttonColor == "rgb(255, 103, 89)"){ // if the download button is white OR red
            var aacFileName = downloadButton.parent().attr("data-name");

            var cs = new CSInterface;	
            cs.evalScript('$.runScript.checkIfSoundAlreadyDownloaded(' + JSON.stringify(aacFileName)+ ')', async function(alreadyDownloaded){
                if (alreadyDownloaded == "true") { // folder name returned
                    downloadButton.animate({color: "rgba(89, 255, 117, 1)"}, 300);
                    downloadButton.next().slideDown();
                    downloadButton.next().html('<i>This sound already exists on your computer.</i>');
                    downloadButton.next().css("color", 'rgba(89, 255, 117, 1)');
                    setTimeout(function(){
                        downloadButton.next().slideUp();
                    }, 3000);
                    return 0;
                }
                downloadButton.animate({color: "rgba(255, 214, 89, 1)"}, 300);
                downloadButton.next().slideDown();

            // ~~~~~ GET THE RIGHT AAC LINK ~~~~~~~  
                var aacUrl;
                if (downloadButton.parent().attr('id') == window.selectedAudio.previousID) // if import button clicked on the last previewed sound, just get that url
                    aacUrl = window.selectedAudio.downloadURL;
                else { // get the url of this sound for the first time
                    var prevUrl = window.selectedAudio.downloadURL;
                    await getSoundURL(downloadButton.parent().attr("data-name"), false);
                    aacUrl = window.selectedAudio.downloadURL;
                    if (aacUrl == prevUrl) { // we still are getting the previous url for some reason.
                        alert("Couldn't get the download URL for that sound. Try previewing it first.");
                        return 0;
                    }
                }
                if (typeof aacUrl == 'undefined' || aacUrl.length == 0) {
                    alert("Couldn't get the download URL for that sound.");
                    return 0;
                }
            // ~~~~~ CREATE FOLDER AND DOWNLOAD AAC ~~~~~~~  
                cs.evalScript('$.runScript.createSoundFolder()', function(soundFolderPath){
                    if (typeof soundFolderPath == 'string') { // folder name returned
                        var xhr = new XMLHttpRequest();
                        xhr.responseType = 'blob';
                        xhr.onload = async function(event) {
                            var blob = xhr.response;
                            var fullFilePath = soundFolderPath + "/" + aacFileName;
                            await writeBlobToFile(blob, fullFilePath);
                        //~~~~~ INSERT TO PREMIERE ~~~~~~~  
                            var selectedTrack = 1;
                            var doInsert = $('#audioResultImport').prop('checked');
                            selectedTrack = $('#audioResultTrackOptions').val();
                            cs.evalScript('$.runScript.pigeonInsertSound(' 
                            + JSON.stringify(selectedTrack) + ','
                            + JSON.stringify(fullFilePath) + ','
                            + JSON.stringify(doInsert) + ','
                            + JSON.stringify(aacFileName) + 
                            ')', function(returnString){
                                if (typeof returnString == 'string') { // folder name returned
                                    if (returnString == "Imported") {
                                        downloadButton.css("color", 'rgba(89, 255, 117, 1)');
                                        downloadButton.next().html('<i>File imported.</i>');
                                        downloadButton.next().css("color", 'rgba(89, 255, 117, 1)');
                                        setTimeout(function(){
                                            downloadButton.next().slideUp();
                                        }, 1500);
                                    }
                                    else if (returnString == "Imported but failed to insert") {
                                        downloadButton.css("color", "rgba(255, 214, 89, 1)");
                                        downloadButton.next().html("<i>Imported but couldn't insert to track</i>");
                                        downloadButton.next().css("color", '"rgba(255, 214, 89, 1)"');
                                    }
                                    else {
                                        downloadButton.css("color", 'rgba(255, 103, 89, 1');
                                        downloadButton.next().html('<i>' + returnString + '</i>');
                                        downloadButton.next().css("color", 'rgba(255, 103, 89, 1');
                                    }
                                }
                            });
                        };
                        xhr.open('GET', aacUrl);
                        xhr.send();
                    }
                });
            });
        }
    }

    async function writeBlobToFile(blob, fileName) {
        var reader = new FileReader();
        reader.onload = async function () {
            try {
                var dataUrl = reader.result;
                var base64 = dataUrl.split(',')[1];
                window.cep.fs.writeFile(fileName, base64, window.cep.encoding.Base64);
            }
            catch (error) {
                alert("Problem downloading file: " + error)
            }
        };
        reader.readAsDataURL(blob);
    }


    async function updateFileProgress(filePath, finalSize) {

        // $( function() { $( "#audioDownloadProgressbar" ).progressbar({ 
        //     value: 0,
        //     create: function(event, ui) {$(this).find('.ui-widget-header').css({'background-color':'blue'})}
        // }); });
        var timerId = setInterval(() =>  updateFileProgress2(fileName, blob.size), 1000);
        setTimeout(() => { clearInterval(timerId); alert('stop'); }, 0);
    }

    async function updateFileProgress2(filePath, finalSize) {
        var result = window.cep.fs.readFile(filePath);
        if (result.err == 0) {
            var filesize = result.size;
            if (typeof filesize != 'undefined') {
                if (blob.size == finalSize) {
                    return;
                }
                else {
                    var progress = filesize/ finalSize;
                    $( function() { $( "#audioDownloadProgressbar" ).progressbar({ value: progress }); });        
                }
            }}
        else {
            alert("failed to read file");
        }
    }

    function checkIfConnected() {

        console.log('checking if logged in already');
        if (firebase.apps.length > 0) {  
            firebase.auth().onAuthStateChanged(user => {
                if (user) {
                  console.log('user exists.')
                } else {
                    console.log('user does not exist.')
                }
            });
        }
        else 
            console.log('firebase not initialized yet')

            firebase.auth().onAuthStateChanged(user => {
                if (user) {
                  console.log('user exists.')
                } else {
                    console.log('user does not exist.')
                }
            });

        // firebase.auth().onAuthStateChanged(function(user) {
        //     console.log('authstatechange')
        //     if (user) {
        //         console.log('authstatechange')
        //     }
        // });
        //console.log(typeof firebase.auth())
    }

    function connectToPigeon(){
        // Your web app's Firebase configuration
        console.log(firebase)

        if (!firebase.apps.length) {  
            console.log('new login')      
            var firebaseConfig = {
                apiKey: "AIzaSyARENKSyVVw79cVQL7w-HeznyqYG4JcQxk",
                authDomain: "pigeon-e3d56.firebaseapp.com",
                databaseURL: "https://pigeon-e3d56.firebaseio.com",
                projectId: "pigeon-e3d56",
                storageBucket: "pigeon-e3d56.appspot.com", // insider-six-library
                messagingSenderId: "149139118447",
                appId: "1:149139118447:web:f4da47532092d0253e309a",
                measurementId: "G-PVJVV4X49X"
            };
            // Initialize Firebase
            firebase.initializeApp(firebaseConfig);
        }

        email = $("#pigeonUser").val();
        password = $("#pigeonPass").val();

        firebase.auth().signInWithEmailAndPassword(email, password).then(function(firebaseUser) {
            $("#pigeonLogin").hide();
            $("#pigeonWindow").show();
            $('#loadingSpinner1').removeClass('spinner');

            console.log('ok in. user:')
            console.log(firebaseUser)


            $('#audioPlayer').mediaelementplayer({
                defaultAudioWidth: '250',
                stretching: 'none',
                //features:['current','progress', 'duration'],
                features:['playpause','progress', 'current']
            });
            
        }).catch(function(error) { 
            $('#loadingSpinner1').removeClass('spinner');
            $('#pigeonLoginErrorMessage').show();

            //alert(error)
        });
    }


    function queryForTag(tag) {
        var db = firebase.firestore();
        
        db.collection("audioMasterLibrary").where("tags", "array-contains", tag.toLowerCase())
            .get()
            .then(function(querySnapshot) {
            $("#searchResultsNumberContainer").show();
            $("#searchResultsNumber").text(querySnapshot.size);
                querySnapshot.forEach(function(doc) {
                    var resultName = doc.data().fileName;
                    // if (resultName.length > 60)
                    //     resultName = resultName.substring(0, 60) + "...";
                    $('#audioResults').append( 
                        "<div class=searchResult " +
                        "id=" + doc.id +
                        " data-name='" + doc.data().fileName + "'>" +
                            "<span class=searchResultName>" + 
                                resultName + "</span>" +
                            "<span class=searchResultDuration>" + 
                                doc.data().duration + "</span>" +
                            "<span class=searchResultDownloadingMessage><i class='fas fa-arrow-alt-circle-down'></i></span>" +
                            "<div class=searchResultStatusMessage><i>" + 'Downloading...' + "</i></div>" +
                        "</div>");
                });
                $('#loadingSpinner2').removeClass('spinner');

            })
            .catch(function(error) {
                console.log("Error getting documents: " + error);
        });
    }
});
