import helpers from './helpers.js';

window.addEventListener('load', () => {
    //When the chat icon is clicked
    document.querySelector('#toggle-chat-pane').addEventListener('click', (e) => {
        let chatElem = document.querySelector('#chat-pane');
        let mainSecElem = document.querySelector('#main-section');

        if (chatElem.classList.contains('chat-opened')) {
            chatElem.setAttribute('hidden', true);
            mainSecElem.classList.remove('col-md-9');
            mainSecElem.classList.add('col-md-12');
            chatElem.classList.remove('chat-opened');
        }

        else {
            chatElem.attributes.removeNamedItem('hidden');
            mainSecElem.classList.remove('col-md-12');
            mainSecElem.classList.add('col-md-9');
            chatElem.classList.add('chat-opened');
        }

        //remove the 'New' badge on chat icon (if any) once chat is opened.
        setTimeout(() => {
            if (document.querySelector('#chat-pane').classList.contains('chat-opened')) {
                helpers.toggleChatNotificationBadge();
            }
        }, 300);
    });


    //When the video frame is clicked. This will enable picture-in-picture
    document.getElementById('local').addEventListener('click', () => {
        if (!document.pictureInPictureElement) {
            document.getElementById('local').requestPictureInPicture()
                .catch(error => {
                    // Video failed to enter Picture-in-Picture mode.
                    console.error(error);
                });
        }

        else {
            document.exitPictureInPicture()
                .catch(error => {
                    // Video failed to leave Picture-in-Picture mode.
                    console.error(error);
                });
        }
    });


    //When the 'Create room" is button is clicked
    document.getElementById('create-room').addEventListener('click', (e) => {
        e.preventDefault();

        //let roomName = document.querySelector('#room-name').value;
        let roomName = 'nomeMed'
        let yourName = document.querySelector('#your-name').value;

        if (roomName && yourName) {
            //remove error message, if any
            document.querySelector('#err-msg').innerHTML = "";

            //save the user's name in sessionStorage
            sessionStorage.setItem('username', yourName);


            //create room link
            let roomLink = `${location.origin}?room=${roomName.trim().replace(' ', '_')}_${helpers.generateRandomString()}`;

            //show message with link to room
            //document.querySelector( '#room-created' ).innerHTML = `Sala criada com sucesso. Aperte <a href='${ roomLink }'>aqui</a> para entrar na consulta.`;
            window.location.href = roomLink;

            //empty the values
            document.querySelector('#room-name').value = '';
            document.querySelector('#your-name').value = '';
        }

        else {
            document.querySelector('#err-msg').innerHTML = "Todos campos são necessários";
        }
    });


    //When the 'Enter room' button is clicked.
    document.getElementById('enter-room').addEventListener('click', (e) => {
        e.preventDefault();

        let name = document.querySelector('#username').value;

        if (name) {
            //remove error message, if any
            document.querySelector('#err-msg-username').innerHTML = "";

            //save the user's name in sessionStorage
            sessionStorage.setItem('username', name);

            //reload room
            location.reload();
        }

        else {
            document.querySelector('#err-msg-username').innerHTML = "Please input your name";
        }
    });


    document.addEventListener('click', (e) => {
        if (e.target && e.target.classList.contains('expand-remote-video')) {
            helpers.maximiseStream(e);
        }

        else if (e.target && e.target.classList.contains('mute-remote-mic')) {
            helpers.singleStreamToggleMute(e);
        }
    });


    document.getElementById('closeModal').addEventListener('click', () => {
        helpers.toggleModal('recording-options-modal', false);
    });



    //Change link for party and change icon
    document.querySelectorAll('.dropdown-item').forEach(el => el.addEventListener('click', () => {
        let statusEl = document.getElementById('status-atual');
        statusEl.removeAttribute('class');
        statusEl.setAttribute('class', el.childNodes[0].classList.value); //el.classList.value
    }))

    // Eventos para os botões dos vídeos remotos
document.addEventListener('click', (e) => {
    if (e.target && e.target.classList.contains('btn-fullscreen')) {
        const videoId = e.target.dataset.video;
        const video = document.getElementById(videoId);
        if (video) {
            if (!document.fullscreenElement) {
                if (video.requestFullscreen) {
                    video.requestFullscreen();
                } else if (video.webkitRequestFullscreen) {
                    video.webkitRequestFullscreen();
                }
            } else {
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                } else if (document.webkitExitFullscreen) {
                    document.webkitExitFullscreen();
                }
            }
        }
    } else if (e.target && e.target.classList.contains('btn-mute')) {
        const videoId = e.target.dataset.video;
        const video = document.getElementById(videoId);
        if (video && video.srcObject) {
            const audioTrack = video.srcObject.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                e.target.textContent = audioTrack.enabled ? 'Mutar' : 'Desmutar';
                e.target.classList.toggle('muted');
            }
        }
    } else if (e.target && e.target.classList.contains('btn-mute')) {
        const videoId = e.target.dataset.video;
        const video = document.getElementById(videoId);
        if (video) {
            video.muted = !video.muted;
            e.target.textContent = video.muted ? 'Desmutar' : 'Mutar';
        }
    } else if (e.target && e.target.classList.contains('btn-toggle-video')) {
        const videoId = e.target.dataset.video;
        const video = document.getElementById(videoId);
        if (video) {
            const stream = video.srcObject;
            const videoTrack = stream.getVideoTracks()[0];
            videoTrack.enabled = !videoTrack.enabled;
            e.target.textContent = videoTrack.enabled ? 'Desligar Vídeo' : 'Ligar Vídeo';
        }
    }
});

document.addEventListener('fullscreenchange', function() {
    const fullscreenButtons = document.querySelectorAll('.btn-fullscreen');
    fullscreenButtons.forEach(button => {
        button.className = document.fullscreenElement ? 'Sair da Tela Cheia' : 'fa fa-expand';
    });
});

document.addEventListener('webkitfullscreenchange', function() {
    const fullscreenButtons = document.querySelectorAll('.btn-fullscreen');
    fullscreenButtons.forEach(button => {
        button.textContent = document.webkitFullscreenElement ? 'Sair da Tela Cheia' : 'Tela Cheia';
    });
});
    
});

