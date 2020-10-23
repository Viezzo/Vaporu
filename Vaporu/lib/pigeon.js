$(document).ready(function() {

    window.selectedAudio = {
        previousID : "",
        name : "",
        downloadURL : ""
    }

    window.queryResults = {
        hiddenResults : [],
        lastVisibleDoc : undefined,
        lastChosenLibraries : undefined,
        lastOrderBy : undefined,
        lastAscOrDesc : undefined
    }

    window.pigeonStatus = {
        hasBeenOpened : false
    }
    
    // if audio library is already opened on panel load, set it up
    if ($("#pigeonButton").css("background-color") != "rgba(0, 0, 0, 0)") {
        startPigeon();
        setAudioTrackOptions();
        window.pigeonStatus.hasBeenOpened = true;
    }

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
        if (originalColor == "rgba(0, 0, 0, 0)"){ // open the panel
            $(this).animate({backgroundColor: "rgba(0, 0, 0, .3)"}, 300);
            $(this).css("background-color", "rgba(0, 0, 0, .3)");
            // if this is the first time the audio library app is being opened
            if (window.pigeonStatus.hasBeenOpened == false) {
                startPigeon();
                setAudioTrackOptions();
                window.pigeonStatus.hasBeenOpened = true;
            }
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
        if ($("#audioSearchControls").css('display') == "none"){
            // setAudioTrackOptions();
        }
        $("#audioSearchControls").slideToggle();
    });

    // search when something new is typed 
    $("#audioSearch").on("input", function(){
        var searchTag = $("#audioSearch").val();
        if (searchTag.length > 0) 
            queryForNewTag(searchTag, getChosenLibraries());
    });
 
    // search when sort order is changed
    $("#audioLibrarySearchOrder").on("change", function(){
        var searchTag = $("#audioSearch").val();
        if (searchTag.length > 0) 
            queryForNewTag(searchTag, getChosenLibraries());
    });

    // search when audio library changes
    $(document).on('click', '.audioLibraryChoice', function(event){ 
        var bgColor = $(this).css("background-color");
        if (bgColor == "rgb(64, 64, 64)"){
            $(this).css("background-color","rgba(0, 0, 0, 0)");
            $(this).css("color","rgb(150, 150, 150)");
        }
        else{
            $(this).css("background-color","rgb(64, 64, 64)");
            $(this).css("color","white");
        }
        var searchTag = $("#audioSearch").val();
        if (searchTag.length > 0) {
            $('#loadingSpinner2').addClass('spinner');
            queryForNewTag(searchTag, getChosenLibraries());
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
                var player = document.getElementById("audioPlayer"); 
                player.setSrc(url);
                player.play(); 
            }
            window.selectedAudio.downloadURL = url;
        }).catch(function(error) { alert('Error getting the download link for that sound. Please report it to @atraviezo.') });
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
                            insertToPremiere(fullFilePath, aacFileName, downloadButton);
                        };
                        xhr.open('GET', aacUrl);
                        xhr.send();
                    }
                });
            });
        }
    }

    function insertToPremiere(fullFilePath, aacFileName, downloadButton) {
        var selectedTrack = 1;
        var doInsert = $('#audioResultImport').prop('checked');
        selectedTrack = $('#audioResultTrackOptions').val();
        var cs = new CSInterface;	
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
                else { //try getting it again - could just take a second for the file to appear
                    setTimeout(function(){  // wait half a second for the file to appear. If it doesn't, proceed
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
                                    alert("Failed to import sound. Couldn't find the file at: " + fullFilePath);
                                    downloadButton.css("color", 'rgba(255, 103, 89, 1');
                                    downloadButton.next().html('<i>' + returnString + '</i>');
                                    downloadButton.next().css("color", 'rgba(255, 103, 89, 1');
                                }
                            }
                        });
                    }, 500); // wait half a second, then try again
                }
            }
        });
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

    function startPigeon() {
        $("#pigeonLogin").hide();
        $('#loadingSpinner3').addClass('spinner');

        var cs = new CSInterface;	
        cs.evalScript('$.runScript.getPigeonCredentials()', function(returnString){
            try {
                if (typeof returnString == "string" && returnString.length > 0){
                    var theJSON = JSON.parse(returnString)
                    var a = theJSON.email;
                    var b = theJSON.password;
                    $("#pigeonUser").val(a);
                    $("#pigeonPass").val(b);

                    connectToPigeon()
                }
            }
            catch (error) {
                alert(error);
            }
        });
    }

    function connectToPigeon(){
        if (!firebase.apps.length) {  
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

        var a = $("#pigeonUser").val();
        var b = $("#pigeonPass").val();

        firebase.auth().signInWithEmailAndPassword(a, b).then(function(firebaseUser) {
            $("#pigeonLogin").hide();
            $("#pigeonWindow").show();
            $('#loadingSpinner1').removeClass('spinner');
            $('#loadingSpinner3').removeClass('spinner');

            $('#audioPlayer').mediaelementplayer({
                defaultAudioWidth: '250',
                stretching: 'none',
                features:['playpause','progress', 'current']
            });

            setSearchOptions();
            
        }).catch(function(error) { 
            $("#pigeonLogin").show();
            $('#loadingSpinner1').removeClass('spinner');
            $('#loadingSpinner3').removeClass('spinner');
            $('#pigeonLoginErrorMessage').show();
        });
    }

    // if a new library is added, manually add it as a new doc's ID in pigeon Cloud Firestore > existingLibraryNames
    function setSearchOptions() {
        var db = firebase.firestore();
        var libraryNames = [];
        db.collection("existingLibraryNames").get()
            .then(function(querySnapshot) {
                querySnapshot.forEach(function(doc) {
                    libraryNames.push(doc.id);
                });
                $("#audioSearchLibraryOptions").empty();
                for (i = 0; i < libraryNames.length; i++) {
                    var newLibraryElement = '<span class="audioLibraryChoice">' + libraryNames[i] + '</span>'
                    $('#audioSearchLibraryOptions').append(newLibraryElement);
                }
            })
            .catch(function(error) {
                console.log("Error getting Library options: " + error);
        });
    }

    function getChosenLibraries(){
        var chosenLibraries = [];
        $('.audioLibraryChoice').each(function() {
            if ($(this).css("background-color") == "rgb(64, 64, 64)")
                chosenLibraries.push($(this).text())
        });
        return chosenLibraries;
    }

    function executeQuery(tag, chosenLibraries, orderBy, ascOrDesc, searchLimit, lastVisibleDoc, newSearch) {
        // only query if we have libraries to search in
        if (chosenLibraries.length == 0){
            $('#audioResults').empty(); 
            $("#searchResultsNoLibraries").show();
            $('#loadingSpinner2').removeClass('spinner');
            return 0;
        }
        $("#searchResultsNoLibraries").hide();
        $('#loadingSpinner2').addClass('spinner');

        var db = firebase.firestore();
        // initiate query
        if (newSearch == true){
            if (tag.trim() == '') {
                db.collection("audioMasterLibrary")
                    .where("library", "in", chosenLibraries)
                    .orderBy(orderBy, ascOrDesc)
                    .limit(searchLimit)
                    .get()
                    .then(function(querySnapshot) {
                        $("#searchResultsVisibleNumber").text(0);
                        $('#audioResults').empty(); 
                        querySnapshot.forEach(function(doc) {
                            addSearchResultFromDoc(doc);
                        });
                        lastVisibleDoc = querySnapshot.docs[querySnapshot.docs.length-1];
                        refreshLatestQueryResults(lastVisibleDoc, tag, chosenLibraries, orderBy, ascOrDesc, querySnapshot.size);    
                    })
                    .catch(function(error) {
                        console.log("Error getting documents: " + error);
                });

                // get the size of the search result
                db.collection("audioMasterLibrary")
                    .where("library", "in", chosenLibraries)
                    .get()
                    .then(function(querySnapshot) {
                        $("#searchResultsTotalNumber").text(querySnapshot.size);
                    })
                    .catch(function(error) {
                        console.log("Error getting documents: " + error);
                });
            }
            else {
                db.collection("audioMasterLibrary")
                .where("tags", "array-contains", tag.toLowerCase())
                .where("library", "in", chosenLibraries)
                .orderBy(orderBy, ascOrDesc)
                .limit(searchLimit)
                .get()
                    .then(function(querySnapshot) {
                        $("#searchResultsVisibleNumber").text(0);
                        $('#audioResults').empty(); 
                        querySnapshot.forEach(function(doc) {
                            addSearchResultFromDoc(doc);
                        });
                        var lastVisibleDoc = querySnapshot.docs[querySnapshot.docs.length-1];
                        refreshLatestQueryResults(lastVisibleDoc, tag, chosenLibraries, orderBy, ascOrDesc, querySnapshot.size);    
                    })
                    .catch(function(error) {
                        console.log("Error getting documents: " + error);
                    });
                    // get the size of the search result
                    db.collection("audioMasterLibrary")
                    .where("tags", "array-contains", tag.toLowerCase())
                    .where("library", "in", chosenLibraries)
                    .get()
                    .then(function(querySnapshot) {
                        $("#searchResultsTotalNumber").text(querySnapshot.size);
                    })
                    .catch(function(error) {
                        console.log("Error getting documents: " + error);
                });
            }
        }
        else { // continue to paginate query results. same as above, but with startAfter
            if (typeof lastVisibleDoc != 'undefined'){
                if (tag.trim() == '') {
                    db.collection("audioMasterLibrary")
                        .where("library", "in", chosenLibraries)
                        .orderBy(orderBy, ascOrDesc)
                        .limit(searchLimit)
                        .startAfter(lastVisibleDoc)
                        .get()
                        .then(function(querySnapshot) {
                            querySnapshot.forEach(function(doc) {
                                addSearchResultFromDoc(doc);
                            });
                            var lastVisibleDoc = querySnapshot.docs[querySnapshot.docs.length-1];
                            refreshLatestQueryResults(lastVisibleDoc, tag, chosenLibraries, orderBy, ascOrDesc, querySnapshot.size);    
                        })
                        .catch(function(error) {
                            console.log("Error getting documents: " + error);
                    });
                }
                else {
                    db.collection("audioMasterLibrary")
                    .where("tags", "array-contains", tag.toLowerCase())
                    .where("library", "in", chosenLibraries)
                    .orderBy(orderBy, ascOrDesc)
                    .startAfter(lastVisibleDoc)
                    .limit(searchLimit)
                    .get()
                    .then(function(querySnapshot) {
                            querySnapshot.forEach(function(doc) {
                                addSearchResultFromDoc(doc);
                            });
                            var lastVisibleDoc = querySnapshot.docs[querySnapshot.docs.length-1];
                            refreshLatestQueryResults(lastVisibleDoc, tag, chosenLibraries, orderBy, ascOrDesc, querySnapshot.size);    
                        })
                        .catch(function(error) {
                            console.log("Error getting documents: " + error);
                        });
                }
            }
            else {
                console.log('ERROR. No last visible document available to start from.')
            }
        }
    }

    function refreshLatestQueryResults(lastVisibleDoc, tag, chosenLibraries, orderBy, ascOrDesc, queryResultSize) {
        window.queryResults.lastVisibleDoc = lastVisibleDoc;                
        window.queryResults.lastSearchTag = tag;
        window.queryResults.lastChosenLibraries = chosenLibraries;
        window.queryResults.lastOrderBy = orderBy;
        window.queryResults.lastAscOrDesc = ascOrDesc;

        var currentDisplayingNumber = parseInt($("#searchResultsVisibleNumber").text());
        $("#searchResultsVisibleNumber").text(currentDisplayingNumber + queryResultSize);
        $('#loadingSpinner2').removeClass('spinner');
    }

    function queryForNewTag(tag, chosenLibraries) {
        var orderBy = "fileName";
        var ascOrDesc = "asc";

        var audioSearchVal = $("#audioLibrarySearchOrder").val();
        if (audioSearchVal){
            var audioSearchOrder = audioSearchVal.split(' ');
            if (audioSearchOrder.length == 2){
                orderBy = audioSearchOrder[0] == "fileName" ? "fileName" : "duration";
                ascOrDesc = audioSearchOrder[1] == "asc" ? 'asc': "desc";
            }
        }
        var searchLimit = 100;
        executeQuery(tag, chosenLibraries, orderBy, ascOrDesc, searchLimit, undefined, true)
    }

    function addResultsOnScroll(){
        var lastVisibleDoc = window.queryResults.lastVisibleDoc;
        var tag = window.queryResults.lastSearchTag;
        var chosenLibraries = window.queryResults.lastChosenLibraries;
        var orderBy = window.queryResults.lastOrderBy;
        var ascOrDesc = window.queryResults.lastAscOrDesc;

        var currentlyShownResults = parseInt($("#searchResultsVisibleNumber").text());
        var totalResults = parseInt($("#searchResultsTotalNumber").text());
        if (totalResults > currentlyShownResults){ // only query again if we haven't found all the files
            if (typeof ascOrDesc != 'undefined' && 
            typeof orderBy != 'undefined' && 
            typeof chosenLibraries != 'undefined' && 
            typeof tag != 'undefined' && 
            typeof lastVisibleDoc != 'undefined') {
                var searchLimit = 100;
                executeQuery(tag, chosenLibraries, orderBy, ascOrDesc, searchLimit, lastVisibleDoc, false)
            }
        }
    }

    $("#searchResultsWindow").scroll(function (e) {
        var elem = $(e.currentTarget);
        if (elem[0].scrollHeight - elem.scrollTop() - elem.outerHeight() < 1) 
            addResultsOnScroll();
    });

    function addSearchResultFromDoc(doc){
        var resultName = doc.data().fileName;
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
    }
});
