window.onload = function () {
    var play = document.getElementById('playButton');
    var audio = new AudioContext();
    //create an AudioContext before do anything else, as everything happens inside a context - decoding,processing audio

    var bufferSource = audio.createBufferSource();
    //create  AudioBufferSourceNode object - play and manipulate audio data

    var scriptProc = audio.createScriptProcessor(4096, 1, 1);
    //create ScriptProcessorNode object - processing audio data JS
    //first arg buffer size - how many sample-frames need to be processed each call

    var analayser = audio.createAnalyser();
    //время и частота воспроизвидения звука - use for visualizing sound

    function getAudioData () {
        var request = new XMLHttpRequest();//http request to server without refresh
        request.open("GET", "timati.mp3", true);//request configs
        request.responseType = "arraybuffer";
        request.onload = function () {
            var audioData = request.response;
            audio.decodeAudioData(audioData, function (){

            })
        };
        request.send();
    }
    //getAudioData ();
    
}