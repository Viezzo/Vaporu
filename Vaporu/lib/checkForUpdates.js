$(document).ready(function() {

    checkForUpdates();
    var newestVersion = "";

    function checkForUpdates(){
        var versionURL = "https://raw.githubusercontent.com/Viezzo/Vaporu/master/Vaporu/version.txt";
        $.ajax({
            url: versionURL,
            dataType: 'text',
            success: function(data){
                newestVersion = data;
                var thisVersion = $("#panelVersion").text();
                $("#updateWarning").text("Vaporu " + data + " is available. Click red button for update link.")
                if (parseFloat(thisVersion) != parseFloat(data))
                    $("#updateNotification").css("display", "inline-block");
            }
        });
    }

    $(".fa-exclamation-circle").click(function () {
        $("#updateLink").css('display', 'block');
        $("#updateLink").select();
        document.execCommand("copy");
        $("#updateLink").css('display', 'none');

        $("#updateWarning").text("Link copied! Paste it into your internet browser.")
    });

    $(".fa-exclamation-circle").hover(function () {
        $(this).animate({color: "red"});
        $("#exporterRefreshTooltip").css("visibility", "visible");
        $("#updateWarning").slideDown();
    }, function(){
        $(this).animate({color: "#ff4000"});
        $("#exporterRefreshTooltip").css("visibility", "hidden");
        $("#updateWarning").slideUp();
        $("#updateWarning").text("Vaporu " + newestVersion + " is available. Click red button for update link.")
    });
});
