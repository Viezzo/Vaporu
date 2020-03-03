$(document).ready(function() {

    checkForUpdates();

    function checkForUpdates(){
        var versionURL = "https://raw.githubusercontent.com/Viezzo/Vaporu/master/Vaporu/version.txt";
        $.ajax({
            url: versionURL,
            dataType: 'text',
            success: function(data){
                var thisVersion = $("#panelVersion").text();
                if (parseFloat(thisVersion) != parseFloat(data))
                    $("#updateNotification").css("display", "inline-block");
            }
        });
    }

    $('[data-toggle="updateTooltip"]').tooltip();
});
