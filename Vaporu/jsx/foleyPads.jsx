$.runScript = {

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

//--------------------------------------------------------------------------------------------------------------------------------------------------
	getPadSound: function(clickedPad) {
		
		app.enableQE();
		
		var mainSequence = app.project.activeSequence;
		var audioTrack = mainSequence.audioTracks[selectedAudioOption - 1];
		var bins = app.project.rootItem.children;
		var numBins = app.project.rootItem.numChildren;
		var foleyBin = app.project.rootItem;

		// find the sequences bin
        for (var i = 0; i < bins.numItems; i++) {
            // search root folders
            if (bins[i].name === "Vaporu Foley Pads"){
                foleyBin = bins[i];
            }
            // search subfolders
            else {

            }
        }
	}
//--------------------------------------------------------------------------------------------------------------------------------------------------
}