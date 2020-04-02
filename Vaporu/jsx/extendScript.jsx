transcodesObject = {
	toReplace : []
};

buildSequenceObject = {
	latestStart : 0,
	latestEnd : 0
}

$.runScript = {

	countSegments: function(selectedAudioTrack) {
		var mainSequence = app.project.activeSequence;
		if (mainSequence && typeof mainSequence != "undefined")
			return mainSequence.audioTracks[selectedAudioTrack - 1].clips.numItems;
	},

	countAudioTracks: function() {
		var mainSequence = app.project.activeSequence;
		if (mainSequence && typeof mainSequence != "undefined")
			return mainSequence.audioTracks.numTracks;
	},

	countVideoTracks: function() {
		var mainSequence = app.project.activeSequence;
		if (mainSequence && typeof mainSequence != "undefined")
			return mainSequence.videoTracks.numTracks;
	},

	getSequenceId: function() {
		var mainSequence = app.project.activeSequence;
		if (mainSequence && typeof mainSequence != "undefined")
			return mainSequence.id;
	},

	stopExporter: function() {
		alert("Stopping the export.");
		STOPexport = false;
	},

	premiereAlert: function(errMsg){
		alert(errMsg);
	},

	resetSequenceBuilder: function() {
		buildSequenceObject.latestStart = 0;
		buildSequenceObject.latestEnd = 0;
	},

	getSequenceResolution: function() {
		var mainSequence = app.project.activeSequence;
		return [mainSequence.frameSizeHorizontal, mainSequence.frameSizeVertical];
	},

//--------------------------------------------------------------------------------------------------------------------------------------------------
	
	clearCache: function () {
		app.enableQE();
		var MediaType_ANY = "FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF";
		qe.project.deletePreviewFiles(MediaType_ANY);
		alert("All video and audio preview files deleted.");
	},

	generateProjectReport: function() {
		var mainSeq = app.project.activeSequence;
		var finalString = "";
		var seqFps = 0;
		var mainSeqSettings = mainSeq.getSettings();
		if (mainSeqSettings.videoDisplayFormat == 110)
			seqFps = 23.976;
		else if (mainSeqSettings.videoDisplayFormat == 102 || mainSeqSettings.videoDisplayFormat == 102)
			seqFps = 29.97;

		finalString += "User: " + $.runScript.getUserName() + " " + "\r\n";
		finalString += "Project: " + app.project.path + " " + "\r\n";
		finalString += "Premiere Version: " +  app.version + "x" + app.build + "\r\n";
		// finalString += "Preferences path: " + app.getPProPrefPath + "\r\n";
		finalString += "---------------------------------------------------------" + "\r\n";
		finalString += "Sequence Info for: " + mainSeq.name;
		finalString += " (" + mainSeq.frameSizeHorizontal + " x " + mainSeq.frameSizeVertical;
		finalString += " @ " + seqFps + "fps)" + "\r\n\r\n";

		var infoArray = [];
		var clipArray = [];

		for (i = 0; i < mainSeq.videoTracks.numTracks; i++){
			thisTrack = mainSeq.videoTracks[i];
			for (j = 0; j < thisTrack.clips.numItems; j++){
				var thisClip;
				if (typeof thisTrack.clips[j] != "undefined") 
					thisClip = thisTrack.clips[j].projectItem;
				if (thisClip && typeof thisClip != "undefined"){
					var thisCodec = "";
					var thisClipEntry = "";
					if (!thisClip.isOffline()){ //if the clip is valid and online, start testing it
						var clipFilename;
						var clipCodec;
						var resolutionAndPar;
						var framerate;
						var fileType = " ?";
						var path = thisClip.getMediaPath();

						if (typeof path != "string") // if path is invalid
							path = "?"

						if (app.isDocumentOpen()) { // get info
							if (ExternalObject.AdobeXMPScript == undefined) {
								ExternalObject.AdobeXMPScript = new ExternalObject("lib:AdobeXMPScript");
							}
							if (ExternalObject.AdobeXMPScript != undefined) {
								var projectMetadata = thisClip.getProjectMetadata();
								var xmp = new XMPMeta(projectMetadata);
								clipFilename = xmp.getProperty("http://ns.adobe.com/premierePrivateProjectMetaData/1.0/", "Column.Intrinsic.FileName");
								clipCodec = xmp.getProperty("http://ns.adobe.com/premierePrivateProjectMetaData/1.0/", "Column.PropertyText.Codec");
								resolutionAndPar = xmp.getProperty("http://ns.adobe.com/premierePrivateProjectMetaData/1.0/", "Column.Intrinsic.VideoInfo");
								framerate = xmp.getProperty("http://ns.adobe.com/premierePrivateProjectMetaData/1.0/", "Column.Intrinsic.MediaTimebase");
							}
						}
						
						if (typeof clipFilename != "undefined"){ // parse filename for filetype
							if (typeof clipFilename.value != "undefined"){
								var lastIndex = clipFilename.value.lastIndexOf(".");
								filetype = (clipFilename.value.substr(lastIndex + 1)).replace(/\s/g, '');
							}
						}
						// ADD THE VALUES IF THEY ARE VALID
						thisCodec += filetype + " | "; 
						thisCodec += typeof clipCodec.value != "undefined" ? clipCodec.value : " ? | "; 
						resolutionAndPar = typeof resolutionAndPar != "undefined" ? resolutionAndPar : " ? | "; 
						framerate = typeof framerate != "undefined" ? framerate : " ? | ";
						var thisClipEntry = thisClip.name + " | " + resolutionAndPar + " | " + framerate + " | " + path;
					}
					else { //clip is offline.
						thisCodec = "OFFLINE"; 
						thisClipEntry = thisClip.name;
					}
					var theIndex = infoArray.indexOf(thisCodec);
					if (theIndex > -1){ //IF WE ALREADY SET THIS KEY, ADD THIS CLIP TO IT
						var theClipNames = clipArray[theIndex];
						theClipNames += "\n    - " + thisClipEntry;
						clipArray[theIndex] = theClipNames;
					}
					else {// FIRST TIME SETTING.
						infoArray.push(thisCodec);
						clipArray.push("    - " + thisClipEntry);
					} 
				}
			}
		}
		for (i = 0; i < infoArray.length; i++){
			numberOfClips = clipArray[i].split("\n").length;
			finalString += numberOfClips + " clips of type " + infoArray[i] + ".\r\n" + clipArray[i] + "\r\n";
		}
		$.runScript.saveFile("sequenceReport_" + mainSeq.name, finalString, "txt", "NULL")
	},

	saveFile: function (filename, text, extension, folder) {
		
		var finalOutputPath = "NULL";
		var outputPath = folder;
		if (folder == "NULL")
			outputPath = Folder.selectDialog("Choose the output directory.");
		if (outputPath && typeof outputPath != "undefined"){
			var outputFileName = outputPath.fsName + "/" + filename + '_from_Vaporu.' + extension.toLowerCase();

			var outFile = new File(outputFileName);
			if (outFile) {
				outFile.open("w");
				outFile.encoding = "UTF-8";
				outFile.writeln(text);

				if (outFile){
					finalOutputPath = outputFileName;
					outFile.close();
				}
				else {
					alert("Error: file could not be saved.");
				}
			}
		}
		return outFile;
	},

	getUserName: function () {
		var homeDir = new File('~/');
		var userName = homeDir.displayName;
		homeDir.close();
		return userName;
	},
	

	relinkSelectedFiles: function(isProxy){
		var mainSeq = app.project.activeSequence;
		var errorArray = [];
		var selection = mainSeq.getSelection();
		if (selection.length == 0) {
			alert("No clips are selected for replacement.")
			return 0;
		}
		var replacementPath = Folder.selectDialog("Choose the folder your transcodes are in.");
		if (replacementPath && replacementPath != "undefined"){
			// to ensure that we don't repeatedly replace clips with the same projectItem
			var replaceIDs = [];
			// go through each media to replace, then replace it.
			for (var i = 0; i < selection.length; i ++) {
				//ensure that we're selecting a video
				var clipItem = selection[i].projectItem;
				if (typeof clipItem != "undefined" && selection[i].mediaType == "Video"){
					if (replaceIDs.indexOf(clipItem.nodeId) == -1){
						//ensure the projectItem can be changed
						if (clipItem.canChangeMediaPath()){
							var logNote;
							var isFromLogNote = false;
							var isFromFileName = false;
							if (app.isDocumentOpen()) {
								if (ExternalObject.AdobeXMPScript == undefined) {
									ExternalObject.AdobeXMPScript = new ExternalObject("lib:AdobeXMPScript");
								}
								if (ExternalObject.AdobeXMPScript != undefined) {
									var projectMetadata = clipItem.getProjectMetadata();
									var xmp = new XMPMeta(projectMetadata);
									logNote = xmp.getProperty("http://ns.adobe.com/premierePrivateProjectMetaData/1.0/", "Column.Intrinsic.LogNote");
								}
							}
							// if the new and old durations don't match, replace new clip with the old one again
							if (typeof logNote != "undefined"){
								// parse log note to find the recordID
								var recordIDsplit = logNote.value.split('"recordId":"');
								if(recordIDsplit.length == 2){
									var recordIDsplit2 = recordIDsplit[1].split('-')
									if(recordIDsplit2.length == 2)
										var theRecordID = recordIDsplit2[0]; // found the RecordID
									else {
										errorMessage = "Could not parse the log note for " + selection[i].name + ".";
										errorArray.push([selection[i].start.seconds, errorMessage]);
									}
								}
								else {
									errorMessage = "Could not parse log note for " + selection[i].name + ".";
									errorArray.push([selection[i].start.seconds, errorMessage]);
								}
							}
							else { // TRY FINDING THE RECORD ID FROM THE FILENAME
								var originalMediaPath = clipItem.getMediaPath();
								var theFile = File(originalMediaPath);
								if (theFile.exists){
									var nameSplit1 = theFile.name.split("businessinsider_");
									// try checking if the original name is a recordID
									if (nameSplit1.length == 2){
										nameSplit2 = nameSplit1[1].split("_");
										if (nameSplit2.length == 2)
											var theRecordID = nameSplit2[0]; // found the rid
									}
								}
							}
							if (typeof theRecordID != "undefined"){ // we have found the recordID
								var suffix = isProxy == true ? "r2" : "f0";
								var extension = isProxy == true ? "mp4" : "*";
								var fileName = "businessinsider_" + theRecordID + "_" + suffix + "." + extension;

								// create the fullReplacementPath variable, but modify it if this isn't a proxy.
								var fullReplacementPath = replacementPath.fsName + '/' + fileName;
								if (isProxy == false) {
									var resultFileArray = replacementPath.getFiles(fileName);
									if (typeof resultFileArray == "object" && resultFileArray.length == 1){
										var foundFile = resultFileArray[0];
										fullReplacementPath = foundFile.fsName;
									}
								}
								var errorMessage = (fullReplacementPath + " is not in your chosen directory.");
								if (File(fullReplacementPath).exists){
									// replace the clip with version in transcodes folder, then check its duration
									var replaceSuccess = clipItem.changeMediaPath(fullReplacementPath, true);
									// changemediapath() returns 1 if successful, which is inconsistent with the documentation
									if (replaceSuccess && replaceSuccess != "undefined")
										replaceIDs.push(clipItem.nodeId);
									else 
										errorArray.push([selection[i].start.seconds, errorMessage]);
									// whether or not the projectItem was changed, refresh the projectItem
									clipItem.refreshMedia();
								}
								else 
									errorArray.push([selection[i].start.seconds, errorMessage]);
							}
							else { // RECORDID IS NOT IN THE LOG NOTE OR FILENAME
								errorMessage = "No log note or MAM name is set for " + selection[i].name + ". It probably wasn't imported using the Xchange Panel or is not downloaded from the MAM.";
								errorArray.push([selection[i].start.seconds, errorMessage]);
							}
						}
						else {
							errorMessage = "Can't change media path for " + selection[i].name + ".";
							errorArray.push([selection[i].start.seconds, errorMessage]);
						}
					}
				}
			}
			if (replaceIDs.length == 1){
				var alertMessage = isProxy == true ? "proxy." : "original version."
				alert("1 file replaced with its " + alertMessage)
			}
			else {
				var alertMessage = isProxy == true ? "proxies." : "original versions."
				alert(replaceIDs.length + " files replaced their " + alertMessage)
			}
		}
		for (i = 0; i < errorArray.length; i++){
			// add new marker or append its comments to the previous one if it's also at time = 0, to avoid stacking markers
			var newMarker;
			var markerComments = "";
			// if there's a previous marker, and if it's at time = 0, set selected marker to that one
			var insertionTime = 0;
			if (mainSeq.markers.numMarkers > 0 && mainSeq.markers.getLastMarker().end.seconds == errorArray[i][0]){
				newMarker = mainSeq.markers.getLastMarker();
				markerComments = newMarker.comments;
			}
			// otherwise, create a new one
			else { 
				newMarker = mainSeq.markers.createMarker(errorArray[i][0]);
			}
			newMarker.name = "Vaporu: Replace Clip Alert";
			// add all comments to marker's previous comments
			markerComments += errorArray[i][1];
			newMarker.comments = markerComments;
			newMarker.type = "Chapter";
		}
	},

	createCustomMetadata: function (name, label, type) {
		var customMetadataSuccess = false;
		if (app.isDocumentOpen()) {
			var projectItem = app.project.rootItem.children[0];
			if (projectItem) {
				if (ExternalObject.AdobeXMPScript === undefined) {
					ExternalObject.AdobeXMPScript = new ExternalObject('lib:AdobeXMPScript');
				}
				if (ExternalObject.AdobeXMPScript !== undefined) { // safety-conscious!
					var projectMetadata = projectItem.getProjectMetadata();
					var xmp	= new XMPMeta(projectMetadata);
					var propertyExists = xmp.doesPropertyExist("http://ns.adobe.com/premierePrivateProjectMetaData/1.0/", label);
					// if the new property wasn't added before, add it.
					if (!propertyExists){
						var successfullyAdded = app.project.addPropertyToProjectMetadataSchema(name, label, type);
						var xmp	= new XMPMeta(projectMetadata);
						// check the schema again to see if it's now there
						if (successfullyAdded){
							var testLabel = $.runScript.setMetadataValue(projectItem, name, " ");
							propertyExists = testLabel == true ? true: false;
						}
					}
					if (propertyExists)
						customMetadataSuccess = true;
				}
			}
		}
		return customMetadataSuccess;
	},

	getMetadataValue: function (obj, metadataLabel){
		var resultData;
		if (app.isDocumentOpen()) {
			if (ExternalObject.AdobeXMPScript == undefined) {
				ExternalObject.AdobeXMPScript = new ExternalObject("lib:AdobeXMPScript");
			}
			if (ExternalObject.AdobeXMPScript != undefined) {
				var projectMetadata = obj.getProjectMetadata();
				var xmp = new XMPMeta(projectMetadata);
				resultData = (xmp.getProperty("http://ns.adobe.com/premierePrivateProjectMetaData/1.0/", metadataLabel));
			}
		}
		return resultData;
	},

	setMetadataValue: function (obj, metadataLabel, newValue){
		var setSuccess = false;
		if (app.isDocumentOpen()) {
			if (ExternalObject.AdobeXMPScript == undefined) {
				ExternalObject.AdobeXMPScript = new ExternalObject("lib:AdobeXMPScript");
			}
			if (ExternalObject.AdobeXMPScript != undefined) {
				var projectMetadata = obj.getProjectMetadata();
				var xmp = new XMPMeta(projectMetadata);
				xmp.setProperty("http://ns.adobe.com/premierePrivateProjectMetaData/1.0/", metadataLabel, newValue);
				var str = xmp.serialize();
				var setPropertyFailed = obj.setProjectMetadata(xmp.serialize(), [metadataLabel]);
				if (!setPropertyFailed)
					setSuccess = true;
			}
		}
		return setSuccess;
	},

	renameSelectedFiles: function(renameClipsOnly, renameBy, csvInput){
		// first, create custom metadata field to attach rename info to
		clipNameCCreated = $.runScript.createCustomMetadata("RenameClip", "RenameClip", 2);
		ridNameCreated = $.runScript.createCustomMetadata("RenameRid", "RenameRid", 2);
		OGFileNameCreated = $.runScript.createCustomMetadata("RenameFileOriginal", "RenameFileOriginal", 2);
		OGClipNameCreated = $.runScript.createCustomMetadata("RenameClipOriginal", "RenameClipOriginal", 2);

		if (!clipNameCCreated || !ridNameCreated || !OGFileNameCreated || !OGClipNameCreated){ // if creating the metadata failed, immediately stop this function. Won't happen if it was already created
			alert("Could not initialize renaming function.")
			return 0;
		}
		var mainSeq = app.project.activeSequence;
		var errorArray = [];
		var selection = mainSeq.getSelection();
		if (selection.length == 0) {
			alert("No clips are selected for replacement.")
		}
		else { // to ensure that we don't repeatedly replace clips with the same projectItem
			var replaceIDs = [];
			// parse the CSV for info on this project
			var ridArray = [];
			var nameArray = [];
			if (renameBy == 1 || renameBy == 2){
				var csvArray = csvInput.split("\n");
				for (line in csvArray) {
					var entry = csvArray[line].toString();
					var firstIndex = entry.indexOf(",");
					var recordID = entry.substr(0, firstIndex - 2);
					var name = entry.substr(firstIndex + 1);
					while (name.charAt(0) == " ") // GET RID OF LEADING WHITESPACE
						name = name.substr(1);
					ridArray.push(recordID);
					nameArray.push(name);
				}
			}
			var confirmedVideos = 0;
			var sameFileNames = 0;
			var sameFileNamesText = "";
			for (i = 0; i < selection.length; i++) { // go through each media to replace, then replace it.
				var clipItem = selection[i].projectItem;				
				if (typeof clipItem != "undefined" && selection[i].mediaType == "Video"){ //ensure that we're selecting a video
					confirmedVideos++;
					if (replaceIDs.indexOf(clipItem.nodeId) == -1){
						//ensure the projectItem can be changed
						if (clipItem.canChangeMediaPath()){
							var originalMediaPath = clipItem.getMediaPath();
							var lastIndex = originalMediaPath.lastIndexOf(".");
							var extension = (originalMediaPath.substr(lastIndex + 1)).replace(/\s/g, '');
							var theFile = File(originalMediaPath);
							// if (!theFile.exists && renameClipsOnly){ // THE ORIGINAL FILE ISN'T VALID BUT WE ONLY WANT TO RENAME CLIPS ANYWAY
							// 	theFile = File("/Library/Application%20Support/Adobe/CEP/extensions/Vaporu/presets/tempMP4.mp4");
							// }
							if (theFile.exists){ // THE FILE IS VALID TO BE RENAMED
								var newFilename;
								var folderName = theFile.parent.name;
								// SET THE OG NAMES IF THEY AREN'T THERE ALREADY
								var OGClipValue;
								var OGFileValue;
								if (app.isDocumentOpen()) {
									if (ExternalObject.AdobeXMPScript == undefined) {
										ExternalObject.AdobeXMPScript = new ExternalObject("lib:AdobeXMPScript");
									}
									if (ExternalObject.AdobeXMPScript != undefined) {
										var projectMetadata = clipItem.getProjectMetadata();
										var xmp = new XMPMeta(projectMetadata);
										OGClipValue = (xmp.getProperty("http://ns.adobe.com/premierePrivateProjectMetaData/1.0/", "RenameClipOriginal"));
										OGFileValue = (xmp.getProperty("http://ns.adobe.com/premierePrivateProjectMetaData/1.0/", "RenameFileOriginal"));
									}
								}
								var setOGnames = typeof OGClipValue != "undefined" && typeof OGClipValue != "undefined" ? true: false; // IF VALID VALUES RETURNED, 
								if (typeof OGClipValue == "undefined")
									setOGnames = $.runScript.setMetadataValue(clipItem, "RenameClipOriginal", clipItem.name);
								if (typeof OGClipValue == "undefined")
									setOGnames = $.runScript.setMetadataValue(clipItem, "RenameFileOriginal", theFile.name);
								if (!setOGnames)
									errorArray.push([selection[i].start.seconds, "Couldn't add original name metadata."]);
								// NOW, READ AND PARSE THE NEW NAME 
								if (renameBy == 3) // RENAMING BY FOLDER
									newFilename = folderName + "-" + clipItem.nodeId + "." + extension;
								if (renameBy == 4)  // SET NAME TO ORIGINAL
									newFilename = renameClipsOnly == 1 ? OGClipValue : OGFileValue;
								if (renameBy < 3) { // CSV UPLOADED. Parse the metadata first
									var alreadySetMetadata = false;
									var clipValue = $.runScript.getMetadataValue(clipItem, "RenameClip");
									var ridValue = $.runScript.getMetadataValue(clipItem, "RenameRid");
									if (typeof clipValue != "undefined" && typeof ridValue != "undefined"){
										alreadySetMetadata = true;
									}
									else { // set the rename metadata for the first time
										if (ridArray.length > 0 && nameArray.length == ridArray.length){ // make sure we have the same amount of recordIDs and names to pull from
											var index = -1;
											var isFromRidName = false;
											var isFromClipName = false;
											// TASK 1: FIND THE RIDNAME OR THE CLIP NAME IN THE CSV
											var nameSplit1 = theFile.name.split("businessinsider_");
											// try checking if the original name is a recordID
											if (nameSplit1.length == 2){
												nameSplit2 = nameSplit1[1].split("_");
												if (nameSplit2.length == 2){
													isFromRidName = true;
													for (ridEntry in ridArray){
														if (ridArray[ridEntry] == nameSplit2[0]){
															index = ridEntry;
															break;
														}
													}
												}
											}
											// try getting from the original clip name. might be able to delete this block after testing
											if (isFromRidName == false && OGFileValue.toString().length > 0) {
												var nameSplit1 = OGFileValue.toString().split("businessinsider_");
												if (nameSplit1.length == 2){
													nameSplit2 = nameSplit1[1].split("_");
													if (nameSplit2.length == 2){
														isFromRidName = true;
														for (ridEntry in ridArray){
															if (ridArray[ridEntry] == nameSplit2[0]){
																index = ridEntry;
																break;
															}
														}
														if (index == -1) //matches ridname format, but wasn't found here
															errorArray.push([selection[i].start.seconds, "That record ID is not in this project CSV.\n"]);						
													}
												}
											}
											// the original name is not from a recordID. Try finding by clip name in the CSV
											if (isFromRidName == false) {
												for (nameEntry in nameArray){
													if (nameArray[nameEntry] == theFile.name){
														index = nameEntry;
														isFromClipName == true;
														break;
													}
												}
												if (index == -1) //matches ridname format, but wasn't found here
													errorArray.push([selection[i].start.seconds, "That clip name is not in this project CSV.\n"]);
											}
											if (isFromRidName || isFromClipName){ // the clip was located in the CSV
												clipValue = nameArray[index] + "." + extension;
												$.runScript.setMetadataValue(clipItem, "RenameClip", clipValue);
												ridValue = "businessinsider_" + ridArray[index] + "_f0." + extension;
												$.runScript.setMetadataValue(clipItem, "RenameRid", ridValue);
												alreadySetMetadata = true;
											}
										}
										else
											errorArray.push([selection[i].start.seconds, "Error reading the project CSV."]);
									}
									if (alreadySetMetadata){ // at this point, metadata should be set.
										newFilename = renameBy == 1? clipValue: ridValue;
									}
									else // if we can't create a new name for some reason, keep the new file name as the old one.
										newFilename = clipItem.name;
								}
								if (renameClipsOnly){ // user is renaming clip in Premiere, not the actual file
									if (typeof newFilename != "undefined"){ // if new name set, rename clip in the bin AND on the timeline
										clipItem.name = newFilename;
										selection[i].name = newFilename;
										replaceIDs.push(clipItem.nodeId);
									}
									else
										errorArray.push([selection[i].start.seconds, "Couldn't parse filename for " + clipItem.name + "."]);
								}
								else if (theFile.name != newFilename) { // ONLY RENAME IF THE NEW NAME ISN'T THE SAME AS CURRENT FILE NAME
									//rename file. temporarily link to a tiny mp4 included in the Vaporu directory, so that clips aren't registered by Premiere as offline
									var tempFile = File("/Library/Application%20Support/Adobe/CEP/extensions/Vaporu/presets/tempMP4.mp4");
									if (tempFile.exists){
										if (typeof newFilename != "undefined"){
											if (!File(newFilename).exists){ // if a file with the new filename already exists, renaming will fail
												clipItem.changeMediaPath(tempFile.fsName, true);
												var renameWorked = theFile.rename(newFilename)
												if (renameWorked){ // renaming file is successful
													var fullReplacementPath = theFile.fsName;
													errorMessage = (fullReplacementPath + " is not in your chosen directory.");
													if (File(fullReplacementPath).exists){
														// replace the clip with version in transcodes folder
														var replaceSuccess = clipItem.changeMediaPath(fullReplacementPath, true);
														// changemediapath() returns 1 if successful, which is inconsistent with the documentation
														if (typeof replaceSuccess != "undefined" && replaceSuccess){
															selection[i].name = newFilename;
															replaceIDs.push(clipItem.nodeId);
														}
														else {
															File(fullReplacementPath).rename(originalMediaPath, true); //  don't keep the link to the temp mp4 file
															errorArray.push([selection[i].start.seconds, "Failed to change the path."]);
														}
													}
													else   // couldn't link to new file, most likely filename was parsed wrong.
														errorArray.push([selection[i].start.seconds, fullReplacementPath + " is not in your chosen directory."]);
												}
												else {
													clipItem.changeMediaPath(originalMediaPath, true); // don't keep the link to the temp mp4 file
													errorArray.push([selection[i].start.seconds, "Renaming function failed"]);
												}
											}
											else 
												errorArray.push([selection[i].start.seconds, "A file with the name " + newFilename + " already exists, so it wasn't renamed."]);
										}
										else
											errorArray.push([selection[i].start.seconds, "Couldn't create new filename for " + fullReplacementPath + "."]);
									}
									else
										errorArray.push([selection[i].start.seconds, "Temp MP4 file doesn't exist."]);
								} 
								else // NEW FILE HAD THE SAME NAME AS THE ORIGINAL. 
									sameFileNames++;
							}
							else 
								errorArray.push([selection[i].start.seconds, "The original file did not exist."]);
							clipItem.refreshMedia(); // refresh the clipItem, whether or not it was replaced
						}
						else 
							errorArray.push([selection[i].start.seconds, "Can't change media path for " + selection[i].name + "."]);
					}
					else
						errorArray.push([selection[i].start.seconds, "This clip has already been replaced this time around."]);
				}
			}
			var clipOrFileMessage = renameClipsOnly == true? "clip" : "file";
			if (sameFileNames > 0)
				sameFileNamesText = " " + sameFileNames + " files already had the correct final name.";
			if (replaceIDs.length == 1)
				alert("1 of " + confirmedVideos + " " + clipOrFileMessage + " renamed." + sameFileNamesText);
			else 
				alert(replaceIDs.length + " of " + confirmedVideos + " " + clipOrFileMessage + "s renamed." + sameFileNamesText);
			// ADD ERROR MARKERS TO TIMELINE
			for (i = 0; i < errorArray.length; i++){
				// add new marker or append its comments to the previous one if it's also at time = 0, to avoid stacking markers
				var newMarker;
				var markerComments = "";
				// if there's a previous marker, and if it's at time = 0, set selected marker to that one
				var insertionTime = 0;
				if (mainSeq.markers.numMarkers > 0 && mainSeq.markers.getLastMarker().end.seconds == errorArray[i][0]){
					newMarker = mainSeq.markers.getLastMarker();
					markerComments = newMarker.comments;
				}
				// otherwise, create a new one
				else { 
					newMarker = mainSeq.markers.createMarker(errorArray[i][0]);
				}
				newMarker.name = "Vaporu: Replace Clip Alert";
				// add all comments to marker's previous comments
				markerComments += errorArray[i][1];
				newMarker.comments = markerComments;
				newMarker.type = "Chapter";
			}
		}
	},

//--------------------------------------------------------------------------------------------------------------------------------------------------

	thumbExport: function (hPixels, vPixels) {
		app.enableQE();

		var mainSeq = app.project.activeSequence;
		var clipsArray = mainSeq.getSelection();

		if (clipsArray.length < 1) {
			alert ("No clips selected for thumbnails!");
		}

		else {
			// check if Thumbnails folder exists
			var outputPath;
			if (Folder(app.project.path.split("/Projects/", 1) + "/Exports/Thumbnails/").exists){
				outputPath = new Folder(app.project.path.split("/Projects/", 1) + "/Exports/Thumbnails/");
			}
			else if (Folder(app.project.path.split("/Projects/", 1) + "/Thumbnails/").exists){
				outputPath = new Folder(app.project.path.split("/Projects/", 1) + "/Thumbnails/");
			}
			else {
				outputPath = Folder.selectDialog("Choose the output directory.");
			}

			// get and set in/out points
			var inpoint = clipsArray[0].start;
			var outpoint = clipsArray[clipsArray.length-1].end;
			mainSeq.setInPoint(inpoint);  
			mainSeq.setOutPoint(outpoint);

			var originalSeqHeight = mainSeq.frameSizeVertical;
			var originalSeqWidth = mainSeq.frameSizeHorizontal;

			// finds the Vaporu bin and selects it, to create subsequence inside it
			var vaporuBin = $.runScript.searchForBinWithName("Vaporu");
			if (vaporuBin && typeof vaporuBin != "undefined")  {
				vaporuBin.select();
			}
			else {
				app.project.rootItem.createBin("Vaporu");
				vaporuBin = $.runScript.searchForBinWithName("Vaporu");
				vaporuBin.select();
			}
			
			//create and open subsequence
			var newSeq = mainSeq.createSubsequence(true);
			var seqIdentifier = 1;
			
			// looks like extendscript doesn't have "startsWith()" so...
			for (var i = 0; i < vaporuBin.children.numItems; i++) {
				var binChild = vaporuBin.children[i].name;
				if (typeof binChild == "string"
					&& binChild[0] == "T" 
					&& binChild[1] == "h"
					&& binChild[2] == "u"
					&& binChild[3] == "m"
					&& binChild[4] == "b"
					&& binChild[5] == "s"
					&& binChild[6] == "_"){
						seqIdentifier++;
				}
			}
			newSeq.name = "Thumbs_" + seqIdentifier;
			newSeq.setZeroPoint(0);

			// get everything that was selected
			var selectedTrackAndClipNumbers = [];
			var trackNumber = 0;
			var clipNumber = 0;
			for (var i = 0; i < mainSeq.videoTracks.numTracks; i ++) {
				for (var j = 0; j < mainSeq.videoTracks[i].clips.numItems; j++) {
					// if it's not selected, mark for deletion. Only for clips within in and out
					if (!mainSeq.videoTracks[i].clips[j].isSelected()
							&& parseInt(mainSeq.videoTracks[i].clips[j].start.ticks) < parseInt(outpoint.ticks)
							&& parseInt(mainSeq.videoTracks[i].clips[j].end.ticks) > parseInt(inpoint.ticks) ){
						selectedTrackAndClipNumbers.push([trackNumber,clipNumber]);
						//alert("set to delete: " + trackNumber + ", " +clipNumber)
					}
					clipNumber++;
				}
				trackNumber++;
				clipNumber = 0;
			}

			var deletionArray = [];
			// delete everything that wasn't selected in the initial sequence
			for (var i = 0; i < selectedTrackAndClipNumbers.length; i ++) {
				var thisSelection = selectedTrackAndClipNumbers[i];
				if (typeof newSeq.videoTracks[thisSelection[0]] != "undefined"){
					if (typeof newSeq.videoTracks[thisSelection[0]].clips[thisSelection[1]] != "undefined"){
						// select only what was originally selected in the mainSeq
						deletionArray.push(newSeq.videoTracks[thisSelection[0]].clips[thisSelection[1]]);
					}	
				}
			}
			// delete them. deleting in the previous loops messes with the array indexes because you delete as you go
			for (var i = 0; i < deletionArray.length; i ++) {
				deletionArray[i].remove(1,1);
			}

			// use the QE DOM to open the subsequence and make it current sequence
			app.project.activeSequence = newSeq;
			var activeSequence = qe.project.getActiveSequence(); 
			
			// set the settings for the dimensions of the thumbs
			var newSeqSettings = newSeq.getSettings();
			if (newSeqSettings && typeof newSeqSettings != "undefined"){
				newSeqSettings.videoFrameWidth = hPixels;
				newSeqSettings.videoFrameHeight = vPixels;
				newSeq.setSettings(newSeqSettings);
				var subSequencesToInsert = [];

				// nest each clip further to ensure its scale, but only if it's not the same frame
				var sceneStart = [];
				for (var i = 0; i < newSeq.videoTracks.numTracks; i++) {
					var thisTrack = newSeq.videoTracks[i];
					// then through each clip in that track
					for (var j = 0; j < thisTrack.clips.numItems; j++) {
						var thisSubClip = thisTrack.clips[j];
						//alert(thisSubClip.name + " at " + thisSubClip.start.seconds + " and j = " + j + " on track " + i + " which has " + thisTrack.clips.numItems)
						var subClipInpoint = thisSubClip.start.ticks;
						// only nest clip if it's not the same scene as a previous nest
						if (sceneStart.indexOf(subClipInpoint) == -1){
							//alert("1 scenestarts length:" + sceneStart.length);
							sceneStart.push(subClipInpoint);
							var subClipOutpoint = thisSubClip.end.ticks;
						
							newSeq.setInPoint(subClipInpoint);
							newSeq.setOutPoint(subClipOutpoint);
							var clipName = thisSubClip.name;
							var newSubSeq = newSeq.createSubsequence(true);
							newSubSeq.name = "Nested_thumb_" + seqIdentifier + "_" + clipName;
							newSubSeq.setZeroPoint(0);
							var newSubSeqSettings = newSubSeq.getSettings();
							if (newSubSeqSettings && typeof newSubSeqSettings != "undefined"){
								newSubSeqSettings.videoFrameWidth = originalSeqWidth;
								newSubSeqSettings.videoFrameHeight = originalSeqHeight;
								newSubSeq.setSettings(newSubSeqSettings);
							}
							// // set nested clips to start at 0, if they're close enough (sometimes premiere adds a blank frame)
							for (var k = 0; k < newSubSeq.videoTracks.numTracks; k++) {
								for (var l = 0; l < newSubSeq.videoTracks[k].clips.numItems; l++) {
									newSubSeq.videoTracks[k].clips[l].start = 0;
									if (parseInt(newSubSeq.videoTracks[k].clips[l].start) && parseInt(newSubSeq.videoTracks[k].clips[l].start) < 0.5) {
										newSubSeq.videoTracks[k].clips[l].start = 0;
									}
								}
							}
							subSequencesToInsert.push(newSubSeq.projectItem);
						}
					}
				}
				// remove original clip and replace it with subsequence
				for (var i = 0; i < newSeq.videoTracks.numTracks; i++) {
					var thisTrack = newSeq.videoTracks[i];
					// then through each clip in that track
					for (var j = 0; j < thisTrack.clips.numItems; j++) {
						// select clip
						thisTrack.clips[j].setSelected(true);
					}
				}
				// remove all selected clips
				var newSeqClips = newSeq.getSelection();
				for (var i = 0; i < newSeqClips.length; i++) {
					newSeqClips[i].remove(1, 1)
				}

				// add the nested subsequences to the original nested sequence
				for (var i = 0; i < subSequencesToInsert.length; i++) {
					var theTime = 0;
					if (newSeq.videoTracks[0].clips.numItems > 0){
						// start next clip at the end of the previous one 
						theTime = newSeq.videoTracks[0].clips[newSeq.videoTracks[0].clips.numItems - 1].end;
					}
					newSeq.videoTracks[0].overwriteClip(subSequencesToInsert[i], theTime);
				}
				// set inpoint to the beginning of the sequence
				newSeq.setInPoint(0);
				
				// export from sequence
				if (outputPath && typeof outputPath != "undefined"){
					//export first frame of every clip in the new subsequence. this loops through all videotracks and clips
					for (var i = 0; i < newSeq.videoTracks.numTracks; i++) {
						thisTrack = newSeq.videoTracks[i];
						for (var j = 0; j < thisTrack.clips.numItems; j++) {
							// set clip scale to fit sequence
							$.runScript.fitToSeq(thisTrack.clips[j], hPixels, vPixels, false);
							//
							newSeq.setPlayerPosition(thisTrack.clips[j].start.ticks);
							var time = activeSequence.CTI.timecode;
							var outputFileName	= outputPath.fsName + "/Thumb" + (j +1) + "_" + mainSeq.name;
							//alert("it's " + outputFileName)
							activeSequence.exportFrameJPEG(time, outputFileName);
						}
					}
				}
			}
		}
	},

//--------------------------------------------------------------------------------------------------------------------------------------------------

	fitToSeq: function (thisClip, seqWidth, seqHeight, centerChecked) {
		
		if (thisClip.projectItem && thisClip.mediaType == "Video"){ // some items, like text, don't have projectItems
			var clipDimensions;
		
			if (app.isDocumentOpen()) {
				if (ExternalObject.AdobeXMPScript == undefined) {
					ExternalObject.AdobeXMPScript = new ExternalObject("lib:AdobeXMPScript");
				}

				if (ExternalObject.AdobeXMPScript != undefined) {
					var projectMetadata = thisClip.projectItem.getProjectMetadata();

					var xmp = new XMPMeta(projectMetadata);
					clipDimensions = xmp.getProperty("http://ns.adobe.com/premierePrivateProjectMetaData/1.0/", "Column.Intrinsic.VideoInfo");
				}
			}

			if (clipDimensions.value != undefined && typeof clipDimensions.value == "string"){
				// separate dimensions and parse to numbers
				var originalWidth = parseInt(clipDimensions.value.split("x")[0].replace(" ", ""));
				var originalHeight = parseInt(clipDimensions.value.split("x")[1].split("(")[0].replace(" ", ""));

				var ratio = seqHeight/originalHeight;
				if (originalWidth/originalHeight < seqWidth/seqHeight){
					ratio = seqWidth/originalWidth;
				}
				//calculate the scale and round up to one decimal place
				newScale = Math.ceil(1000 * ratio) / 10;
				var motionComponentNumber;
				for (i = 0; i < thisClip.components.numItems; i++){
					if (thisClip.components[i].displayName == "Motion"){
						motionComponentNumber = i;
					}
				}
				if (motionComponentNumber != undefined){ // if this clip has a Motion component
					thisClip.components[motionComponentNumber].properties[1].setValue(newScale, 1);
					if (centerChecked){
						if (thisClip.components[motionComponentNumber].properties[0].displayName == "Position"){
							thisClip.components[motionComponentNumber].properties[0].setValue([0.5,0.5], 1);
						}
					}
				}
			}
		}
	},


	fitAllToSeq: function (centerChecked){
		var mainSeq = app.project.activeSequence;
		var hPixels = 0;
		var vPixels = 0;

		var seqSettings = mainSeq.getSettings();
		if (seqSettings && typeof seqSettings != "undefined"){
			hPixels = seqSettings.videoFrameWidth;
			vPixels = seqSettings.videoFrameHeight;

			var selection = mainSeq.getSelection();
			if (hPixels > 0 && vPixels > 0) { // if we successfully got the sequence size
			//alert(selection.length " clips selected");
				for (j = 0; j < selection.length; j++){
					$.runScript.fitToSeq(selection[j], hPixels, vPixels, centerChecked);
				}
			}
		}
	},

	scaleTo: function (newScale){
		var mainSeq = app.project.activeSequence;
		var selection = mainSeq.getSelection();
		var parsedScale = parseFloat(parseInt(newScale)).toFixed(1);
		for (i = 0; i < selection.length; i++){
			thisClip = selection[i];
			if (thisClip.mediaType == "Video"){
				var motionComponentNumber;
				if (thisClip.components && thisClip.components.numItems > 0) {
					for (j = 0; j < thisClip.components.numItems; j++){
						if (thisClip.components[j].displayName == "Motion"){
							motionComponentNumber = j;
						}
					}
					if (motionComponentNumber && typeof motionComponentNumber != undefined){ // if this clip has a Motion component
						if (thisClip.components[motionComponentNumber].properties[1] != undefined
							&& thisClip.components[motionComponentNumber].properties[1].displayName == "Scale"){
							thisClip.components[motionComponentNumber].properties[1].setValue(newScale, 1);
						}
					}
				}
			}
		}
	},

//--------------------------------------------------------------------------------------------------------------------------------------------------

	convertToMOGRT: function (selectedTrack, mogrtType) {
		var mainSeq = app.project.activeSequence;

		if (!selectedTrack || selectedTrack > mainSeq.videoTracks.numTracks){
			selectedTrack = mainSeq.videoTracks.numTracks;
		}
		 
		var selection = mainSeq.getSelection();
		for (var i = 0; i < selection.length; i++) {
			// find the text inside of the selected clip (selection[i])
			for (var j = 0; j < selection[i].components.numItems; j++) {
				var sourceText; 
				var originalText = selection[i];

				if (originalText.components[j].displayName == "Text"){
					// assign source text, which is properties[0] for a text component, to var
					sourceText = originalText.components[j].properties[0];
				}
				if (sourceText){
					var copiedText = sourceText.getValue();
					var amountOfmTextProperties = copiedText.split("mText\":\"").length;
					// parse the value of the source text by removing the beginning and end
					if (amountOfmTextProperties > 1){

						//alert("1" + copiedText)
						copiedText = copiedText.split("mText\":\"")[amountOfmTextProperties - 1];
						//alert("2" + copiedText)
						copiedText = copiedText.split("\",\"mTracking")[0];
						//alert("3" + copiedText)
						var newClipStartTime = originalText.start;
						var newClipEndTime = originalText.end;

						if (mogrtType == "TOS") {
							// set the line length to what it was before
							var longestLineLength = 0;
							var textLines = copiedText.split("\\r");
							formattedText = "";
							// find the length of the longest line, to split
							for (k = 0; k < textLines.length; k++){
								//get rid of returns in the text
								formattedText += textLines[k] + " ";
								if (textLines[k].length > longestLineLength){
									longestLineLength = textLines[k].length + 0.5;
								}
								//alert(textLines[k] + " is long: " + textLines[k].length);
							}
							// get rid of double spaces
							formattedText = formattedText.replace("  ", " ");
							// insert the TOS and set its max length to the original text's length
							var newMOGRT = $.runScript.insertTOS(newClipStartTime, newClipEndTime, formattedText, selectedTrack - 1);
							if (newMOGRT){
								// set all social media types off
								var components = newMOGRT.getMGTComponent();
								components.properties.getParamForDisplayName("Max Line Length").setValue(longestLineLength, 1);
							}
						}
						else {
							$.runScript.insertCourtesy(newClipStartTime, newClipEndTime, copiedText, selectedTrack - 1);
						}
					}
				}
			}
		}
	},
	
	fitMOGRTToSeq: function (thisClip, seqWidth, seqHeight){
		var mainSequence = app.project.activeSequence;

		var components = thisClip.getMGTComponent();
		var seqAR = mainSequence.frameSizeHorizontal/mainSequence.frameSizeVertical;
		var mogrtAR = components.properties.getParamForDisplayName("Wide/Square/Vertical");
		if (mogrtAR && typeof mogrtAR != "undefined"){
			if (seqAR == 16/9){
				mogrtAR.setValue(1, 1);
			}
			if (seqAR == 1){
				mogrtAR.setValue(2, 1);
			}
			else if (seqAR == 9/16) {
				mogrtAR.setValue(3, 1);
			}
		}
	},

	fitAllMOGRTs: function (){
		var mainSeq = app.project.activeSequence;
		var hPixels = 0;
		var vPixels = 0;

		var seqSettings = mainSeq.getSettings();
		if (seqSettings && typeof seqSettings != "undefined"){
			hPixels = seqSettings.videoFrameWidth;
			vPixels = seqSettings.videoFrameHeight;

			var selection = mainSeq.getSelection();
			if (hPixels > 0 && vPixels > 0) { // if we successfully got the sequence size
			//alert(selection.length " clips selected");
				for (j = 0; j < selection.length; j++){
					if (selection[j].isMGT()){
						$.runScript.fitMOGRTToSeq(selection[j], hPixels, vPixels);
					}
				}
			}
		}
	},

	getMOGRTSettings: function (){
		var copiedProperties = [];
		var mainSeq = app.project.activeSequence;

		var selection = mainSeq.getSelection();
		// get only the first item selected
		if (selection[0] && selection[0].isMGT() ){
			var components = selection[0].getMGTComponent();
			// get the value of each property in the MGT component and add it to array
			if (components){
				for (i = 1; i < components.properties.numItems; i++){
					copiedProperties.push( components.properties[i].getValue() );
				}
			}
			else {
				alert("No MOGRTs selected.");
			}
		}
		else {
			alert("No MOGRTs selected.");
		}
		//stringify without the []
		return copiedProperties.join(",");
	},

	setMOGRTSettings: function (properties){
		var copiedProperties = [];
		var mainSeq = app.project.activeSequence;
		var propertiesTempArray = properties.join(',').split(',');
		var propertiesArray = [];
		// convert the property types from string to appropriate types, for later comparison
		for (i = 0; i < properties.length; i++){
			var finalValue;
			if (properties[i] == "true"){
				finalValue = true;
			}
			else if (properties[i] == "false"){
				finalValue = false;
			}
			else if (!isNaN(properties[0])){
				finalValue = parseInt(properties[i]);
			}
			else {
				finalValue = properties[i];
			}
			propertiesArray.push(finalValue);
		}
		//alert(typeof propertiesArray + " and " + typeof properties);

		var selection = mainSeq.getSelection();
		for (i = 0; i < selection.length; i++){
			// for every selected MOGRT
			if ( selection[i].isMGT() ){
				var components = selection[i].getMGTComponent();
				// only sync properties if it's the same mogrt type. For now, checking length
				if (components.properties.numItems - 1 == properties.length){
					for (j = 1; j < components.properties.numItems; j++){
						if (typeof components.properties[j].getValue() == typeof propertiesArray[j -1]){
							//alert(components.properties[j].getValue() + " : " + typeof components.properties[j].getValue() + " and " + propertiesArray[j -1] + " : " + typeof propertiesArray[j - 1]);
							components.properties[j].setValue(propertiesArray[j - 1], 1);
						}
					}
				}
			}
		}
	},

//--------------------------------------------------------------------------------------------------------------------------------------------------

	saveSRT: function (filename, text) {
		var finalOutputPath = "NULL";
		var outputPath = Folder.selectDialog("Choose the output directory.");
		if (outputPath && typeof outputPath != "undefined"){
			//var outputPath = new File("~/Desktop/Premiere%20tests");
			var outputFileName = outputPath.fsName + "/" + filename + '_from_Vaporu.srt';

			var outFile = new File(outputFileName);
			if (outFile) {
				outFile.open("w");
				outFile.encoding = "UTF-8";
				outFile.lineFeed = "Windows";

				outFile.writeln(text);

				if (outFile){
					//alert("Captions saved to " + outputFileName);
					finalOutputPath = outputFileName;
				}
				else {
					alert("Error: captions not saved.");
				}
			}
		}
		return finalOutputPath;
	},

	importSRT : function (filePath) {
		app.enableQE();
		var projRoot = app.project.rootItem;
		var convertedPath = filePath.replace(" ", "%20");

		if (convertedPath){
			projRoot.createBin("Vaporu");
			var vaporuBin = $.runScript.searchForBinWithName("Vaporu");
			// import captions to the Vaporu folder
			if (!vaporuBin || typeof vaporuBin == "undefined"){
				vaporuBin = projRoot;
			}
			vaporuBin.select();
			var importSuccess = app.project.importFiles([convertedPath], false, vaporuBin, false);
		}
	},

	convertCaptionsToMOGRT: function (textArray, startTimecodesArray, endTimecodesArray, widthArray, includeMarkers, trackNumber) {
		app.enableQE();
		var mainSequence = app.project.activeSequence;
		var confirmContinue = true;
		if (mainSequence.videoTracks.numTracks < trackNumber){
			alert("Track " + trackNumber + " doesn't exist in this sequence.")
			return 0;
		}
		
		// ensure these are arrays
		if (typeof textArray == "object" && typeof startTimecodesArray == "object" && typeof endTimecodesArray == "object"){
			for (var i = 0; i < textArray.length; i++){
				var isFirstCaption = i == 0 ? true : false;
				if (confirmContinue) {
					confirmContinue = $.runScript.insertCaption(startTimecodesArray[i], endTimecodesArray[i], textArray[i], trackNumber - 1, isFirstCaption);
					//alert(confirmContinue)
					if (typeof widthArray == "object" && includeMarkers == true){
						if (parseInt(widthArray[i]) > 150){
							//alert(widthArray[i])
							newMarker = mainSequence.markers.createMarker(parseFloat(Math.ceil(startTimecodesArray[i])));
							newMarker.name = "Vaporu: Captions Alert";
							// concatenate all the errors
							newMarker.comments = "This caption may be too long.";
							newMarker.type = "Chapter";
						}
					}
				}
			}
		}
	},

	convertMOGRTToSRT: function () {
		app.enableQE();
		var mainSequence = app.project.activeSequence;

		var selection = mainSequence.getSelection();
		if (selection.length == 0) {
			alert("No clips are selected.")
		}
		var theText = "";
		// go through each media to replace, then replace it.
		for (var i = 0; i < selection.length; i ++) {
			if (selection[i].isMGT()){
				var components = selection[i].getMGTComponent();
				if (components){
					var textComponent = components.properties.getParamForDisplayName("Text");
					if (textComponent){
						var captionText = textComponent.getValue();
						// if properties have been edited, Premiere will set the text value to include
						// all the properties. Parse that, find the textEditValue, and set text to that instead
						var testForFontEditInfoArray = captionText.split('},"textEditValue":"');
						if (testForFontEditInfoArray.length > 1){
							var textEditValueArray = testForFontEditInfoArray[testForFontEditInfoArray.length - 1].split('"}');
							if (textEditValueArray.length > 1 && typeof textEditValueArray[0] != "undefined" )
								captionText = textEditValueArray[0];
						}
						var formattedCaptionText = $.runScript.AECaptionParse(captionText);
						var formattedStartTimecode = $.runScript.secondsToTimecode(selection[i].start.seconds);
						var formattedEndTimecode = $.runScript.secondsToTimecode(selection[i].end.seconds);

						theText += (i + 1)
							+ "\r\n"
							+ formattedStartTimecode
							+ " --> " 
							+ formattedEndTimecode
							+ "\r\n"
							+ formattedCaptionText

						// ensure two final empty lines at the end 
						if (i == selection.length - 1){
							theText += "\r\n";
						}
						else {
							theText += "\r\n\r\n";
						}
					}
				}
			}
		}
		// alert(theText)
		var seqName = mainSequence.name;
		if (!seqName){
			seqName = "";
		}
		$.runScript.saveSRT("captionsFromVaporu_" + seqName, theText);
	},

	secondsToTimecode: function (timeInSeconds) {
		// slices are to ensure we have 0s in front of any number that needs it
		var hours = ("0" + Math.floor(timeInSeconds / 3600)).slice(-2);
		var minutes = ("0" + Math.floor((timeInSeconds % 3600) / 60)).slice(-2);
		var seconds = ("0" + Math.floor((timeInSeconds % 3600) % 60)).slice(-2);
		var milliseconds = ("00" + Math.floor((((timeInSeconds % 3600) % 60) % 1) * 1000)).slice(-3);
		return hours + ":" + minutes + ":" + seconds + "," + milliseconds;
	},

	// parse text the same way the AE MOGRT comp expression does
	AECaptionParse: function (inputText){
        // change these default values if they don't match the AE caption MOGRT comp
        var midpointOffset = 0;
        var maxLineLength = 28;
        var formattedText = "";
        var fullLineWidth = inputText.length;
        var howManyLines = 2;

        var theText = inputText.replace(/[\r\n]+/g, ' ').replace("  ", " ");

        if (fullLineWidth > maxLineLength) {
            var words = (theText).split(" ");
            for (j = 0; j < words.length; j++){
                var nextLine = formattedText + " " + words[j];
                var thisLineWidth = formattedText.length;
                var nextLineWidth = nextLine.length;
                //calculate offset (distance from midpoint of text)
                lengthDifference1 = Math.abs(fullLineWidth/howManyLines - thisLineWidth);
                lengthDifference2 = Math.abs(fullLineWidth/howManyLines - nextLineWidth);
                // if we reached the word in the middle of the length
                if (thisLineWidth < fullLineWidth/howManyLines + midpointOffset && nextLineWidth > fullLineWidth/howManyLines + midpointOffset) {
                    // if less space is used to insert newline before word
                    if (lengthDifference1 < lengthDifference2) {
                        formattedText += ("\n" + words[j] + " ");
                    }
                    else {
                        formattedText += (words[j] + "\n");
                    }
                }
                // if both sides are exactly the same size
                else if (thisLineWidth == fullLineWidth/howManyLines){
                    formattedText += ("\n" + words[j] + " ");
                }
                else {
                    formattedText += words[j];
                    // add a space to separate words
                    if (j != words.length - 1) {
                        formattedText += " ";
                    }
                }
            }
        }
        else {
            formattedText = theText;
        }
        return formattedText;
    },

//--------------------------------------------------------------------------------------------------------------------------------------------------
	segmentExporter: function(selectedAudioOption, selectedStartTileOption, selectedEndTileOption, selectedPresetOption) {
		
		app.enableQE();
		
		var mainSequence = app.project.activeSequence;
		var audioTrack = mainSequence.audioTracks[selectedAudioOption - 1];
		var bins = app.project.rootItem.children;
		var numBins = app.project.rootItem.numChildren;
		var firstBin = app.project.rootItem;

		var outputPresetPath;
		//choose framerate corresponding to sequence
		var mainSeqSettings = mainSequence.getSettings();
		
		if (mainSeqSettings.videoDisplayFormat == 110) {
			if (selectedPresetOption && selectedPresetOption == "HQ"){
				//outputPresetPath = "~/Documents/Adobe/Adobe%20Media%20Encoder/13.0/Presets/InsiderInc_WebVideoFormat_Vertical_23.976.epr";
				outputPresetPath = "/Library/Application%20Support/Adobe/CEP/extensions/Vaporu/presets/InsiderInc_WebVideoFormat_Vertical_23.976.epr"
			}
			else {
				//outputPresetPath = "~/Documents/Adobe/Adobe%20Media%20Encoder/13.0/Presets/InsiderInc_WebVideoFormat_Vertical_23.976_Fast.epr";
				outputPresetPath = "/Library/Application%20Support/Adobe/CEP/extensions/Vaporu/presets/InsiderInc_WebVideoFormat_Vertical_23.976_Fast.epr"
			}
		}
		else {
			if (selectedPresetOption && selectedPresetOption == "HQ"){
				//outputPresetPath = "~/Documents/Adobe/Adobe%20Media%20Encoder/13.0/Presets/InsiderInc_WebVideoFormat_Vertical.epr";
				outputPresetPath = "/Library/Application%20Support/Adobe/CEP/extensions/Vaporu/presets/InsiderInc_WebVideoFormat_Vertical.epr"
			}
			else {
				//outputPresetPath = "~/Documents/Adobe/Adobe%20Media%20Encoder/13.0/Presets/InsiderInc_WebVideoFormat_Vertical_Fast.epr";
				outputPresetPath = "/Library/Application%20Support/Adobe/CEP/extensions/Vaporu/presets/InsiderInc_WebVideoFormat_Vertical_Fast.epr"
			}
		}

		//check whether the preset is in the folder
		if (File(outputPresetPath).exists){
			app.encoder.launchEncoder(); // launch encoder
			// check if an "Exports" directory exists in this project's doler. If not, ask for output folder
			var outputPath;
			var checkPath = app.project.path.split("/Projects/", 1) + "/Exports";
			if (Folder(checkPath).exists) {
					outputPath = new Folder(checkPath);
				}
			else {
					outputPath = Folder.selectDialog("Choose the output directory.");
				}
			if (audioTrack){
				if (audioTrack.clips.numItems > 0){
					// go through each audio clip and export the video for it
					var overWriteChoice = false;
					if (outputPath){
						app.encoder.launchEncoder();
						// export only in range user selected
						for (var i = (selectedStartTileOption - 1); i < (selectedEndTileOption); i++){
							//get in and out points at each audio split, add 1/4 of a frame as an offset
							var inpoint = parseInt(audioTrack.clips[i].start.ticks) + mainSequence.timebase/4;
							var outpoint = parseInt(audioTrack.clips[i].end.ticks) + mainSequence.timebase/4;
							//set in and out points to render
							mainSequence.setInPoint((inpoint).toString());  
							mainSequence.setOutPoint((outpoint).toString());
							//render and remember user's choice to overwrite on the first ask
							if (i == (selectedStartTileOption - 1)){
								overWriteChoice = renderActiveSeq(i + 1, overWriteChoice, true);
							}
							else {
								renderActiveSeq(i + 1, overWriteChoice, false)
							}
						}
						app.encoder.startBatch();
						alert("All clips sent to Adobe Media Encoder.");
					}
				}
				else {
						alert("Your audio isn't split on Audio Track " + selectedAudioOption + "!");
					}
				}
			else {
				alert("You have no Audio Track " + selectedAudioOption + "!");
			}
		}

		else {
			alert("You don't have the right output preset installed! Add the preset to your Documents/Adobe/Adobe Media Encoder/13.0/Presets folder.");
		}
	
		// function from Premiere OnScript
		function renderActiveSeq (snap_number, overWriteChoice, firstExport){
			var destroyExisting = overWriteChoice;
			var activeSequence = qe.project.getActiveSequence();
			if (activeSequence) {
				if (outputPath){
					var outPreset = new File(outputPresetPath);
					if (outPreset.exists === true){
						var outputFormatExtension = activeSequence.getExportFileExtension(outPreset.fsName);
						if (outputFormatExtension) {
							var fullPathToFile = outputPath.fsName + '/' + activeSequence.name + "_" + snap_number + "." + outputFormatExtension;
							var outFileTest = new File(fullPathToFile);
							if (outFileTest.exists) {
								if (firstExport) {
									destroyExisting = confirm('A file with the name " ' + activeSequence.name + '_' + snap_number + ' already exists. Overwrite this and the other exports you selected?', false, 'Are you sure...?');
								}
								if (destroyExisting){
									outFileTest.remove();
									outFileTest.close();
								}
							}
						}
					}
				}
			}
			// render 
			app.encoder.encodeSequence(app.project.activeSequence, fullPathToFile, outPreset.fsName, app.encoder.ENCODE_IN_TO_OUT, 0);
			outPreset.close ()
			return destroyExisting;
		}
	},
//--------------------------------------------------------------------------------------------------------------------------------------------------

	gridInit: function() {
		foleyBin = searchForBinWithName("Vaporu Foley Pads");
		if (foleyBin){
			var bankNames = [];

			// get names and number of sounds in each foley bin
			for (var i = 0; i < foleyBin.children.numItems; i++) {
				
				// add the names to bankNames if its type is a bin
				if (foleyBin.children[i].type == 2){
					bankNames.push(foleyBin.children[i].name);

					// then, only increment bank size child of bin is a clip
					var audioClipCounter = 0;
					for (var j = 0; j < foleyBin.children[i].children.numItems; j++) {
						// if the children of that bin are clips
						if (foleyBin.children[i].children[j].type == 1) {
							audioClipCounter++;
						}
					}
					bankNames.push(audioClipCounter);
				}
			}
			// stringify without the []
			return bankNames.join(",");
		}
		else {
			alert('Please put your sounds in a folder called "Vaporu Foley Bins"');
		}

		// function from Premiere CEP panel
		function searchForBinWithName(nameToFind) {
			// deep-search a folder by name in project
			var deepSearchBin = function (inFolder) {
				if (inFolder && inFolder.name === nameToFind && inFolder.type === 2) {
					return inFolder;
				} else {
					for (var i = 0; i < inFolder.children.numItems; i++) {
						if (inFolder.children[i] && inFolder.children[i].type === 2) {
							var foundBin = deepSearchBin(inFolder.children[i]);
							if (foundBin) {
								return foundBin;
							}
						}
					}
				}
			};
			return deepSearchBin(app.project.rootItem);
		}
	},

	playPadSound: function(clickedPad, bankIndex, selectedTrack) {
		
		app.enableQE();
		
		var mainSequence = app.project.activeSequence;
		var foleyBin = app.project.rootItem;
		foleyBin = searchForBinWithName("Vaporu Foley Pads");
		var soundBank;
		if (bankIndex > -1){
			soundBank = foleyBin.children[bankIndex];
		}
		else {
			soundBank = foleyBin.children[0];
			alert("Bank + " + bankIndex + "invalid.");
		}

		// add sound to timeline if selectedTrack is valid (which means globalRecording is true)
		if (selectedTrack && selectedTrack > 0){
			var audioTrack = mainSequence.audioTracks[selectedTrack - 1];
			// try replacing the below line with "mainSequence.getPlayerPosition();"
			var currentTime = qe.project.getActiveSequence().CTI;
			audioTrack.insertClip(soundBank.children[clickedPad], currentTime.ticks);
		}
		
		// return the path of the sound clicked, as long as that sound has a corresponding pad
		var audioPath;
		if (clickedPad < soundBank.children.numItems){
			audioPath = soundBank.children[clickedPad].getMediaPath();
		}
		else {
			audioPath = -1;
		}
		return (audioPath);

		// function from Premiere CEP panel
		function searchForBinWithName(nameToFind) {
			// deep-search a folder by name in project
			var deepSearchBin = function (inFolder) {
				if (inFolder && inFolder.name === nameToFind && inFolder.type === 2) {
					return inFolder;
				} else {
					for (var i = 0; i < inFolder.children.numItems; i++) {
						if (inFolder.children[i] && inFolder.children[i].type === 2) {
							var foundBin = deepSearchBin(inFolder.children[i]);
							if (foundBin) {
								return foundBin;
							}
						}
					}
				}
			};
			return deepSearchBin(app.project.rootItem);
		}
	},

	//--------------------------------------------------------------------------------------------------------------------------------------------------

	insertVisual: function(visualOriginal, startTime, endTime, theText, courtesy, mode2, mode3) {
		
		app.enableQE();
		
		var mainSequence = app.project.activeSequence;
		var videoTrack = mainSequence.videoTracks[0];
		mediaBin = searchForBinWithName("Media from Xchange");
		if (!mediaBin || typeof mediaBin == "undefined"){
			mediaBin = app.project.rootItem;
		}
		errorArray = [];
		var visualClip;
		var visual = visualOriginal;
		var visualFileType = "NULLFILETYPE";

		// if producer included filetype, parse it
		var lastIndex = visualOriginal.lastIndexOf(".");
		var extension = (visualOriginal.substr(lastIndex + 1)).replace(/\s/g, '');
		if (extension.length == 3){
			visualFileType = extension.toLowerCase();
		}
		// find the requested clip
		for (var i = 0; i < mediaBin.children.numItems; i++) {
			if (mediaBin.children[i].name == visual && mediaBin.children[i].type === 1){
				visualClip = mediaBin.children[i];
				break;
			}
			else {
				var visualWithNoExtension = visual.split(".");
				if (visualWithNoExtension.length > 0)
					visualWithNoExtension = visualWithNoExtension[0];
				var nameWithNoExtension = mediaBin.children[i].name.split(".");
				if (nameWithNoExtension.length > 0)
					nameWithNoExtension = nameWithNoExtension[0];
				if (visualWithNoExtension == nameWithNoExtension && mediaBin.children[i].type === 1){
					visualClip = mediaBin.children[i];
					break;
				}
			}
		}

		// if a valid clip was found
		if (visualClip && typeof visualClip != "undefined"){
			// check if this is a video or audio clip
			var clipIsVideo = true;
			var clipType;
			if (app.isDocumentOpen()) {
				if (ExternalObject.AdobeXMPScript == undefined) {
					ExternalObject.AdobeXMPScript = new ExternalObject("lib:AdobeXMPScript");
				}
				if (ExternalObject.AdobeXMPScript != undefined) {
					var projectMetadata = visualClip.getProjectMetadata();
					var xmp = new XMPMeta(projectMetadata);
					clipType = (xmp.getProperty("http://ns.adobe.com/premierePrivateProjectMetaData/1.0/", "Column.Intrinsic.MediaType")).toString().replace();
				}
			}
			if (clipType && typeof clipType != "undefined"){
				if (clipType == "Audio")
					clipIsVideo = false;
			}
			if (!clipIsVideo) {
				videoTrack = mainSequence.audioTracks[0];
			}
			//start at the end of previous clip
			var insertionTime = buildSequenceObject.latestEnd;
			// if clip has no timecodes, just insert the whole clip
			var continueInsert = true;
			if (!startTime || typeof startTime == "undefined" || startTime == "NULLSTARTTIME"){
				// add clip to end of previous clip, starting from first clip
				visualClip.clearOutPoint();
				// if it's an image, end it after 3 seconds
				if (visualFileType == "jpg" || visualFileType == "png"){
					visualClip.setInPoint(0);
					visualClip.setOutPoint(3);
				}
			}
			else {
				var startSeconds = timecodeToSeconds(startTime);
				var endSeconds = timecodeToSeconds(endTime);
				// check that start and end times are valid
				if (typeof startSeconds != "undefined" && typeof endSeconds != "undefined"){
					// add clip to the beginning of timeline, starting from last clip
					visualClip.clearOutPoint();
					//make sure the endpoint isn't further along than the origina clip's true end
					var originalOut = visualClip.getOutPoint().seconds;
					if (endSeconds > originalOut){
						endSeconds = originalOut;
					}
					visualClip.setInPoint(startSeconds);
					visualClip.setOutPoint(endSeconds);
				}
				else {
					continueInsert = false;
					errorArray.push(visual + " not inserted. Please convert its timecodes in your script to format (mm:ss) or (hh:mm:ss)\n\n");
				}
			}
			if (continueInsert){
				//insert
				videoTrack.insertClip(visualClip, insertionTime);
				var lastClipIndex = videoTrack.clips.numItems;
				if (lastClipIndex > 0){
					lastClipIndex = lastClipIndex - 1;
					buildSequenceObject.latestStart = videoTrack.clips[lastClipIndex].start;
					buildSequenceObject.latestEnd = videoTrack.clips[lastClipIndex].end;
				}
				if (mode2 == "true")
					$.runScript.insertCourtesy(buildSequenceObject.latestStart, buildSequenceObject.latestEnd, courtesy, 3);
				if (mode3 == "true")
					$.runScript.insertTOS(buildSequenceObject.latestStart, buildSequenceObject.latestEnd, theText, 1);
				}
		}

		else {
			// insert a marker to alert user of bad clip
			errorArray.push(visual + " not inserted. No media in your project matched that filename.\n\n");
		}
	
		if (errorArray.length >= 1) {
			// add new marker or append its comments to the previous one if it's also at time = 0, to avoid stacking markers
			var newMarker;
			var markerComments = "";
			// if there's a previous marker, and if it's at time = 0, set selected marker to that one
			var insertionSeconds = 0;
			if (buildSequenceObject.latestEnd != 0){
				insertionSeconds = buildSequenceObject.latestEnd.seconds;
			}
			if (mainSequence.markers.numMarkers > 0){
				var testLastMarker = mainSequence.markers.getLastMarker();
				if (typeof testLastMarker.end != "undefined"){
					if (testLastMarker.end.seconds.toFixed(2) == insertionSeconds.toFixed(2)){
						newMarker = mainSequence.markers.getLastMarker();
						markerComments = newMarker.comments;
					}
					else
						newMarker = mainSequence.markers.createMarker(insertionSeconds);
				}
				else
						newMarker = mainSequence.markers.createMarker(insertionSeconds);
			}
			// otherwise, create a new one
			else
				newMarker = mainSequence.markers.createMarker(insertionSeconds);

			newMarker.name = "Vaporu: Script Importer Alert";
			// concatenate all the errors
			for (i = 0; i < errorArray.length; i++){
				// add all comments to marker's previous comments
				markerComments += errorArray[0];
			}
			newMarker.comments = markerComments;
			newMarker.type = "Chapter";
		}

		function timecodeToSeconds(timecode){
			var totalSeconds = 0;
			timeSegments = timecode.split(":");
			if (timeSegments.length == 1 || timeSegments.length > 3){
				return;
			}
			// if format is mm:sss
			else {
				// add minutes * 60 and seconds and parse them, using radix 10 to remove leading 0's
				totalSeconds += parseInt(timeSegments[0], 10) * 60;
				totalSeconds += parseInt(timeSegments[1], 10);
			}
			// if format is hh:mm:sss
			if (timeSegments.length == 3){
				// 3600 seconds in an hour
				totalSeconds += parseInt(timeSegments[2], 10) * 3600;
			}
			return totalSeconds;
		}

		// function from Premiere CEP panel
		function searchForBinWithName(nameToFind) {
			// deep-search a folder by name in project
			var deepSearchBin = function (inFolder) {
				if (inFolder && inFolder.name === nameToFind && inFolder.type === 2) {
					return inFolder;
				} else {
					for (var i = 0; i < inFolder.children.numItems; i++) {
						if (inFolder.children[i] && inFolder.children[i].type === 2) {
							var foundBin = deepSearchBin(inFolder.children[i]);
							if (foundBin) {
								return foundBin;
							}
						}
					}
				}
			};
			return deepSearchBin(app.project.rootItem);
		}
	},

	insertTOS: function (insertTime, endTime, TOSText, vidTrack) {
			app.enableQE();
		
			var mainSequence = app.project.activeSequence;
			var vTrack = mainSequence.videoTracks[2];
			var aTrack = mainSequence.audioTracks[0];

			// if NULLTEXT, don't add it 
			if (TOSText != "NULLTEXT"){
				var formattedInsertionTime = 0;
				if (insertTime != 0){
					formattedInsertionTime = insertTime.seconds
				}
				var newMOGRT = mainSequence.importMGTFromLibrary("Insider", "TOS", formattedInsertionTime, vidTrack, 1);
				if (newMOGRT){// cut at end time of the clip below
					newMOGRT.end = endTime;
					newMOGRT.setSelected(true);
					if (newMOGRT){
						// set all social media types off
						var components = newMOGRT.getMGTComponent();
						components.properties.getParamForDisplayName("Text").setValue(TOSText);
						//set to square version if that's the sequence
						var seqAR = mainSequence.frameSizeHorizontal/mainSequence.frameSizeVertical;
						var mogrtAR = components.properties.getParamForDisplayName("Wide/Square/Vertical");
						if (mogrtAR && typeof mogrtAR != "undefined"){
							if (seqAR == 1){
								mogrtAR.setValue(2);
							}
							else if (seqAR == 9/16) {
								mogrtAR.setValue(3);
							}
						}
						return newMOGRT;
					}
				}
			}
		},

	insertCourtesy: function (insertTime, endTime, courtesyText, vidTrack){
		app.enableQE();
	
		var mainSequence = app.project.activeSequence;
		var vTrack = mainSequence.videoTracks[1];
		var aTrack = mainSequence.audioTracks[0];

		// if NULLCOURTESY, don't add it 
		if (courtesyText != "NULLCOURTESY"){
			var formattedInsertionTime = 0;
			if (insertTime != 0){
				formattedInsertionTime = insertTime.seconds
			}
			var newMOGRT = mainSequence.importMGTFromLibrary("Insider", "Courtesy", formattedInsertionTime, vidTrack, 1);
			if (newMOGRT){
				// cut at end time of the clip below
				newMOGRT.end = endTime;
				newMOGRT.setSelected(true);
				// set all social media types off
				var components = newMOGRT.getMGTComponent();
				for (var i = 2; i < 6; i++) {
					//alert(i);
					components.properties[i].setValue(false);
				}

				// parse the input for type 
				var courtesyElements = (courtesyText.split(")")[0]).split("(");
				if (courtesyElements && courtesyElements.length == 2){
					var logoIndex;
					var logoType = courtesyElements[1].toLowerCase();
					//alert(" courtesy: " + courtesyText + " courtesyElements: " + courtesyElements[1] + " char: " + logoType.charAt(0));
					if (logoType.charAt(0) == "i"){
							logoIndex = 2;
					}
					if (logoType.charAt(0) == "y"){
							logoIndex = 3;
					}
					if (logoType.charAt(0) == "f"){
							logoIndex = 4;
					}
					if (logoType.charAt(0) == "t"){
							logoIndex = 5;
					}
					if (logoType.charAt(0) == "s"){
							logoIndex = 6;
					}
					//components.properties[logoIndex].setValue(true);
					components.properties[logoIndex].setValue(true);
					// set the courtesy text
					components.properties.getParamForDisplayName("Courtesy Text").setValue(courtesyElements[0]);
				}
				else {
					components.properties.getParamForDisplayName("Courtesy Text").setValue(courtesyText);
				}

				//set to square version if that's the sequence
				var seqAR = mainSequence.frameSizeHorizontal/mainSequence.frameSizeVertical;
				var mogrtAR = components.properties.getParamForDisplayName("Wide/Square/Vertical");
				if (mogrtAR && typeof mogrtAR != "undefined"){
					if (seqAR == 1){
						mogrtAR.setValue(2, 1);
					}
					else if (seqAR == 9/16) {
						mogrtAR.setValue(3, 1);
					}
				}
				return newMOGRT;
			}
		}
	},

	insertCaption: function (insertTime, endTime, captionText, vidTrack, isFirstCaption) {
			app.enableQE();
			var mainSequence = app.project.activeSequence;
			var confirmDelete = false;

			// if NULLTEXT, don't add it 
			if (captionText && typeof captionText != "undefined"){
				var captionProjectItem;
				var newMOGRT;

				// check to see if the Captions MOGRT already exists 
				var MOGRTBin = $.runScript.searchForBinWithName("Motion Graphics Template Media");
				if (MOGRTBin && typeof MOGRTBin != "undefined" && MOGRTBin.type == 2){
					// go through the mogrt bin and find the Caption 
					for (i = 0; i < MOGRTBin.children.numItems; i++) {
						if (MOGRTBin.children[i].name == "Caption"){
							captionProjectItem = MOGRTBin.children[i];
							break;
						}
					}
					// mogrt bin exists but the Captions .aegraphic doesn't
					if (!captionProjectItem || typeof captionProjectItem == "undefined"){
						newMOGRT = mainSequence.importMGTFromLibrary("Insider", "Caption", parseFloat(insertTime), vidTrack, 1);
					}
				}
				// choose the mogrt bin. if it doesn't exist, create it
				if (!MOGRTBin || typeof MOGRTBin == "undefined"){
					newMOGRT = mainSequence.importMGTFromLibrary("Insider", "Caption", parseFloat(insertTime), vidTrack, 1);
					MOGRTBin = $.runScript.searchForBinWithName("Motion Graphics Template Media");
				}
				// if after adding the MOGRT, we now have the mogrt bin
				if (MOGRTBin && typeof MOGRTBin != "undefined" && MOGRTBin.type == 2){
					// go through the mogrt bin and find the Caption 
					for (i = 0; i < MOGRTBin.children.numItems; i++) {
						if (MOGRTBin.children[i].name == "Caption"){
							captionProjectItem = MOGRTBin.children[i];
							break;
						}
					}
					// if the caption projectItem somehow still doesn't exist, just bring it in from the MGT library
					if (captionProjectItem && typeof captionProjectItem != "undefined"){
						if (newMOGRT && newMOGRT != "undefined")
							newMOGRT.remove(false,true);
						captionProjectItem.setInPoint(0);
						captionProjectItem.setOutPoint(parseFloat(endTime) - parseFloat(insertTime));
						var vidTrackItem = app.project.activeSequence.videoTracks[vidTrack];
						//delete everything on the top track, then insert captions
						if (isFirstCaption && vidTrackItem.clips.numItems != 0){
							confirmDelete = confirm("This will delete all clips on track " + (vidTrack + 1) + ". Continue?");
							if (confirmDelete){
								while (vidTrackItem.clips.numItems > 0){
									vidTrackItem.clips[vidTrackItem.clips.numItems - 1].remove(false,true);
								}
							}
						}
						else
							confirmDelete = true;
							
						if (confirmDelete == true) {
							var originalNumberOfClips = vidTrackItem.clips.numItems;
							vidTrackItem.insertClip(captionProjectItem, parseFloat(insertTime));
							newMOGRT = vidTrackItem.clips[originalNumberOfClips];

							if (newMOGRT && newMOGRT != "undefined"){
								newMOGRT.setSelected(true);
								var components = newMOGRT.getMGTComponent();
								components.properties.getParamForDisplayName("Text").setValue(captionText, 1);
								//set to square version if that's the sequence
								var seqAR = mainSequence.frameSizeHorizontal/mainSequence.frameSizeVertical;
								var mogrtAR = components.properties.getParamForDisplayName("Wide/Square/Vertical");
								if (seqAR == 1)
									mogrtAR.setValue(2);
								else if (seqAR == 9/16) 
									mogrtAR.setValue(3);
							}
						}
					}
				}
			}
			return confirmDelete;
		},

	//--------------------------------------------------------------------------------------------------------------------------------------------------

	initSequences: function (branding) {
		app.enableQE;


		var sequencesBin = $.runScript.searchForBinWithName("Sequences");
		var wideOriginalName = "Insider_[ProjectNameehere]_16X9_V1";
		var squareOriginalName = "Insider_[ProjectNameehere]_Square_V1";
		var verticalOriginalName = "Insider_[ProjectNameehere]_SnapchatShows";

		if (branding == "BI"){
			wideOriginalName = "BI_[ProjectNamehere]_16X9_V1";
			squareOriginalName = "BI_[ProjectNamehere]_Square_V1";
		}
		if (branding == "TI"){
			wideOriginalName = "TI_[ProjectNamehere]_16X9_V1";
			squareOriginalName = "TI_[ProjectNamehere]_Square_V1";
		}

		var templatesBin;
		var editsBin;

		// choose the sequences bin. if it doesn't exist, create it
		if (sequencesBin && typeof sequencesBin != "undefined"){
			// go through its children to get the Templates Bin and the Edits bin to insert copies into
			for (var i = 0; i < sequencesBin.children.numItems; i ++) {
				if (sequencesBin.children[i].name == "Templates" && sequencesBin.children[i].type == 2){
					templatesBin = sequencesBin.children[i];
				}
				if (sequencesBin.children[i].name == "Edits" && sequencesBin.children[i].type == 2){
					editsBin = sequencesBin.children[i];
				}
			}
		}

		if (templatesBin && typeof templatesBin != "undefined" && editsBin && typeof editsBin != "undefined"){
			var wideOriginalSeq;
			var squareOriginalSeq;
			var verticalOriginalSeq;
			for (var i = 0; i < templatesBin.children.numItems; i ++) {
				// find the wide, square, and vertical sequences and duplicate them to the Edits bin
				editsBin.select();
				if (templatesBin.children[i].name == wideOriginalName && templatesBin.children[i].isSequence()){
					wideOriginalSeq = templatesBin.children[i];
				}
			}
		}
	},

	//--------------------------------------------------------------------------------------------------------------------------------------------------

	// parts of this from Premiere CEP panel
	sequenceTranscode: function () {
		//app.encoder.bind('onEncoderJobComplete', $.runscript.onEncoderJobComplete);
		var mainSeq = app.project.activeSequence;
		outputPresetPath = "/Library/Application%20Support/Adobe/CEP/extensions/Vaporu/presets/InsiderInc_MezzanineFormat_ProRes.epr";
		if (File(outputPresetPath).exists){
			app.encoder.launchEncoder(); // This can take a while; let's get the ball rolling.
			var fileOutputPath = Folder.selectDialog("Choose the output directory");
			if (fileOutputPath) {
				var exportIDs = [];
				errorIDs = [];
				var errorMessage = "These files weren't sent: \n";
				var selection = mainSeq.getSelection();
				for (var i = 0; i < selection.length; i ++) {
					// get only the selected clips 
					var thisClipItem = selection[i].projectItem;
					if (thisClipItem) {
						var clipName = thisClipItem.name;
						// check for situations where this clip can't be converted
						var lastIndex = clipName.lastIndexOf(".");
						var extension = clipName.substr(lastIndex + 1);
						if (!thisClipItem.canChangeMediaPath()){
							if (errorIDs.indexOf(thisClipItem.nodeId) == -1){
								errorMessage += clipName + ": Premiere won't let you replace this item.\n\n"
								errorIDs.push(thisClipItem.nodeId);
							}
						}
						else if (extension.length > 3){
							if (errorIDs.indexOf(thisClipItem.nodeId) == -1){
								errorMessage += clipName + ": invalid file extension.\n\n"
								errorIDs.push(thisClipItem.nodeId);
							}
						}
						// else if this file is okay to be converted
						else {
							if (exportIDs.indexOf(thisClipItem.nodeId) == -1){
								var clipStart = thisClipItem.getInPoint();
								var clipEnd = thisClipItem.getOutPoint();
								// clear in and outs to ensure clip transcodes fully
								thisClipItem.clearInPoint();
								thisClipItem.clearOutPoint();
								$.runScript.transcodeProjectItem(thisClipItem, outputPresetPath, fileOutputPath);
								// then reset the ins and outs
								thisClipItem.setInPoint(clipStart);
								thisClipItem.setOutPoint(clipEnd);
								exportIDs.push(thisClipItem.nodeId);
							}
						}
					}
				}
				app.encoder.startBatch();
				if (errorIDs.length == 0){
					errorMessage = "";
				}
				if (exportIDs.length == 1){
					alert("1 file sent to Encoder. Don't replace it until it's done. " + errorMessage)
				}
				else {
					alert(exportIDs.length + " files sent to Encoder. Don't replace them until they're done. " + errorMessage)
				}
			}
		}
		else {
			alert("The transcoding preset wasn't found.")
		}
	},

	replaceTranscodes: function () {
		var mainSeq = app.project.activeSequence;

		var vaporuBin = $.runScript.searchForBinWithName("Vaporu");
		// choose the vaporu bin. if it doesn't exist, create it
		if (!vaporuBin || typeof vaporuBin == "undefined"){
			app.project.rootItem.createBin("Vaporu");
			vaporuBin = $.runScript.searchForBinWithName("Vaporu");
		}
		// if failure to create, just import to root
		if (!vaporuBin || typeof vaporuBin == "undefined"){
			vaporuBin = app.project.rootItem;
		}
		vaporuBin.select();
		var errorArray = [];
		var selection = mainSeq.getSelection();
		if (selection.length == 0) {
			alert("No clips are selected for replacement.")
		}
		var replacementPath = Folder.selectDialog("Choose the folder your transcodes are in.");
		if (replacementPath && replacementPath != "undefined"){
			// to ensure that we don't repeatedly replace clips with the same projectItem
			var replaceIDs = [];
			// go through each media to replace, then replace it.
			for (var i = 0; i < selection.length; i ++) {
				//ensure that we're selecting a video
				if (selection[i].projectItem && selection[i].mediaType == "Video"){
					if (replaceIDs.indexOf(selection[i].projectItem.nodeId) == -1){
						//ensure the projectItem can be changed
						if (selection[i].projectItem.canChangeMediaPath()){
							var fullReplacementPath = replacementPath.fsName + '/' + selection[i].projectItem.name + ".mov";
							var errorMessage = "Transcoded file " + fullReplacementPath + " either doesn't exist or hasn't finished transcoding. Check Adobe Media Encoder to see whether it's in the queue.";
							if (File(fullReplacementPath).exists){
								var originalMediaPath = selection[i].projectItem.getMediaPath();
								// get original duration
								var OGClipDuration = 0;
								if (app.isDocumentOpen()) {
									if (ExternalObject.AdobeXMPScript == undefined) {
										ExternalObject.AdobeXMPScript = new ExternalObject("lib:AdobeXMPScript");
									}
									if (ExternalObject.AdobeXMPScript != undefined) {
										var projectMetadata = selection[i].projectItem.getProjectMetadata();
										var xmp = new XMPMeta(projectMetadata);
										OGClipDuration = (xmp.getProperty("http://ns.adobe.com/premierePrivateProjectMetaData/1.0/", "Column.Intrinsic.VideoDuration")).toString().replace(/\D/g,'');
									}
								}

								// replace the clip with version in transcodes folder, then check its duration
								var replaceSuccess = selection[i].projectItem.changeMediaPath(fullReplacementPath, true);
								var newClipDuration = 0;
								if (app.isDocumentOpen()) {
									if (ExternalObject.AdobeXMPScript == undefined) {
										ExternalObject.AdobeXMPScript = new ExternalObject("lib:AdobeXMPScript");
									}
									if (ExternalObject.AdobeXMPScript != undefined) {
										var projectMetadata = selection[i].projectItem.getProjectMetadata();
										var xmp = new XMPMeta(projectMetadata);
										newClipDuration = (xmp.getProperty("http://ns.adobe.com/premierePrivateProjectMetaData/1.0/", "Column.Intrinsic.VideoDuration")).toString().replace(/\D/g,'');
									}
								}

								// if the new and old durations don't match, replace new clip with the old one again
								if ( newClipDuration != OGClipDuration){
									replaceSuccess = false;
									if (selection[i].projectItem.canChangeMediaPath()){
										selection[i].projectItem.changeMediaPath(originalMediaPath, true);
									}
									errorMessage = "The replacement for " + selection[i].projectItem.name + " doesn't match the original clip's duration. Make sure your filenames match and there are no duplicates.";
								}

								// changemediapath() returns 1 if successful, which is inconsistent with the documentation
								if (replaceSuccess && replaceSuccess != "undefined"){
									// set its log note
									if (app.isDocumentOpen()) {
										if (ExternalObject.AdobeXMPScript == undefined) {
											ExternalObject.AdobeXMPScript = new ExternalObject("lib:AdobeXMPScript");
										}
										if (ExternalObject.AdobeXMPScript != undefined) {
											var projectMetadata = selection[i].projectItem.getProjectMetadata();
											var xmp = new XMPMeta(projectMetadata);
											// set the XMP log note to nothing
											xmp.setProperty("http://ns.adobe.com/premierePrivateProjectMetaData/1.0/", "Column.Intrinsic.LogNote", "Replaced by Vaporu. Original path: " + originalMediaPath);
											var str = xmp.serialize();
											var array = new Array();
											array[0] = "Column.Intrinsic.LogNote";

											var setLogNoteFailed = selection[i].projectItem.setProjectMetadata(xmp.serialize(), ["Column.Intrinsic.LogNote"]);
											// if setting log note failed
											if (setLogNoteFailed){
												errorMessage = "Log note couldn't be set for " + selection[i].projectItem.name + ". Make sure Xchange doesn't already think the clip is archived.";
												errorArray.push([selection[i].start.seconds, errorMessage]);
											}
										}
									}
								}
								else {
									errorArray.push([selection[i].start.seconds, errorMessage]);
								}
								// whether or not the projectItem was changed, refresh the projectItem
								replaceIDs.push(selection[i].projectItem.nodeId);
								selection[i].projectItem.refreshMedia();
							}
							else {
								errorArray.push([selection[i].start.seconds, errorMessage]);
							}
						}
						else {
							errorMessage = "Can't change media path for " + selection[i].name + ".";
							errorArray.push([selection[i].start.seconds, errorMessage]);
						}
					}
				}
			}
			if (replaceIDs.length == 1){
				alert("1 file replaced with its MOV.")
			}
			else {
				alert(replaceIDs.length + " files replaced with MOVs.")
			}
			
		}

		for (i = 0; i < errorArray.length; i++){
			// add new marker or append its comments to the previous one if it's also at time = 0, to avoid stacking markers
			var newMarker;
			var markerComments = "";
			// if there's a previous marker, and if it's at time = 0, set selected marker to that one
			var insertionTime = 0;
			if (mainSeq.markers.numMarkers > 0 && mainSeq.markers.getLastMarker().end.seconds == errorArray[i][0]){
				newMarker = mainSeq.markers.getLastMarker();
				markerComments = newMarker.comments;
			}
			// otherwise, create a new one
			else { 
				newMarker = mainSeq.markers.createMarker(errorArray[i][0]);
			}
			newMarker.name = "Vaporu: Replace Clip Alert";
			// add all comments to marker's previous comments
			markerComments += errorArray[i][1];
			newMarker.comments = markerComments;
			newMarker.type = "Chapter";
		}
	},


	//--------------------------------------------------------------------------------------------------------------------------------------------------


	// function from Premiere CEP panel
	searchForBinWithName: function (nameToFind) {
		// deep-search a folder by name in project
		var deepSearchBin = function (inFolder) {
			if (inFolder && inFolder.name === nameToFind && inFolder.type === 2) {
				return inFolder;
			} else {
				for (var i = 0; i < inFolder.children.numItems; i++) {
					if (inFolder.children[i] && inFolder.children[i].type === 2) {
						var foundBin = deepSearchBin(inFolder.children[i]);
						if (foundBin) {
							return foundBin;
						}
					}
				}
			}
		};
		return deepSearchBin(app.project.rootItem);
	},

	// function from Premiere OnScript
	transcodeProjectItem: function (projectItem, outputPresetPath, outputPath){
		var activeSequence = qe.project.getActiveSequence();
		if (activeSequence) {
			if (outputPath){
				var outPreset = new File(outputPresetPath);
				if (outPreset.exists === true){
					var outputFormatExtension = activeSequence.getExportFileExtension(outPreset.fsName);
					if (outputFormatExtension) {
						var fullPathToFile = outputPath.fsName + '/' + projectItem.name + "." + outputFormatExtension;
						var outFileTest = new File(fullPathToFile);
						if (outFileTest.exists) {
							destroyExisting = confirm('A file with the name "' + projectItem.name + '" already exists. Overwrite it?', false, 'Are you sure...?');
							if (destroyExisting){
								outFileTest.remove();
								outFileTest.close();
							}
						}
					}
				}
			}
		}
		// render 
		app.encoder.encodeProjectItem(projectItem, fullPathToFile, outPreset.fsName, app.encoder.ENCODE_ENTIRE, 0);
		outPreset.close ()

		return([projectItem, fullPathToFile])
	}

}