class GifViewer {

  constructor () {
    this.dom = {
      url:              document.getElementById('url'),
      canvas:           document.getElementById('canvas'),
      fp_canvas:        document.getElementById('frame_progress_canvas'),
      ip_canvas:        document.getElementById('image_progress_canvas'),
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
    this.overlay_html = this.dom.overlay.innerHTML;
    this.ctx = this.dom.canvas.getContext('2d');
    this.fp_ctx = this.dom.fp_canvas.getContext('2d');
    this.ip_ctx = this.dom.ip_canvas.getContext('2d');
    this.fp_ctx.fillStyle = '#fff';
    this.ip_ctx.fillStyle = '#fff';
    this.initialize();
    this.listen();
  }

  // initialize class variables, load gif if location.hash contains url
  initialize() {
    this.frames = [];
    this.frame_index = 0;
    this.playback_rate = 1;
    // load if url is specified in anchor
    if(window.location.hash.length > 1){
      this.dom.url.value = window.location.hash.split('#/')[1];
      this.loadGif();
    }
  }

  // listen for events
  listen () {
    //respond to keyboard controls
    document.body.onkeydown = (e)=> {
      if(e.keyCode.toString().match(/32/)){
        e.preventDefault();
      }
      switch(e.keyCode){
        case 32: this.playPause(); break;
        case 74: this.nextFrame(); break;
        case 75: this.prevFrame(); break;
        case 76: this.dom.loop.checked = !this.dom.loop.checked; break;
        case 67: this.dom.draw_cursor.checked = !this.dom.draw_cursor.checked; break;
        break;
      }
    }
    // load gif on url change
    this.dom.load_gif.onsubmit = (e)=> {
      e.preventDefault();
      window.location.hash = `/${this.dom.url.value}`
      window.location.reload();
    }
    // play/pause when play_pause button clicked
    this.dom.play_pause.onclick = () => {
      this.playPause();
    }
    // save on save button click
    this.dom.save.onclick = () => {
      this.pause();
      let data_url = this.dom.canvas.toDataURL('image/png');
      window.open(data_url);
    }
    // update canvas on progress input change
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
    // move cursor when hovering over canvas if enabled
    this.dom.canvas.onmousemove = (e) => {
      this.x = e.clientX - this.dom.canvas.offsetLeft + window.scrollX;
      this.y = e.clientY - this.dom.canvas.offsetTop + window.scrollY;
      this.drawFrame();
    }
    // play/pause on canvas click
    this.dom.canvas.onclick = () => {
      if(this.status != 'loading'){
        this.playPause();
      }
    }
    // draw cursor when canvas is hovered
    this.dom.canvas.onmouseenter = () => {
      this.draw_cursor = true;
    }
    // remove cursor when canvas is not hovered
    this.dom.canvas.onmouseout = () => {
      this.draw_cursor = false;
      this.drawFrame();
    }
  }

  // load gif
  loadGif(src = this.dom.url.value){
    if(!src.match(/http/)){
      src = `http://${src}`
    }
    // remove hash from src
    src = src.replace('#', '');
    // handle imgur links
    if(src.match(/imgur/i)){
      if(!src.match('i.imgur')){
        src = src.replace('imgur', 'i.imgur');
      }
      src = src.replace(/\.gif$|\.gifv$/, '');
      src += '.webm';
    }
    // handle gfycat links
    if(src.match(/gfycat/i)){
      if(!src.match(/\.gfycat/)){
        let api_link = `http://gfycat.com/cajax/get/${src.split('gfycat.com/')[1].split('.')[0]}`
        let xhr = new XMLHttpRequest();
        xhr.crossOrigin = 'Anonymous';
        xhr.open('GET', api_link, true);
        xhr.onload = (e) => {
          if(xhr.status == 200) {
            window.location.hash = '/' + (JSON.parse(xhr.response).gfyItem.webmUrl);
            this.initialize();
          }
        }
        xhr.send();
        return false
      }
      src = `http://crossorigin.me/${src}`
    }
    this.dom.video.onloadedmetadata = () => {
      this.dom.video.width = this.dom.video.videoWidth;
      this.dom.video.height = this.dom.video.videoHeight;
      this.dom.canvas.width = this.dom.video.videoWidth;
      this.dom.canvas.height = this.dom.video.videoHeight;
      this.dom.progress.style.width = `${this.dom.canvas.width}px`;
    };
    this.video_src = src;
    // asynchronously load video (experimental feature, trying to load entire video before playing)
    this.changeStatus('loading');
    let xhr = new XMLHttpRequest();
    xhr.open('GET', src, true);
    xhr.responseType = 'blob';
    xhr.crossOrigin = 'Anonymous'
    xhr.contentType = 'video/webm';
    xhr.onload = (e) => {
      if (xhr.status == 200) {
        if(xhr.getResponseHeader('content-type').match('video')){
          this.dom.video.src = URL.createObjectURL(xhr.response);
          for(var element in this.dom){
            this.dom[element].setAttribute('disabled', 'disabled');
          }
          window.setTimeout( ()=> this.generateFrames(), 100)
        }
        else {
          this.dom.video.oncanplaythrough = ()=> this.generateFrames();
          this.dom.video.src = this.video_src;
        }
      }
    }
    xhr.onerror = (e)=> {
      this.dom.overlay.innerHTML = `Error loading GIF.`;
      window.setTimeout( ()=> {
        this.changeStatus('ready');
        this.dom.overlay.innerHTML = this.overlay_html;
      }, 2000);
    }
    xhr.send();
  }

  // change status
  changeStatus (status) {
    this.status = status;
    document.body.className = status;
  }

  // play or pause
  playPause () {
    if(this.status == 'playing'){
      this.pause();
    }
    else if(this.status.match(/paused|ready/)){
      this.play();
    }
  }

  // pause gif
  pause () {
    this.changeStatus('paused');
    window.clearInterval(window.play_interval);
    this.dom.play_pause.innerHTML = '▶';
  }

  // play gif
  play () {
    this.changeStatus('playing');
    this.dom.play_pause.innerHTML = '▌▌';
    // if gif is at end position and play() is triggered, start at beginning
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
    }, (1000 / this.playback_rate) / (this.frames.length / this.dom.video.duration));
  }

  // next frame
  nextFrame () {
    this.pause();
    this.frame_index++;
    if(this.frame_index == this.frames.length){
      this.frame_index = 0;
    }
    this.drawFrame();
  }

  prevFrame () {
    this.pause();
    this.frame_index--;
    if(this.frame_index < 0){
      this.frame_index = this.frames.length;
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
      let image = this.frames[i]
      this.ctx.drawImage(image, 0, 0, this.dom.canvas.width, this.dom.canvas.height);
      this.frame_index = i;
      if(this.draw_cursor){
        this.drawCursor();
      }
    }
  }

  // get individual frame from this.dom.video
  generateFrame () {
    this.ctx.drawImage(this.dom.video, 0, 0, this.dom.canvas.width, this.dom.canvas.height);
    this.fp_ctx.fillRect(0, 0, (this.dom.video.currentTime / this.dom.video.duration) * (this.dom.fp_canvas.width), 30);
    let data_url = this.dom.canvas.toDataURL('image/png');
    if(this.frames.length < 1 || this.frames.indexOf(data_url) < 0){
      this.frames.push(data_url);
    }
  }

  // generate frames from this.dom.video
  generateFrames () {
    this.dom.video.loop = false;
    this.dom.video.pause();
    this.dom.video.currentTime = 0;
    this.dom.video.playbackRate = 2;
    this.dom.video.style.display = 'block';
    this.dom.canvas.style.display = 'none';
    this.dom.canvas.width = this.dom.video.videoWidth;
    this.dom.canvas.height = this.dom.video.videoHeight;
    this.dom.video.style.display = 'none';
    this.dom.canvas.style.display = 'block';
    this.dom.progress.style.width = `${this.dom.canvas.width}px`;
    window.frame_interval = window.setInterval( ()=> this.generateFrame(), 10);
    this.dom.video.play();
    this.dom.video.onended = ()=> {
      window.onblur = null;
      window.clearInterval(window.frame_interval);
      this.dom.video.pause();
      this.dom.video.currentTime = 0;
      this.generateImages();
      this.fp_ctx.fillRect(0, 0, 100 * (this.dom.fp_canvas.width), 30);
      this.dom.video.onended = null;
    };
    this.dom.video.oncanplaythrough = null;
  }

  // generate image from frame
  generateImage () {
    let image = new Image();
    image.src = this.frames[this.frame_index];
    this.frames[this.frame_index] = image;
    this.frame_index++;
    this.ip_ctx.fillRect(0, 0, (this.frame_index / (this.frames.length - 2)) * this.dom.ip_canvas.width, this.dom.ip_canvas.height);
    if(this.frame_index == this.frames.length){
      this.start();
    } else {
      window.setTimeout(()=> this.generateImage(), 1);
    }
  }

  // generate images from frames
  generateImages () {
    this.frames = this.frames.slice(1);
    this.frame_index = 0;
    this.generateImage();
    this.dom.progress.max = this.frames.length - 1;
  }

  start() {
    for(let element in this.dom){
      this.dom[element].removeAttribute('disabled');
    }
    this.pause();
    this.drawFrame(0);
    this.play();
  }

}
