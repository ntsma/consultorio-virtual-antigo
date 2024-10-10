export default {

    compatibilityTest() {
        var prefix;
        var version;
        if (window.mozRTCPeerConnection || navigator.mozGetUserMedia) {
            prefix = 'moz';
            version = parseInt(navigator.userAgent.match(/Firefox\/([0-9]+)\./)[1], 10);
        } else if (window.webkitRTCPeerConnection || navigator.webkitGetUserMedia) {
            prefix = 'webkit';
            version = navigator.userAgent.match(/Chrom(e|ium)/) && parseInt(navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./)[2], 10);
        }
    
        if (prefix == 'moz' || prefix == 'webkit' && version > 41) {
            return true;
        } else {
            return false;
        }    
    },



    generateRandomString() {
        const crypto = window.crypto || window.msCrypto;
        let array = new Uint32Array(1);

        return crypto.getRandomValues(array);
    },


    closeVideo(elemId) {
        if (document.getElementById(elemId)) {
            document.getElementById(elemId).remove();
            this.adjustVideoElemSize();
        }
        let statusEl = document.getElementById('status-atual');
        statusEl.removeAttribute('class');
        statusEl.setAttribute('class', 'status idle'); 
    },


    pageHasFocus() {
        return !(document.hidden || document.onfocusout || window.onpagehide || window.onblur);
    },


    getQString(url = '', keyToReturn = '') {
        url = url ? url : location.href;
        let queryStrings = decodeURIComponent(url).split('#', 2)[0].split('?', 2)[1];

        if (queryStrings) {
            let splittedQStrings = queryStrings.split('&');

            if (splittedQStrings.length) {
                let queryStringObj = {};

                splittedQStrings.forEach(function (keyValuePair) {
                    let keyValue = keyValuePair.split('=', 2);

                    if (keyValue.length) {
                        queryStringObj[keyValue[0]] = keyValue[1];
                    }
                });

                return keyToReturn ? (queryStringObj[keyToReturn] ? queryStringObj[keyToReturn] : null) : queryStringObj;
            }

            return null;
        }

        return null;
    },


    userMediaAvailable() {
        return !!(navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia);
    },


    getUserFullMedia() {
        if (this.userMediaAvailable()) {
            return navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: "user"
                },
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true
                }
            });
        }

        else {
            throw new Error('User media not available');
        }
    },


    getUserAudio() {
        if (this.userMediaAvailable()) {
            return navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true
                }
            });
        }

        else {
            throw new Error('User media not available');
        }
    },



    shareScreen() {
        if (this.userMediaAvailable()) {
            return navigator.mediaDevices.getDisplayMedia({
                video: {
                    cursor: "always"
                },
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100
                }
            });
        }

        else {
            throw new Error('User media not available');
        }
    },


    getIceServer() {
        return {
            iceServers: [
                // {
                //     urls: "stun:stun.l.google.com:19302"
                // },
                // {
                //     urls: "stun:stun1.l.google.com:19302"
                // },
                // {
                //     urls: "stun:stun2.l.google.com:19302"
                // },
                // {
                //     urls: "stun:stun3.l.google.com:19302"
                // },
                // {
                //     urls: "stun:stun4.l.google.com:19302"
                // },
                // {
                //     urls: 'turn:numb.viagenie.ca',
                //     credential: 'muazkh',
                //     username: 'webrtc@live.com'
                //  }
                {
                    urls: "stun:stun.relay.metered.ca:80",
                  },
                  {
                    urls: "turn:global.relay.metered.ca:80",
                    username: "5909aac9b1177452b3d7c038",
                    credential: "Ctz9ziR0nxHYQnPW",
                  },
                  {
                    urls: "turn:global.relay.metered.ca:80?transport=tcp",
                    username: "5909aac9b1177452b3d7c038",
                    credential: "Ctz9ziR0nxHYQnPW",
                  },
                  {
                    urls: "turn:global.relay.metered.ca:443",
                    username: "5909aac9b1177452b3d7c038",
                    credential: "Ctz9ziR0nxHYQnPW",
                  },
                  {
                    urls: "turns:global.relay.metered.ca:443?transport=tcp",
                    username: "5909aac9b1177452b3d7c038",
                    credential: "Ctz9ziR0nxHYQnPW",
                  },
            ]
        };
    },


    addChat(data, senderType) {
        let chatMsgDiv = document.querySelector('#chat-messages');
        let contentAlign = 'justify-content-end';
        let senderName = 'You';
        let msgBg = 'bg-white';

        if (senderType === 'remote') {
            contentAlign = 'justify-content-start';
            senderName = data.sender;
            msgBg = '';

            this.toggleChatNotificationBadge();
        }

        let infoDiv = document.createElement('div');
        infoDiv.className = 'sender-info';
        infoDiv.innerHTML = `${senderName} - ${moment().format('Do MMMM, YYYY h:mm a')}`;

        let colDiv = document.createElement('div');
        colDiv.className = `col-10 card chat-card msg ${msgBg}`;
        colDiv.innerHTML = xssFilters.inHTMLData(data.msg).autoLink({ target: "_blank", rel: "nofollow" });

        let rowDiv = document.createElement('div');
        rowDiv.className = `row ${contentAlign} mb-2`;


        colDiv.appendChild(infoDiv);
        rowDiv.appendChild(colDiv);

        chatMsgDiv.appendChild(rowDiv);

        /**
         * Move focus to the newly added message but only if:
         * 1. Page has focus
         * 2. User has not moved scrollbar upward. This is to prevent moving the scroll position if user is reading previous messages.
         */
        if (this.pageHasFocus) {
            rowDiv.scrollIntoView();
        }
    },


    toggleChatNotificationBadge() {
        if (document.querySelector('#chat-pane').classList.contains('chat-opened')) {
            document.querySelector('#new-chat-notification').setAttribute('hidden', true);
        }

        else {
            document.querySelector('#new-chat-notification').removeAttribute('hidden');
        }
    },



    replaceTrack(stream, recipientPeer) {
        let sender = recipientPeer.getSenders ? recipientPeer.getSenders().find(s => s.track && s.track.kind === stream.kind) : false;

        sender ? sender.replaceTrack(stream) : '';
    },



    toggleShareIcons(share) {
        let shareIconElem = document.querySelector('#share-screen');

        if (share) {
            shareIconElem.setAttribute('title', 'Stop sharing screen');
            shareIconElem.children[0].classList.add('text-primary');
            shareIconElem.children[0].classList.remove('text-white');
        }

        else {
            shareIconElem.setAttribute('title', 'Share screen');
            shareIconElem.children[0].classList.add('text-white');
            shareIconElem.children[0].classList.remove('text-primary');
        }
    },


    toggleVideoBtnDisabled(disabled) {
        document.getElementById('toggle-video').disabled = disabled;
    },


    maximiseStream(e) {
        let elem = e.target.parentElement.previousElementSibling;

        elem.requestFullscreen() || elem.mozRequestFullScreen() || elem.webkitRequestFullscreen() || elem.msRequestFullscreen();
    },


    singleStreamToggleMute(e) {
        if (e.target.classList.contains('fa-microphone')) {
            e.target.parentElement.previousElementSibling.muted = true;
            e.target.classList.add('fa-microphone-slash');
            e.target.classList.remove('fa-microphone');
        }

        else {
            e.target.parentElement.previousElementSibling.muted = false;
            e.target.classList.add('fa-microphone');
            e.target.classList.remove('fa-microphone-slash');
        }
    },


    saveRecordedStream(stream, user) {
        let blob = new Blob(stream, { type: 'video/webm' });

        let file = new File([blob], `${user}-${moment().unix()}-record.webm`);

        saveAs(file);
    },


    toggleModal(id, show) {
        let el = document.getElementById(id);

        if (show) {
            el.style.display = 'block';
            el.removeAttribute('aria-hidden');
        }

        else {
            el.style.display = 'none';
            el.setAttribute('aria-hidden', true);
        }
    },



    setLocalStream(stream, mirrorMode = true) {
        const localVidElem = document.getElementById('local');

        localVidElem.srcObject = stream;
        mirrorMode ? localVidElem.classList.add('mirror-mode') : localVidElem.classList.remove('mirror-mode');
    },


    adjustVideoElemSize() {
        // let elem = document.getElementsByClassName( 'card' );
        // let totalRemoteVideosDesktop = elem.length;
        // let newWidth = totalRemoteVideosDesktop <= 2 ? '50%' : (
        //     totalRemoteVideosDesktop == 3 ? '33.33%' : (
        //         totalRemoteVideosDesktop <= 8 ? '25%' : (
        //             totalRemoteVideosDesktop <= 15 ? '20%' : (
        //                 totalRemoteVideosDesktop <= 18 ? '16%' : (
        //                     totalRemoteVideosDesktop <= 23 ? '15%' : (
        //                         totalRemoteVideosDesktop <= 32 ? '12%' : '10%'
        //                     )
        //                 )
        //             )
        //         )
        //     )
        // );


        // for ( let i = 0; i < totalRemoteVideosDesktop; i++ ) {
        //     elem[i].style.width = newWidth;
        // }
    },


    createDemoRemotes(str, total = 6) {
        let i = 0;

        let testInterval = setInterval(() => {
            let newVid = document.createElement('video');
            newVid.id = `demo-${i}-video`;
            newVid.srcObject = str;
            newVid.autoplay = true;
            newVid.className = 'remote-video';

            //video controls elements
            let controlDiv = document.createElement('div');
            controlDiv.className = 'remote-video-controls';
            controlDiv.innerHTML = `<i class="fa fa-microphone text-white pr-3 mute-remote-mic" title="Mute"></i>
                <i class="fa fa-expand text-white expand-remote-video" title="Expand"></i>`;

            //create a new div for card
            let cardDiv = document.createElement('div');
            cardDiv.className = 'card card-sm';
            cardDiv.id = `demo-${i}`;
            cardDiv.appendChild(newVid);
            cardDiv.appendChild(controlDiv);

            //put div in main-section elem
            document.getElementById('videos').appendChild(cardDiv);

            this.adjustVideoElemSize();

            i++;

            if (i == total) {
                clearInterval(testInterval);
            }
        }, 2000);
    },


    // File Transfer Zanoni
    downloadFile(blob, fileName) {
        console.log('Sucesso ao Baixar')
        const a = document.querySelector('#linkDownload');
        const url = window.URL.createObjectURL(blob);
        a.href = url;
        a.download = fileName;
        a.removeAttribute('hidden');
        a.addEventListener('click',()=>{
            //window.URL.revokeObjectURL(url);
            a.setAttribute('hidden',true)
        })
       
    },



    shareFile(file, peerConnection) {
        if (file) {
            const channelLabel = file.name;
            const channel = peerConnection.createDataChannel(channelLabel);
            channel.binaryType = 'arraybuffer';
            channel.onopen = async () => {
                const arrayBuffer = await file.arrayBuffer();
                const htmlProgress = document.getElementById("myBar");
                document.getElementById('myProgress').hidden=false;
                // document.getElementById("circleSvgFile").style.fill = "yellow";
                // document.getElementById("PaperClip").style.display = "none";
                let PercentSend;
                const sizeBuffer = arrayBuffer.byteLength;
                
                for (let i = 0; i < arrayBuffer.byteLength; i += 65535) {
                    channel.send(arrayBuffer.slice(i, i + 65535));
                    PercentSend = parseInt( (i/sizeBuffer)*100 );
                    htmlProgress.style.width = PercentSend + "%";
                }
                // htmlProgress.remove();
                channel.send('EOF');
            };
            channel.onclose = () => {
                console.log('Arquivo Enviado com Sucesso');
                htmlProgress.style.width = "100%";
                // document.getElementById("circleSvgFile").style.fill = "green";
                // document.getElementById("CheckIcon").style.display = "inline-block";
                setTimeout(() => {
                    document.getElementById('myProgress').hidden=true;  
                },2000)
            };
        }else{
            const channelLabel = 'OTF';
            const channel = peerConnection.createDataChannel(channelLabel);
            channel.binaryType = 'arraybuffer';
            channel.onopen = async () => {            
                channel.send('FLAG');
            };
            channel.onclose = () => {
                console.log('Unlock Channel')
            };
        }
    }
};
