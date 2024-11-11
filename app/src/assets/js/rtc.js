import h from './helpers.js';

let emptyRoomMessage = document.getElementById('empty-room-message');
let copyRoomLink = document.getElementById('copy-room-link');
let lastVideoCount = 0;

// Função para verificar o estado da sala
function checkRoomState() {
    const remoteVideos = document.getElementsByClassName('remote-video');
    const currentVideoCount = remoteVideos.length;
    
    // Se o número de vídeos mudou, atualizamos o estado
    if (currentVideoCount !== lastVideoCount) {
        if (currentVideoCount === 0) {
            // Sala vazia
            emptyRoomMessage.classList.remove('hidden');
            document.body.style.background = "#222222 url('./assets/img/hexagon.svg') center 10em no-repeat";
        } else {
            // Sala com participantes
            emptyRoomMessage.classList.add('hidden');
            document.body.style.background = "#222222";
        }
        lastVideoCount = currentVideoCount;
    }
}

// Iniciar verificação periódica
function startRoomStateCheck() {
    // Verificação inicial
    checkRoomState();
    
    // Verificar a cada 0,1 segundos
    setInterval(checkRoomState, 100);
}

// Adicione o evento de clique para copiar o link
copyRoomLink.addEventListener('click', (e) => {
    e.preventDefault();
    navigator.clipboard.writeText(window.location.href).then(() => {
        copyRoomLink.textContent = "Link copiado!";
        setTimeout(() => {
            copyRoomLink.textContent = "clique aqui";
        }, 10000);
    });
});

window.addEventListener('load', () => {
    const room = h.getQString(location.href, 'room');
    const username = sessionStorage.getItem('username');

    if (!h.compatibilityTest()) location.pathname = 'error';

    if (!room) {
        document.querySelector('#room-create').attributes.removeNamedItem('hidden');
        document.querySelector('#login').attributes.removeNamedItem('hidden');//welcome
    }

    else if (!username) {
        document.querySelector('#username-set').attributes.removeNamedItem('hidden');
    }

    else {
        // Inicialmente mostra a mensagem e o hexagon
        document.getElementById('empty-room-message').classList.remove('hidden');
        document.body.style.background = "#222222 url('./assets/img/hexagon.svg') center 10em no-repeat";

        let commElem = document.getElementsByClassName('room-comm');
        document.querySelector('#icons').attributes.removeNamedItem('hidden');

        // Remove a definição inicial do background
        // document.body.style.background = "#222222 url('./assets/img/hexagon.svg') center 10em no-repeat";

        for (let i = 0; i < commElem.length; i++) {
            commElem[i].attributes.removeNamedItem('hidden');
        }

        var pc = [];

        let socket = io('/stream');

        var socketId = '';
        var myStream = '';
        var screen = '';
        var recordedStream = [];
        var mediaRecorder = '';

        //Get user video by default
        getAndSetUserStream();


        socket.on('connect', () => {
            // Mostrar mensagem quando está sozinho
            emptyRoomMessage.classList.remove('hidden');

            //set socketId
            socketId = socket.io.engine.id;

            socket.on('full', () => {
                location.pathname = 'full';
            });

            socket.emit('subscribe', {
                room: room,
                socketId: socketId
            });

            // Também precisamos verificar quando entramos em uma sala que já tem pessoas
            socket.on('connect', () => {
                socketId = socket.io.engine.id;
                
                // Verificar se já existem vídeos remotos na sala
                const remoteVideos = document.getElementsByClassName('remote-video');
                if (remoteVideos.length === 0) {
                    // Se não houver vídeos remotos, mostra a mensagem
                    document.getElementById('empty-room-message').classList.remove('hidden');
                    document.body.style.background = "#222222 url('./assets/img/hexagon.svg') center 10em no-repeat";
                } else {
                    // Se já houver vídeos remotos, esconde a mensagem
                    document.getElementById('empty-room-message').classList.add('hidden');
                    document.body.style.background = "#222222";
                }
            });

            socket.on('new user', (data) => {
                // Quando um novo usuário entra, escondemos a mensagem
                document.getElementById('empty-room-message').classList.add('hidden');
                document.body.style.background = "#222222";
                
                socket.emit('newUserStart', { to: data.socketId, sender: socketId });
                pc.push(data.socketId);
                init(true, data.socketId);
            });

            // Adiciona um evento para verificar usuários existentes
            socket.on('existing users', (count) => {
                if (count > 0) {
                    document.getElementById('empty-room-message').classList.add('hidden');
                    document.body.style.background = "#222222";
                } else {
                    document.getElementById('empty-room-message').classList.remove('hidden');
                    document.body.style.background = "#222222 url('./assets/img/hexagon.svg') center 10em no-repeat";
                }
            });

            socket.on('newUserStart', (data) => {
                pc.push(data.sender);
                init(false, data.sender);
            });


            socket.on('ice candidates', async (data) => {
                data.candidate ? await pc[data.sender].addIceCandidate(new RTCIceCandidate(data.candidate)) : '';
            });


            socket.on('sdp', async (data) => {
                if (data.description.type === 'offer') {
                    data.description ? await pc[data.sender].setRemoteDescription(new RTCSessionDescription(data.description)) : '';

                    h.getUserFullMedia().then(async (stream) => {
                        if (!document.getElementById('local').srcObject) {
                            h.setLocalStream(stream);
                        }

                        //save my stream
                        myStream = stream;

                        stream.getTracks().forEach((track) => {
                            pc[data.sender].addTrack(track, stream);
                        });

                        let answer = await pc[data.sender].createAnswer();

                        await pc[data.sender].setLocalDescription(answer);

                        socket.emit('sdp', { description: pc[data.sender].localDescription, to: data.sender, sender: socketId });
                    }).catch((e) => {
                        console.error(e);
                    });
                }

                else if (data.description.type === 'answer') {
                    await pc[data.sender].setRemoteDescription(new RTCSessionDescription(data.description));
                }
            });


            socket.on('chat', (data) => {
                h.addChat(data, 'remote');
            });

            socket.on('user-left', (data) => {
                // Verificar se ainda há outros usuários na sala
                const remoteVideos = document.getElementsByClassName('remote-video');
                if (remoteVideos.length === 0) {
                    emptyRoomMessage.classList.remove('hidden');
                    document.body.style.background = "#222222 url('./assets/img/hexagon.svg') center 10em no-repeat";
                }
                // Fechar a conexão peer
                if (pc[data.socketId]) {
                    pc[data.socketId].close();
                    delete pc[data.socketId];
                }
                // Remover o elemento de vídeo
                h.closeVideo(data.socketId);
            });

        });


        function getAndSetUserStream() {
            h.getUserFullMedia().then((stream) => {
                //save my stream
                myStream = stream;

                h.setLocalStream(stream);
            }).catch((e) => {
                console.error(`stream error: ${e}`);
            });
        }


        function sendMsg(msg) {
    let data = {
        room: room,
        msg: msg,
        sender: username
    };

    //emit chat message
    socket.emit('chat', data);

    //add localchat
    h.addChat(data, 'local');
}


        function init(createOffer, partnerName) {
            pc[partnerName] = new RTCPeerConnection(h.getIceServer());


            if (screen && screen.getTracks().length) {
                screen.getTracks().forEach((track) => {
                    pc[partnerName].addTrack(track, screen);//should trigger negotiationneeded event
                });
            }

            else if (myStream) {
                myStream.getTracks().forEach((track) => {
                    pc[partnerName].addTrack(track, myStream);//should trigger negotiationneeded event
                });
            }

            else {
                h.getUserFullMedia().then((stream) => {
                    //save my stream
                    myStream = stream;

                    stream.getTracks().forEach((track) => {
                        pc[partnerName].addTrack(track, stream);//should trigger negotiationneeded event
                    });

                    h.setLocalStream(stream);
                }).catch((e) => {
                    console.error(`stream error: ${e}`);
                });
            }



            //create offer
            if (createOffer) {
                pc[partnerName].onnegotiationneeded = async () => {
                    let offer = await pc[partnerName].createOffer();

                    await pc[partnerName].setLocalDescription(offer);

                    socket.emit('sdp', { description: pc[partnerName].localDescription, to: partnerName, sender: socketId });
                };
            }



            //send ice candidate to partnerNames
            pc[partnerName].onicecandidate = ({ candidate }) => {
                socket.emit('ice candidates', { candidate: candidate, to: partnerName, sender: socketId });
            };


            //add
            pc[partnerName].ontrack = (e) => {
                let str = e.streams[0];
                if (document.getElementById(`${partnerName}-video`)) {
                    document.getElementById(`${partnerName}-video`).srcObject = str;
                } else {
                    let cardDiv = document.createElement('div');
                    cardDiv.className = 'card-sm';
                    cardDiv.id = partnerName;
                    
                    let newVid = document.createElement('video');
                    newVid.id = `${partnerName}-video`;
                    newVid.srcObject = str;
                    newVid.autoplay = true;
                    newVid.playsInline = true;
                    newVid.className = 'remote-video';
                    
                    let controlDiv = document.createElement('div');
                    controlDiv.className = 'remote-video-controls';
                    controlDiv.innerHTML = `
                        <button class="btn-fullscreen" data-video="${partnerName}-video">
                            <i class="fa fa-expand"></i>
                        </button>
                        <button class="btn-mute" data-video="${partnerName}-video">
                            <i class="fa fa-microphone"></i>
                        </button>
                        <button class="btn-toggle-video" data-video="${partnerName}-video">
                            <i class="fa fa-video"></i>
                        </button>
                    `;
                    
                    cardDiv.appendChild(newVid);
                    cardDiv.appendChild(controlDiv);
                    document.getElementById('videos').appendChild(cardDiv);
                }
            };

                        // rtc.js dentro da função init()
            pc[partnerName].oniceconnectionstatechange = () => {
                let state = pc[partnerName].iceConnectionState;
                if (state === 'disconnected' || state === 'failed' || state === 'closed') {
                    // Fechar a conexão peer e remover o vídeo
                    pc[partnerName].close();
                    delete pc[partnerName];
                    h.closeVideo(partnerName);
                }
            };



            pc[partnerName].onconnectionstatechange = (d) => {
                switch (pc[partnerName].iceConnectionState) {
                    case 'connected':
                        h.shareFile(null, pc[partnerName])
                    case 'disconnected':
                        break
                    case 'failed':
                        //h.closeVideo(partnerName);
                        window.location.reload(false);
                        break;
                    case 'closed':
                        h.closeVideo(partnerName);
                        break;
                }
            };



            pc[partnerName].onsignalingstatechange = (d) => {

                console.log(pc[partnerName].signalingState);
                // Essa função não retorna mais esse valor desde 2016
                // switch (pc[partnerName].signalingState) {
                //     case 'closed':
                //         console.log("Signalling state is 'closed'");
                //         h.closeVideo(partnerName);
                //         break;
                // }
            };


            //TransferFile Zanoni
            pc[partnerName].ondatachannel = (event) => {
                const { channel } = event;
                channel.binaryType = 'arraybuffer';

                const receivedBuffers = [];
                channel.onmessage = async (event) => {
                    const { data } = event;
                    try {
                        if (data == 'FLAG') {
                            channel.close();
                            return
                        }
                        if (data !== 'EOF') {
                            receivedBuffers.push(data);
                            console.log(data)
                        } else {
                            const arrayBuffer = receivedBuffers.reduce((acc, arrayBuffer) => {
                                const tmp = new Uint8Array(acc.byteLength + arrayBuffer.byteLength);
                                tmp.set(new Uint8Array(acc), 0);
                                tmp.set(new Uint8Array(arrayBuffer), acc.byteLength);
                                return tmp;
                            }, new Uint8Array());
                            const blob = new Blob([arrayBuffer]);
                            h.downloadFile(blob, channel.label);
                            channel.close();
                        }
                    } catch (err) {
                        console.log('File transfer failed');
                    }
                };
            };


            document.querySelector('#docAnexo').addEventListener('change', () => {
                h.shareFile(document.querySelector('#docAnexo').files[0], pc[partnerName]);
            });



        };



        function shareScreen() {
            h.shareScreen().then((stream) => {
                h.toggleShareIcons(true);

                //disable the video toggle btns while sharing screen. This is to ensure clicking on the btn does not interfere with the screen sharing
                //It will be enabled was user stopped sharing screen
                h.toggleVideoBtnDisabled(true);

                //save my screen stream
                screen = stream;

                //share the new stream with all partners
                broadcastNewTracks(stream, 'video', false);

                //When the stop sharing button shown by the browser is clicked
                screen.getVideoTracks()[0].addEventListener('ended', () => {
                    stopSharingScreen();
                });
            }).catch((e) => {
                console.error(e);
            });
        }



        function stopSharingScreen() {
            //enable video toggle btn
            h.toggleVideoBtnDisabled(false);

            return new Promise((res, rej) => {
                screen.getTracks().length ? screen.getTracks().forEach(track => track.stop()) : '';

                res();
            }).then(() => {
                h.toggleShareIcons(false);
                broadcastNewTracks(myStream, 'video');
            }).catch((e) => {
                console.error(e);
            });
        }



        function broadcastNewTracks(stream, type, mirrorMode = true) {
            h.setLocalStream(stream, mirrorMode);

            let track = type == 'audio' ? stream.getAudioTracks()[0] : stream.getVideoTracks()[0];

            for (let p in pc) {
                let pName = pc[p];

                if (typeof pc[pName] == 'object') {
                    h.replaceTrack(track, pc[pName]);
                }
            }
        }


        function toggleRecordingIcons(isRecording) {
            let e = document.getElementById('record');

            if (isRecording) {
                e.setAttribute('title', 'Stop recording');
                e.children[0].classList.add('text-danger');
                e.children[0].classList.remove('text-white');
            }

            else {
                e.setAttribute('title', 'Record');
                e.children[0].classList.add('text-white');
                e.children[0].classList.remove('text-danger');
            }
        }


        function startRecording(stream) {
            mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'video/webm;codecs=vp9'
            });

            mediaRecorder.start(1000);
            toggleRecordingIcons(true);

            mediaRecorder.ondataavailable = function (e) {
                recordedStream.push(e.data);
            };

            mediaRecorder.onstop = function () {
                toggleRecordingIcons(false);

                h.saveRecordedStream(recordedStream, username);

                setTimeout(() => {
                    recordedStream = [];
                }, 3000);
            };

            mediaRecorder.onerror = function (e) {
                console.error(e);
            };
        }



        //Chat textarea
        document.getElementById('chat-input').addEventListener('keypress', (e) => {
            if (e.which === 13 && (e.target.value.trim())) {
                e.preventDefault();

                sendMsg(e.target.value);

                setTimeout(() => {
                    e.target.value = '';
                }, 50);
            }
        });


        //When the video icon is clicked
        document.getElementById('toggle-video').addEventListener('click', (e) => {
            e.preventDefault();

            let elem = document.getElementById('toggle-video');

            if (myStream.getVideoTracks()[0].enabled) {
                elem.classList.remove('off');
                elem.classList.add('on');
                elem.setAttribute('title', 'Show Video');

                myStream.getVideoTracks()[0].enabled = false;
            }

            else {
                elem.classList.remove('on');
                elem.classList.add('off');
                elem.setAttribute('title', 'Hide Video');

                myStream.getVideoTracks()[0].enabled = true;
            }

            broadcastNewTracks(myStream, 'video');
        });


        //When the mute icon is clicked
        document.getElementById('toggle-mute').addEventListener('click', (e) => {
            e.preventDefault();

            let elem = document.getElementById('toggle-mute');

            if (myStream.getAudioTracks()[0].enabled) {
                elem.classList.remove('off');
                elem.classList.add('on')
                elem.setAttribute('title', 'Unmute');

                myStream.getAudioTracks()[0].enabled = false;
            }

            else {
                elem.classList.remove('on');
                elem.classList.add('off')
                elem.setAttribute('title', 'Mute');

                myStream.getAudioTracks()[0].enabled = true;
            }

            broadcastNewTracks(myStream, 'audio');
        });


        //When user clicks the 'Share screen' button
        document.getElementById('share-screen').addEventListener('click', (e) => {
            e.preventDefault();

            if (screen && screen.getVideoTracks().length && screen.getVideoTracks()[0].readyState != 'ended') {
                stopSharingScreen();
            }

            else {
                shareScreen();
            }
        });


        //When record button is clicked
        document.getElementById('record').addEventListener('click', (e) => {
            /**
             * Ask user what they want to record.
             * Get the stream based on selection and start recording
             */
            if (!mediaRecorder || mediaRecorder.state == 'inactive') {
                h.toggleModal('recording-options-modal', true);
            }

            else if (mediaRecorder.state == 'paused') {
                mediaRecorder.resume();
            }

            else if (mediaRecorder.state == 'recording') {
                mediaRecorder.stop();
            }
        });

        


        //When user choose to record screen
        document.getElementById('record-screen').addEventListener('click', () => {
            h.toggleModal('recording-options-modal', false);            socket.on('new user', (data) => {
                // Quando um novo usuário entra, escondemos a mensagem
                document.getElementById('empty-room-message').classList.add('hidden');
                document.body.style.background = "#222222";
                
                socket.emit('newUserStart', { to: data.socketId, sender: socketId });
                pc.push(data.socketId);
                init(true, data.socketId);
            });
            
            // Também precisamos verificar quando entramos em uma sala que já tem pessoas
            socket.on('connect', () => {
                socketId = socket.io.engine.id;
                
                // Verificar se já existem vídeos remotos na sala
                const remoteVideos = document.getElementsByClassName('remote-video');
                if (remoteVideos.length === 0) {
                    // Se não houver vídeos remotos, mostra a mensagem
                    document.getElementById('empty-room-message').classList.remove('hidden');
                    document.body.style.background = "#222222 url('./assets/img/hexagon.svg') center 10em no-repeat";
                } else {
                    // Se já houver vídeos remotos, esconde a mensagem
                    document.getElementById('empty-room-message').classList.add('hidden');
                    document.body.style.background = "#222222";
                }
            });

            if (screen && screen.getVideoTracks().length) {
                startRecording(screen);
            }

            else {
                h.shareScreen().then((screenStream) => {
                    startRecording(screenStream);
                }).catch(() => { });
            }
        });


        //When user choose to record own video
        document.getElementById('record-video').addEventListener('click', () => {
            h.toggleModal('recording-options-modal', false);

            if (myStream && myStream.getTracks().length) {
                startRecording(myStream);
            }

            else {
                h.getUserFullMedia().then((videoStream) => {
                    startRecording(videoStream);
                }).catch(() => { });
            }
        });
        
    }
    // Inicia a verificação do estado da sala
    startRoomStateCheck();
});
