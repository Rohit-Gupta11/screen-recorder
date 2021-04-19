const { desktopCapturer, remote } = require('electron');
const { witeFile } = require('fs');
const { dialog, Menu } = remote;

// global variables
let mediaRecorder;
const recordedChunks = [];
const videoElement = document.querySelector('video');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const videoSelectBtn = document.getElementById('videoSelectBtn');

startBtn.onclick = (e) => {
    mediaRecorder.start();
    startBtn.classList.add('is-danger');
    startBtn.innerText = 'Recording';
}

stopBtn.onclick = (e) => {
    mediaRecorder.stop();
    startBtn.classList.remove('is-warning');
    startBtn.innerText = 'Start';
}

videoSelectBtn.onclick = async (e) => {
    const inputSources = await desktopCapturer.getSources({
        types: ['window', 'screen']
    });
    const videoOptionMenu = Menu.buildFromTemplate(
        inputSources.map(source => {
            return {
                label: source.name,
                click: () => selectSource(source)
            }
        })
    )
    videoOptionMenu.popup()
}

async function selectSource(source) {

    videoSelectBtn.innerText = source.name;
  
    const constraints = {
      audio: false,
      video: {
        mandatory: {
          chromeMediaSource: 'desktop',
          chromeMediaSourceId: source.id
        }
      }
    };

    // create a stream
    const stream = await navigator.mediaDevices.getUserMedia(constraints)

    videoElement.srcObject = stream;

    videoElement.play();

    // create a mediaRecorder

    const options = {
        mimeType: 'video/webm;codecs=vp9'
    }

    mediaRecorder = new MediaRecorder(stream, options);

    // register the event handlers

    mediaRecorder.ondataavailable = handleDataAvailable;

    mediaRecorder.onstop = handleStop;
}  

// Captures all recorded chunks
function handleDataAvailable(e) {
    console.log('video data available');
    recordedChunks.push(e.data);
}

async function handleStop(e){
    const blob = new Blob(recordedChunks, {
        type: 'video/webm;codecs=vp9'
    })

    const buffer = Buffer.from(await blob.arrayBuffer())

    const {filePath} = await dialog.showSaveDialog({
        buttonLabel:'Save Video',
        defaultPath: `vid-${Date.now()}.webm`
    })

    // write to file

    if (filePath){
        writeFile(filePath, buffer, () => {
            console.log("File saved successfully")
        })
    }
}