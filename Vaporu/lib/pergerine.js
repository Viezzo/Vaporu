$(document).ready(function() {

    window.selectedAudio = {
        previousID : "",
        name : "",
        downloadURL : ""
    }

    $("#pergerineButton").click(function(){

        $("#pergerineControls").slideToggle();
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

    $("#loginButton").click(function(){
        $('#loadingSpinner').addClass('spinner');
        connectToPergerine();
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
        var defaultTable = '<tr id="audioResultsHeader"><th>Name</th><th>Duration</th></tr>'
        $('#audioResults').empty(); 
        $('#audioResults').append(defaultTable);
        if (searchTag.length > 0) {
            $('#loadingSpinner').addClass('spinner');
            queryForTag(searchTag);
        }
    });

    $(document).on('click', '.searchResult', function(){ 
        var fileName = $(this).attr("data-name");
        if (window.selectedAudio.previousID.length > 0)
            $('#' + window.selectedAudio.previousID).css("background-color", "rgba(0, 0, 0, 0)"); // make background transparent

        if ($(this).attr('id') == window.selectedAudio.previousID) {
            window.selectedAudio.name = ""; // deselection
            window.selectedAudio.previousID = "";
            window.selectedAudio.downloadURL = "";
        }
        else { //new selection
            url = getSoundURL(fileName, true);
            window.selectedAudio.name = fileName;
            //lert(window.selectedAudio.downloadURL);
            $(this).css("background-color", "rgba(20, 90, 180, 1)"); // make blue
            window.selectedAudio.previousID = $(this).attr('id');
        }

    });

    function getSoundURL(aacName, play){
        var storageRef = firebase.storage().ref();
        var aacRef = storageRef.child(aacName);
        aacRef.getDownloadURL().then(function(url) {
            if (play){
                var audioPreviewLink = '<audio controls id="audioPlayer"><source src="' + url + '" type="audio/aac"></audio>'
                $('#audioPlayerContainer').empty();
                $('#audioPlayerContainer').append(audioPreviewLink);
                var player = document.getElementById("audioPlayer"); 
                player.play(); 
            }
            window.selectedAudio.downloadURL = url;
        }).catch(function(error) { alert(error) });
    }

    $("#importSoundButton").click(function(){
        var aacUrl = window.selectedAudio.downloadURL;
        if (aacUrl.length == 0) {
            alert('Click on an audio file to import it.');
            return 0;
        }
        var cs = new CSInterface;	
        cs.evalScript('$.runScript.createSoundFolder()', function(soundFolderPath){
            if (typeof soundFolderPath == 'string') { // folder name returned
                var xhr = new XMLHttpRequest();
                xhr.responseType = 'blob';
                xhr.onload = async function(event) {
                    aacName = window.selectedAudio.name;
                    var blob = xhr.response;
                    var fullFilePath = soundFolderPath + "/" + aacName;
                    await writeBlobToFile(blob, fullFilePath);
                    //insert to Premiere
                    //alert(fullFilePath)
                    var selectedTrack = 2;
                    cs.evalScript('$.runScript.pigeonInsertSound(' 
                    + JSON.stringify(selectedTrack) + ','
                    + JSON.stringify(fullFilePath) + ','
                    + JSON.stringify(aacName) + 
                    ')', function(returnString){
                    if (typeof returnString == 'string') { // folder name returned
                        
                    }
                });
                };
                xhr.open('GET', aacUrl);
                xhr.send();


                //alert(downloadedSoundPath)
                // cs.evalScript('$.runScript.pigeonInsertSound(' 
                //     + JSON.parse(selectedTrack) + ','
                //     + JSON.parse(downloadedSoundPath) + ','
                //     + JSON.parse(soundFileName) + ')', function(returnString){
                //     if (typeof returnString == 'string') { // folder name returned
        
                //     }
                // });
            }
        });
            
    });

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

    function connectToPergerine(){
        // Your web app's Firebase configuration
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
        $("#pigeonUser").val("adrian@test.com");
        $("#pigeonPass").val("testing");

        email = $("#pigeonUser").val();
        password = $("#pigeonPass").val();

        firebase.auth().signInWithEmailAndPassword(email, password).then(function(firebaseUser) {
            $("#pigeonLogin").hide();
            $("#pigeonWindow").show();
            $('#loadingSpinner').removeClass('spinner');
        }).catch(function(error) { alert(error)});
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
                    if (resultName.length > 80)
                        resultName = resultName.substring(0, 100) + "...";
                    $('#audioResults').append( 
                        "<tr id=" + doc.id +
                        " data-name='" + doc.data().fileName + "'" +
                        " class='searchResult'>" +
                        "<td class='audioSearchResultName'>" + resultName  + "</td>" +
                        "<td>" + doc.data().duration + "</td></tr>");
                });
                $('#loadingSpinner').removeClass('spinner');

            })
            .catch(function(error) {
                console.log("Error getting documents: " + error);
        });
    }
});
