/**
 * Created by Bench on 7/4/2016.
 */


window.MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;
navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

// Global vars
var audioDevices;
var selectedAudioDevice;

// Load vars
var videoElement;
var audioOutputDropdown;

function doAtStart()
{
    // Initialize Global Vars
    audioDevices = null;
    selectedAudioDevice = null;

    // Check output permission
    // Load Output devices if available
    navigator.getUserMedia({ video: false, audio: true }, function(mediaObj)
    {
        navigator.mediaDevices.enumerateDevices().then(loadDevices).catch(handleError);
    }, function(mediaObj)
    {
        console.log("There was an error: " + errorObj);
    });
}

function doAtLoad()
{
    if (audioOutputDropdown !== null && document.getElementById("audioOutputDropdown") !== null)
        return;

    // Initialize Local Vars
    videoElement = document.getElementsByClassName("video-stream")[0];

    // Inject elements into page
    var appendElement = document.getElementById("meta");
    if (appendElement === null)
        appendElement = document.getElementById("watch-header");

    if (appendElement === null)
    {
        //console.log("Unable to find 'watch-header' element!");
        return false;
    }

    var div = document.createElement("div");
    div.setAttribute("class", "select");

    var select = document.createElement("select");
    select.setAttribute("id", "audioOutputDropdown");

    appendElement.appendChild(div);
    div.appendChild(select);

    /*
     <div class="select">
     <label for="audioOutput">Audio output destination: </label><select id="audioOutput"></select>
     </div>
     */

    audioOutputDropdown = select;

    populateDropdown();
}


function populateDropdown()
{
    if (audioOutputDropdown === undefined || audioOutputDropdown === null)
    {
        console.log("Select option is undefined!");
        return false;
    }

    while (audioOutputDropdown.firstChild) {
        audioOutputDropdown.removeChild(audioOutputDropdown.firstChild);
    }

    if (audioDevices === null)
    {
        addOption(null, 'Unable to access output devices');
    }
    else if (audioDevices.length === 0)
    {
        addOption(null, 'No audio devices found');
    }
    else
    {
        for (var i = 0; i !== audioDevices.length; ++i) {
            var audioDevice = audioDevices[i];
            addOption(audioDevice.value, audioDevice.label);
        }
        if (selectedAudioDevice !== null)
        {
            audioOutputDropdown.value = selectedAudioDevice;
        }
        audioOutputDropdown.onchange = changeAudioDestination;
    }
}

function addOption(value, text)
{
    var option = document.createElement('option');
    option.value = value;
    option.text = text;
    audioOutputDropdown.appendChild(option);
}


function changeAudioDestination() {
    selectedAudioDevice = audioOutputDropdown.value;
    attachSinkId(videoElement, selectedAudioDevice);
}

function loadDevices(deviceInfos) {

    selectedAudioDevice = null;
    audioDevices = [];

    for (var i = 0; i !== deviceInfos.length; ++i)
    {
        var deviceInfo = deviceInfos[i];

        if (deviceInfo.kind === 'audiooutput')
        {
            //Skip Communications as it causes some bugs
            if (deviceInfo.label === 'Communications')
                continue;

            var deviceLabel = deviceInfo.label || 'speaker ' + (audioDevices.length + 1);

            if (audioDevices.length === 0)
                deviceLabel = "Select output device (" + deviceLabel + ")";

            audioDevices.push(
                {
                    value: deviceInfo.deviceId,
                    label: deviceLabel
                }
            );

        }
    }
}

// Attach audio output device to video element using device/sink ID.
function attachSinkId(element, sinkId) {

    console.log("Attaching to: " + sinkId);

    if (typeof element.sinkId !== 'undefined') {
        element.setSinkId(sinkId)
            .then(function() {
                console.log('Success, audio output device attached: ' + sinkId);
            })
            .catch(function(error) {
                var errorMessage = error;
                if (error.name === 'SecurityError') {
                    errorMessage = 'You need to use HTTPS for selecting audio output ' +
                        'device: ' + error;
                }
                console.error(errorMessage);
                // Jump back to first output device in the list as it's the default.
                audioOutputDropdown.selectedIndex = 0;
            });
    } else {
        console.warn('Browser does not support output device selection.');
    }
}


doAtStart();

var bodyObserver;

if (bodyObserver) bodyObserver.disconnect();

bodyObserver = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {

        if (mutation.attributeName && mutation.attributeName === 'style') {

            var host = document.location.host;
            var isYouTube_host = (host.substr(host.length - 11) === 'youtube.com' && host !== 'm.youtube.com');
            var isYouTube_target = ((mutation.target.baseURI).match("youtube.com") !== null);

            if (mutation && mutation.target && isYouTube_host && isYouTube_target)
            {
                if ((mutation.target.baseURI).match("watch\\?") !== null)
                {

                    //if (mutation.target.className.match('page-loaded') !== null)
                    //{
                        doAtLoad();
                    //}

                } else {
                    console.log('This is not a video page');
                }
            } else {
                console.log('NOT YOUTUBE.COM');
            }

        }
    });
});
bodyObserver.observe(document.body, { attributes: true, subtree: false });


function handleError(error) {
    console.log('ERROR: ', error);
}