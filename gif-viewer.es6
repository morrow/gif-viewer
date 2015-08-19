class GifViewer {

  constructor () {
    this.dom = {
      url:              document.getElementById('url'),
      canvas:           document.getElementById('canvas'),
      progress:         document.getElementById('progress'),
      playback_rate:    document.getElementById('playback_rate'),
      video:            document.getElementById('video'),
      play_pause:       document.getElementById('play_pause'),
      draw_cursor:      document.getElementById('draw_cursor'),
      load_gif:         document.getElementById('load_gif'),
      loop:             document.getElementById('loop'),
      save:             document.getElementById('save'),
      overlay:          document.getElementById('overlay')
    }
    this.ctx = this.dom.canvas.getContext('2d');
    this.initialize();
    this.listen();
    // load if url is specified in anchor
    if(window.location.hash.length > 1){
      let url = window.location.hash.slice(1);
      if(url.match(/http/i)){
        this.dom.url.value = `http${window.location.hash.split('http')[1]}`;
        window.
        this.loadGif();
      }
    }
  }

  initialize() {
    this.frames = [];
    this.images = [];
    this.frame_index = 0;
    this.playback_rate = 1;
  }

  // listen for events
  listen () {
    //keyboard inputs
    document.body.onkeypress = (e)=> {
      console.log(e.keyCode);
      if(e.keyCode.toString().match(/32|106|107/)){
        e.preventDefault();
      }
      switch(e.keyCode){
        case 32: this.playPause(); break;
        case 106: this.nextFrame(); break;
        case 107: this.prevFrame(); break;
        case 99: this.dom.draw_cursor.checked ? this.dom.draw_cursor.removeAttribute('checked') : this.dom.draw_cursor.setAttribute('checked', 'checked'); break;
        break;
      }
    }
    // load gif on url change
    this.dom.load_gif.onsubmit = (e)=> {
      e.preventDefault();
      this.loadGif();
    }
    // play/pause toggle clicked
    this.dom.play_pause.onclick = () => {
      this.playPause();
    }
    // save on save button click
    this.dom.save.onclick = () => {
      this.pause();
      let data_url = this.dom.canvas.toDataURL('image/png');
      window.open(data_url);
    }
    // update this.dom.canvas on progress input change
    this.dom.progress.oninput = () => {
      this.pause();
      this.drawFrame(this.dom.progress.value);
    }
    // update playback rate on playback_rate input change
    this.dom.playback_rate.oninput = () => {
      this.playback_rate = this.dom.playback_rate.value;
      if(this.status == 'playing'){
        this.pause();
        this.play();
      }
    }
    // move cursor when hovering over this.dom.canvas
    this.dom.canvas.onmousemove = (e) => {
      this.x = e.clientX - this.dom.canvas.offsetLeft;
      this.y = e.clientY - this.dom.canvas.offsetTop;
      this.drawFrame();
    }
    // play/pause on this.dom.canvas click
    this.dom.canvas.onclick = () => {
      if(this.status != 'loading'){
        this.playPause();
      }
    }
    // draw cursor when this.dom.canvas is hovered
    this.dom.canvas.onmouseenter = () => {
      this.draw_cursor = true;
    }
    // remove cursor when this.dom.canvas is not hovered
    this.dom.canvas.onmouseout = () => {
      this.draw_cursor = false;
      this.drawFrame();
    }
  }

  // load gif
  loadGif(){
    let src = this.dom.url.value;
    if(src.match(/imgur/i)){
      src = src.replace(/gif$|gifv$/, 'webm')
    }
    if(src.match(/gfycat/i)){
      if(!src.match(/zippy/i)){
        src = src.replace(/gfycat/i, 'zippy.gfycat')
        src = src.replace(/\.webm$/i, '')
        src += '.webm'
      }
      src = `http://crossorigin.me/${src}`
    }
    src = src.replace('#', '');
    this.changeStatus('loading');
    this.dom.video.style.display = 'block';
    this.dom.canvas.style.display = 'none';
    this.dom.overlay.style.display = 'block';
    let xhr = new XMLHttpRequest();
    xhr.responseType = 'blob';
    xhr.crossOrigin = 'Anonymous'
    xhr.open('GET', src, true);
    xhr.onload = (e) => {
      console.log(e);
      if (xhr.status == 200) {
        this.dom.video.src = URL.createObjectURL(xhr.response);
        for(var element in this.dom){
          this.dom[element].setAttribute('disabled', 'disabled');
        }
        this.generateFrames();
      } else {
        console.log(xhr.status);
      }
    }
    xhr.onerror = function(e){
      console.log(e);
    }
    xhr.send();
  }

  changeStatus (status) {
    this.status = status;
    document.body.className = status;
  }

  // play or pause depending on status
  playPause () {
    if(this.status == 'playing'){
      this.pause();
    }
    else if(this.status == 'paused'){
      this.play();
    }
  }

  // pause gif
  pause () {
    this.changeStatus('paused');
    window.clearInterval(window.play_interval);
    this.dom.play_pause.innerHTML = 'play';
  }

  // play gif
  play () {
    this.changeStatus('playing');
    this.dom.play_pause.innerHTML = 'pause';
    if(this.dom.progress.value == this.dom.progress.max){
      this.dom.progress.value = 0;
    }
    window.clearInterval(window.play_interval);
    window.play_interval = window.setInterval( ()=> {
      this.drawFrame(this.dom.progress.value);
      this.dom.progress.value++;
      if(this.dom.progress.value == this.dom.progress.max){
        if(this.dom.loop.checked){
          this.dom.progress.value = 0;
        } else {
          this.pause();
        }
      }
    }, (60 / this.playback_rate) );
  }

  // next frame
  nextFrame () {
    this.pause();
    this.frame_index++;
    if(this.frame_index == this.images.length){
      this.frame_index = 0;
    }
    this.drawFrame();
  }

  prevFrame () {
    this.pause();
    this.frame_index--;
    if(this.frame_index < 0){
      this.frame_index = this.images.length;
    }
    this.drawFrame();
  }

  // draw cursor
  drawCursor () {
    if(this.dom.draw_cursor.checked){
      this.ctx.fillStyle = 'rgba(0,0,0,0.5)';
      this.ctx.fillRect(this.x - 1, 0, 1, this.dom.canvas.height);
      this.ctx.fillRect(0, this.y - 1, this.dom.canvas.width, 1);
    }
  }

  // draw frame
  drawFrame (i = this.frame_index) {
    if(this.status != 'loading'){
      this.ctx.clearRect(0, 0, this.dom.canvas.width, this.dom.canvas.height);
      let image = this.images[i]
      this.ctx.drawImage(image, 0, 0, this.dom.canvas.width, this.dom.canvas.height);
      this.frame_index = i;
      if(this.draw_cursor){
        this.drawCursor();
      }
    }
  }

  // get individual frame from this.dom.video
  generateFrame (final_frame) {
    let video = this.dom.video;
    this.ctx.drawImage(video, 0, 0, this.dom.canvas.width, this.dom.canvas.height);
    let data_url = this.dom.canvas.toDataURL('image/png');
    if(this.frames.length < 1 || this.frames.indexOf(data_url) < 0){
      this.frames.push(data_url);
    }
    if(final_frame){
      window.clearInterval(window.frame_interval);
      this.dom.video.pause();
      this.dom.video.currentTime = 0;
      this.generateImages();
    }
    else if(this.dom.video.currentTime / this.dom.video.duration > 0.99){
      window.clearInterval(window.frame_interval);
      window.setTimeout(()=>this.generateFrame(true), 10);
    }
  }

  // generate frames from this.dom.video
  generateFrames () {
    this.dom.video.pause();
    this.dom.video.currentTime = 0;
    this.dom.video.playbackRate = 2;
    this.dom.video.oncanplaythrough = () => {
      this.dom.canvas.width = this.dom.video.offsetWidth;
      this.dom.canvas.height = this.dom.video.offsetHeight;
      this.dom.progress.style.width = `${this.dom.canvas.width}px`;
      this.dom.canvas.style.display = 'block';
      this.dom.video.style.display = 'none';
      window.frame_interval = window.setInterval( ()=> this.generateFrame(), 30);
      this.dom.video.play();
      this.dom.video.oncanplaythrough = null;
    }
  }

  // generate images from frames
  generateImages () {
    for(let i in this.frames){
      let image = new Image();
      image.src = this.frames[i];
      this.images.push(image);
    }
    this.dom.progress.max = this.images.length - 1;
    for(let element in this.dom){
      this.dom[element].removeAttribute('disabled');
    }
    this.dom.overlay.style.display = 'none';
    this.pause();
    this.drawFrame(0);
    this.play();
  }

}
