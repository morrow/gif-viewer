'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var GifViewer = (function () {
  function GifViewer() {
    _classCallCheck(this, GifViewer);

    this.dom = {
      url: document.getElementById('url'),
      canvas: document.getElementById('canvas'),
      fp_canvas: document.getElementById('frame_progress_canvas'),
      ip_canvas: document.getElementById('image_progress_canvas'),
      progress: document.getElementById('progress'),
      playback_rate: document.getElementById('playback_rate'),
      video: document.getElementById('video'),
      play_pause: document.getElementById('play_pause'),
      draw_cursor: document.getElementById('draw_cursor'),
      load_gif: document.getElementById('load_gif'),
      loop: document.getElementById('loop'),
      save: document.getElementById('save'),
      overlay: document.getElementById('overlay')
    };
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

  _createClass(GifViewer, [{
    key: 'initialize',
    value: function initialize() {
      this.frames = [];
      this.frame_index = 0;
      this.playback_rate = 1;
      // load if url is specified in anchor
      if (window.location.hash.length > 1) {
        this.dom.url.value = window.location.hash.split('#/')[1];
        this.loadGif();
      }
    }

    // listen for events
  }, {
    key: 'listen',
    value: function listen() {
      var _this = this;

      //respond to keyboard controls
      document.body.onkeypress = function (e) {
        if (e.keyCode.toString().match(/32/)) {
          e.preventDefault();
        }
        switch (e.keyCode) {
          case 32:
            _this.playPause();break;
          case 106:
            _this.nextFrame();break;
          case 107:
            _this.prevFrame();break;
          case 99:
            _this.dom.draw_cursor.checked = !_this.dom.draw_cursor.checked;break;
            break;
        }
      };
      // load gif on url change
      this.dom.load_gif.onsubmit = function (e) {
        e.preventDefault();
        window.location.hash = '/' + _this.dom.url.value;
        window.location.reload();
      };
      // play/pause when play_pause button clicked
      this.dom.play_pause.onclick = function () {
        _this.playPause();
      };
      // save on save button click
      this.dom.save.onclick = function () {
        _this.pause();
        var data_url = _this.dom.canvas.toDataURL('image/png');
        window.open(data_url);
      };
      // update canvas on progress input change
      this.dom.progress.oninput = function () {
        _this.pause();
        _this.drawFrame(_this.dom.progress.value);
      };
      // update playback rate on playback_rate input change
      this.dom.playback_rate.oninput = function () {
        _this.playback_rate = _this.dom.playback_rate.value;
        if (_this.status == 'playing') {
          _this.pause();
          _this.play();
        }
      };
      // move cursor when hovering over canvas if enabled
      this.dom.canvas.onmousemove = function (e) {
        _this.x = e.clientX - _this.dom.canvas.offsetLeft + window.scrollX;
        _this.y = e.clientY - _this.dom.canvas.offsetTop + window.scrollY;
        _this.drawFrame();
      };
      // play/pause on canvas click
      this.dom.canvas.onclick = function () {
        if (_this.status != 'loading') {
          _this.playPause();
        }
      };
      // draw cursor when canvas is hovered
      this.dom.canvas.onmouseenter = function () {
        _this.draw_cursor = true;
      };
      // remove cursor when canvas is not hovered
      this.dom.canvas.onmouseout = function () {
        _this.draw_cursor = false;
        _this.drawFrame();
      };
    }

    // load gif
  }, {
    key: 'loadGif',
    value: function loadGif() {
      var _this2 = this;

      var src = arguments.length <= 0 || arguments[0] === undefined ? this.dom.url.value : arguments[0];

      if (!src.match(/http/)) {
        src = 'http://' + src;
      }
      // remove hash from src
      src = src.replace('#', '');
      // handle imgur links
      if (src.match(/imgur/i)) {
        if (!src.match('i.imgur')) {
          src = src.replace('imgur', 'i.imgur');
        }
        src = src.replace(/\.gif$|\.gifv$/, '');
        src += '.webm';
      }
      // handle gfycat links
      if (src.match(/gfycat/i)) {
        if (!src.match(/\.gfycat/)) {
          var _ret = (function () {
            var api_link = 'http://gfycat.com/cajax/get/' + src.split('gfycat.com/')[1].split('.')[0];
            var xhr = new XMLHttpRequest();
            xhr.crossOrigin = 'Anonymous';
            xhr.open('GET', api_link, true);
            xhr.onload = function (e) {
              if (xhr.status == 200) {
                window.location.hash = '/' + JSON.parse(xhr.response).gfyItem.webmUrl;
                _this2.initialize();
              }
            };
            xhr.send();
            return {
              v: false
            };
          })();

          if (typeof _ret === 'object') return _ret.v;
        }
        src = 'http://crossorigin.me/' + src;
      }
      this.video_src = src;
      // asynchronously load video (experimental feature, trying to load entire video before playing)
      this.changeStatus('loading');
      var xhr = new XMLHttpRequest();
      xhr.open('GET', src, true);
      xhr.responseType = 'blob';
      xhr.crossOrigin = 'Anonymous';
      xhr.contentType = 'video/webm';
      xhr.onload = function (e) {
        if (xhr.status == 200) {
          if (xhr.getResponseHeader('content-type').match('video')) {
            _this2.dom.video.src = URL.createObjectURL(xhr.response);
            for (var element in _this2.dom) {
              _this2.dom[element].setAttribute('disabled', 'disabled');
            }
            window.setTimeout(function () {
              return _this2.generateFrames();
            }, 100);
          } else {
            _this2.dom.video.onloadedmetadata = function () {
              _this2.dom.canvas.width = _this2.dom.video.videoWidth;
              _this2.dom.canvas.height = _this2.dom.video.videoHeight;
            };
            _this2.dom.video.oncanplaythrough = function () {
              return _this2.generateFrames();
            };
            _this2.dom.video.src = _this2.video_src;
          }
        }
      };
      xhr.onerror = function (e) {
        _this2.dom.overlay.innerHTML = 'Error loading GIF.';
        window.setTimeout(function () {
          _this2.changeStatus('ready');
          _this2.dom.overlay.innerHTML = _this2.overlay_html;
        }, 2000);
      };
      xhr.send();
    }

    // change status
  }, {
    key: 'changeStatus',
    value: function changeStatus(status) {
      this.status = status;
      document.body.className = status;
    }

    // play or pause
  }, {
    key: 'playPause',
    value: function playPause() {
      if (this.status == 'playing') {
        this.pause();
      } else if (this.status.match(/paused|ready/)) {
        this.play();
      }
    }

    // pause gif
  }, {
    key: 'pause',
    value: function pause() {
      this.changeStatus('paused');
      window.clearInterval(window.play_interval);
      this.dom.play_pause.innerHTML = '▶';
    }

    // play gif
  }, {
    key: 'play',
    value: function play() {
      var _this3 = this;

      this.changeStatus('playing');
      this.dom.play_pause.innerHTML = '▌▌';
      // if gif is at end position and play() is triggered, start at beginning
      if (this.dom.progress.value == this.dom.progress.max) {
        this.dom.progress.value = 0;
      }
      window.clearInterval(window.play_interval);
      window.play_interval = window.setInterval(function () {
        _this3.drawFrame(_this3.dom.progress.value);
        _this3.dom.progress.value++;
        if (_this3.dom.progress.value == _this3.dom.progress.max) {
          if (_this3.dom.loop.checked) {
            _this3.dom.progress.value = 0;
          } else {
            _this3.pause();
          }
        }
      }, 80 / this.playback_rate);
    }

    // next frame
  }, {
    key: 'nextFrame',
    value: function nextFrame() {
      this.pause();
      this.frame_index++;
      if (this.frame_index == this.frames.length) {
        this.frame_index = 0;
      }
      this.drawFrame();
    }
  }, {
    key: 'prevFrame',
    value: function prevFrame() {
      this.pause();
      this.frame_index--;
      if (this.frame_index < 0) {
        this.frame_index = this.frames.length;
      }
      this.drawFrame();
    }

    // draw cursor
  }, {
    key: 'drawCursor',
    value: function drawCursor() {
      if (this.dom.draw_cursor.checked) {
        this.ctx.fillStyle = 'rgba(0,0,0,0.5)';
        this.ctx.fillRect(this.x - 1, 0, 1, this.dom.canvas.height);
        this.ctx.fillRect(0, this.y - 1, this.dom.canvas.width, 1);
      }
    }

    // draw frame
  }, {
    key: 'drawFrame',
    value: function drawFrame() {
      var i = arguments.length <= 0 || arguments[0] === undefined ? this.frame_index : arguments[0];

      if (this.status != 'loading') {
        this.ctx.clearRect(0, 0, this.dom.canvas.width, this.dom.canvas.height);
        var image = this.frames[i];
        this.ctx.drawImage(image, 0, 0, this.dom.canvas.width, this.dom.canvas.height);
        this.frame_index = i;
        if (this.draw_cursor) {
          this.drawCursor();
        }
      }
    }

    // get individual frame from this.dom.video
  }, {
    key: 'generateFrame',
    value: function generateFrame() {
      this.ctx.drawImage(this.dom.video, 0, 0, this.dom.canvas.width, this.dom.canvas.height);
      this.fp_ctx.fillRect(0, 0, this.dom.video.currentTime / this.dom.video.duration * this.dom.fp_canvas.width, 30);
      var data_url = this.dom.canvas.toDataURL('image/png');
      if (this.frames.length < 1 || this.frames.indexOf(data_url) < 0) {
        this.frames.push(data_url);
      }
    }

    // generate frames from this.dom.video
  }, {
    key: 'generateFrames',
    value: function generateFrames() {
      var _this4 = this;

      this.dom.video.loop = false;
      this.dom.video.pause();
      this.dom.video.currentTime = 0;
      this.dom.video.playbackRate = 1.5;
      this.dom.video.style.display = 'block';
      this.dom.canvas.style.display = 'none';
      this.dom.canvas.width = this.dom.video.videoWidth;
      this.dom.canvas.height = this.dom.video.videoHeight;
      this.dom.video.style.display = 'none';
      this.dom.canvas.style.display = 'block';
      this.dom.progress.style.width = this.dom.canvas.width + 'px';
      window.frame_interval = window.setInterval(function () {
        return _this4.generateFrame();
      }, 10);
      this.dom.video.play();
      this.dom.video.onended = function () {
        window.onblur = null;
        window.clearInterval(window.frame_interval);
        _this4.dom.video.pause();
        _this4.dom.video.currentTime = 0;
        _this4.generateImages();
        _this4.fp_ctx.fillRect(0, 0, 100 * _this4.dom.fp_canvas.width, 30);
        _this4.dom.video.onended = null;
      };
      this.dom.video.oncanplaythrough = null;
    }

    // generate image from frame
  }, {
    key: 'generateImage',
    value: function generateImage() {
      var _this5 = this;

      var image = new Image();
      image.src = this.frames[this.frame_index];
      this.frames[this.frame_index] = image;
      this.frame_index++;
      this.ip_ctx.fillRect(0, 0, this.frame_index / (this.frames.length - 2) * this.dom.ip_canvas.width, this.dom.ip_canvas.height);
      if (this.frame_index == this.frames.length) {
        this.start();
      } else {
        window.setTimeout(function () {
          return _this5.generateImage();
        }, 1);
      }
    }

    // generate images from frames
  }, {
    key: 'generateImages',
    value: function generateImages() {
      this.frame_index = 0;
      this.generateImage();
      this.dom.progress.max = this.frames.length - 1;
    }
  }, {
    key: 'start',
    value: function start() {
      for (var element in this.dom) {
        this.dom[element].removeAttribute('disabled');
      }
      this.pause();
      this.drawFrame(0);
      this.play();
    }
  }]);

  return GifViewer;
})();

//# sourceMappingURL=gif-viewer.js.map