$(document).ready(function() {

    checkForUpdates();

    function checkForUpdates(){
        var versionURL = "https://raw.githubusercontent.com/Viezzo/Vaporu/master/Vaporu/version.txt";
        $.ajax({
            url: versionURL,
            dataType: 'text',
            success: function(data){
                var thisVersion = $("#panelVersion").text();
                $("#updateWarning").text("Vaporu version " + data + " is available to install using Self Service.")
                if (parseFloat(thisVersion) != parseFloat(data))
                    $("#updateNotification").css("display", "inline-block");
            }
        });
    }

    $(".fa-exclamation-circle").hover(function () {
        $(this).animate({color: "red"});
        $("#exporterRefreshTooltip").css("visibility", "visible");
        $("#updateWarning").slideDown();
    }, function(){
        $(this).animate({color: "#ff4000"});
        $("#exporterRefreshTooltip").css("visibility", "hidden");
        $("#updateWarning").slideUp();
    });
});
