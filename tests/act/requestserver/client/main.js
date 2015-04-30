var isMozilla = window.mozRTCPeerConnection && !window.webkitRTCPeerConnection;
if (isMozilla) {
    window.webkitURL = window.URL;
    navigator.webkitGetUserMedia = navigator.mozGetUserMedia;
    window.webkitRTCPeerConnection = window.mozRTCPeerConnection;
    window.RTCSessionDescription = window.mozRTCSessionDescription;
    window.RTCIceCandidate = window.mozRTCIceCandidate;
}

var remoteView;
var callButton;
var audioCheckBox;
var videoCheckBox;
var audioOnlyView;
var signalingChannel;
var pc;
var peer;
var localStream;
var channel;
var startup_time = new Date();

if (!window.hasOwnProperty("orientation"))
    window.orientation = -90;

// must use 'url' here since Firefox doesn't understand 'urls'
var configuration = {
  "iceServers": [
  {
    "url": "stun:mmt-stun.verkstad.net"
  },
  {
    "url": "turn:mmt-turn.verkstad.net",
    "username": "webrtc",
    "credential": "secret"
  }
  ]
};

window.onload = function () {
    remoteView = document.getElementById("remote_view");
    callButton = document.getElementById("call_but");
    var joinButton = document.getElementById("join_but");
    audioCheckBox = document.getElementById("audio_cb");
    videoCheckBox = document.getElementById("video_cb");
    audioOnlyView = document.getElementById("audio-only-container");
    var shareView = document.getElementById("share-container");

    joinButton.disabled = !navigator.webkitGetUserMedia;
    joinButton.onclick = function (evt) {
        if (!(audioCheckBox.checked || videoCheckBox.checked )) {
            alert("Choose at least audio, video or chat.");
            return;
        }

        audioCheckBox.disabled = videoCheckBox.disabled = true;

        // only chat
        if (!(videoCheckBox.checked || audioCheckBox.checked)) peerJoin();

        function peerJoin() {
            var sessionId = document.getElementById("session_txt").value;
            signalingChannel = new SignalingChannel(sessionId);

            // show and update share link
            var link = document.getElementById("share_link");
            var maybeAddHash = window.location.href.indexOf('#') !== -1 ? "" : ("#" + sessionId);
            link.href = link.textContent = window.location.href + maybeAddHash;
            shareView.style.visibility = "visible";

            callButton.onclick = function () {
                start(true);
            };

            // another peer has joined our session
            signalingChannel.onpeer = function (evt) {

                callButton.disabled = false;
                shareView.style.visibility = "hidden";

                peer = evt.peer;
                peer.onmessage = handleMessage;

                if (peer.userId < signalingChannel.userId)
                {
                    start(true);
                }

                peer.ondisconnect = function () {
                    callButton.disabled = true;
                    remoteView.style.visibility = "hidden";
                    if (pc)
                        pc.close();
                    pc = null;
                };
            };
        }

        // get a local stream
        navigator.webkitGetUserMedia({ "audio": true,
            "video": true}, function (stream) {
            // .. and keep it to be sent later
            localStream = stream;

            joinButton.disabled = true;

            peerJoin();
        }, logError);
    };

    var hash = location.hash.substr(1);
    if (hash) {
        document.getElementById("session_txt").value = hash;
        log("Auto-joining session: " + hash);
        setTimeout(function() {
            joinButton.click();
        }, 100)
    } else {
        // set a random session id
        document.getElementById("session_txt").value = Math.random().toString(16).substr(4);
    }
};

// handle signaling messages received from the other peer
function handleMessage(evt) {
    var message = JSON.parse(evt.data);

    if (!pc && (message.sdp || message.candidate))
        start(false);

    if (message.sdp) {
        var desc = new RTCSessionDescription(message.sdp);
        pc.setRemoteDescription(desc, function () {
            // if we received an offer, we need to create an answer
            if (pc.remoteDescription.type == "offer")
                pc.createAnswer(localDescCreated, logError);
        }, logError);
    } else if (!isNaN(message.orientation) && remoteView) {
        var transform = "rotate(" + message.orientation + "deg)";
        remoteView.style.transform = remoteView.style.webkitTransform = transform;
    } else
        pc.addIceCandidate(new RTCIceCandidate(message.candidate), function () {}, logError);
}

// call start() to initiate
function start(isInitiator) {
    callButton.disabled = true;
    pc = new webkitRTCPeerConnection(configuration);

    // send any ice candidates to the other peer
    pc.onicecandidate = function (evt) {
        if (evt.candidate) {
            peer.send(JSON.stringify({ "candidate": evt.candidate }));
            console.log("candidate emitted: " + evt.candidate.candidate);
        }
    };

    // let the "negotiationneeded" event trigger offer generation
    pc.onnegotiationneeded = function () {
        // check signaling state here because Chrome dispatches negotiationeeded during negotiation
        if (pc.signalingState == "stable")
            pc.createOffer(localDescCreated, logError);
    };

    // once the remote stream arrives, show it in the remote video element
    pc.onaddstream = function (evt) {
        var sessionId = document.getElementById("session_txt").value;
        var xhttp = new XMLHttpRequest();

        remoteView.src = URL.createObjectURL(evt.stream);
        if (videoCheckBox.checked)
            remoteView.style.visibility = "visible";
        else if (audioCheckBox.checked)
            audioOnlyView.style.visibility = "visible";
        sendOrientationUpdate();

        var timestamp = new Date().getTime();
        console.debug("request sent with timestamp: " + timestamp);
        xhttp.open("get", "http://localhost:8081" + "?timestamp=" + timestamp, true);
        xhttp.send();
        
    };

    if (audioCheckBox.checked || videoCheckBox.checked) {
        pc.addStream(localStream);
    }

    // the negotiationneeded event is not supported in Firefox
    if (isMozilla && isInitiator)
        pc.onnegotiationneeded();
}

function localDescCreated(desc) {
    pc.setLocalDescription(desc, function () {
        peer.send(JSON.stringify({ "sdp": pc.localDescription }));
        console.log("localDescription set and sent to peer, type: " + pc.localDescription.type + ", sdp: " + pc.localDescription.sdp);
    }, logError);
}

function sendOrientationUpdate() {
    peer.send(JSON.stringify({ "orientation": window.orientation + 90 }));
}

window.onorientationchange = function () {
    if (peer)
        sendOrientationUpdate();

};

function logError(error) {
    if (error) {
        if (error.name && error.message)
            log(error.name + ": " + error.message);
        else
            log(error);
    } else
        log("Error (no error message)");
}

function log(msg) {
    log.div = log.div || document.getElementById("log_div");
    log.div.appendChild(document.createTextNode(msg));
    log.div.appendChild(document.createElement("br"));
}