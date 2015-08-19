'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var GifViewer = (function () {
  function GifViewer() {
    _classCallCheck(this, GifViewer);

    this.dom = {
      url: document.getElementById('url'),
      canvas: document.getElementById('canvas'),
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
    this.ctx = this.dom.canvas.getContext('2d');
    this.initialize();
    this.listen();
    // load if url is specified in anchor
    if (window.location.hash.length > 1) {
      var url = window.location.hash.slice(1);
      if (url.match(/http/i)) {
        this.dom.url.value = window.location.hash.slice(1);
        this.loadGif();
      }
    }
  }

  _createClass(GifViewer, [{
    key: 'initialize',
    value: function initialize() {
      this.frames = [];
      this.images = [];
      this.frame_index = 0;
      this.playback_rate = 1;
    }

    // listen for events
  }, {
    key: 'listen',
    value: function listen() {
      var _this = this;

      //keyboard inputs
      document.body.onkeypress = function (e) {
        console.log(e.keyCode);
        if (e.keyCode.toString().match(/32|106|107/)) {
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
            _this.dom.draw_cursor.checked ? _this.dom.draw_cursor.removeAttribute('checked') : _this.dom.draw_cursor.setAttribute('checked', 'checked');break;
            break;
        }
      };
      // load gif on url change
      this.dom.load_gif.onsubmit = function (e) {
        e.preventDefault();
        _this.loadGif();
      };
      // play/pause toggle clicked
      this.dom.play_pause.onclick = function () {
        _this.playPause();
      };
      // save on save button click
      this.dom.save.onclick = function () {
        _this.pause();
        var data_url = _this.dom.canvas.toDataURL('image/png');
        window.open(data_url);
      };
      // update this.dom.canvas on progress input change
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
      // move cursor when hovering over this.dom.canvas
      this.dom.canvas.onmousemove = function (e) {
        _this.x = e.clientX - _this.dom.canvas.offsetLeft;
        _this.y = e.clientY - _this.dom.canvas.offsetTop;
        _this.drawFrame();
      };
      // play/pause on this.dom.canvas click
      this.dom.canvas.onclick = function () {
        if (_this.status != 'loading') {
          _this.playPause();
        }
      };
      // draw cursor when this.dom.canvas is hovered
      this.dom.canvas.onmouseenter = function () {
        _this.draw_cursor = true;
      };
      // remove cursor when this.dom.canvas is not hovered
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

      var src = this.dom.url.value;
      if (src.match(/imgur/i)) {
        src = src.replace(/gif$|gifv$/, 'webm');
      }
      if (src.match(/gfycat/i)) {
        if (!src.match(/zippy/i)) {
          src = src.replace(/gfycat/i, 'zippy.gfycat');
          src = src.replace(/\.webm$/i, '');
          src += '.webm';
        }
        src = 'http://crossorigin.me/' + src;
      }
      src = src.replace('#', '');
      this.changeStatus('loading');
      this.dom.video.style.display = 'block';
      this.dom.canvas.style.display = 'none';
      this.dom.overlay.style.display = 'block';
      var xhr = new XMLHttpRequest();
      xhr.responseType = 'blob';
      xhr.crossOrigin = 'Anonymous';
      xhr.open('GET', src, true);
      xhr.onload = function (e) {
        console.log(e);
        if (xhr.status == 200) {
          _this2.dom.video.src = URL.createObjectURL(xhr.response);
          for (var element in _this2.dom) {
            _this2.dom[element].setAttribute('disabled', 'disabled');
          }
          _this2.generateFrames();
        } else {
          console.log(xhr.status);
        }
      };
      xhr.onerror = function (e) {
        console.log(e);
      };
      xhr.send();
    }
  }, {
    key: 'changeStatus',
    value: function changeStatus(status) {
      this.status = status;
      document.body.className = status;
    }

    // play or pause depending on status
  }, {
    key: 'playPause',
    value: function playPause() {
      if (this.status == 'playing') {
        this.pause();
      } else if (this.status == 'paused') {
        this.play();
      }
    }

    // pause gif
  }, {
    key: 'pause',
    value: function pause() {
      this.changeStatus('paused');
      window.clearInterval(window.play_interval);
      this.dom.play_pause.innerHTML = 'play';
    }

    // play gif
  }, {
    key: 'play',
    value: function play() {
      var _this3 = this;

      this.changeStatus('playing');
      this.dom.play_pause.innerHTML = 'pause';
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
      }, 60 / this.playback_rate);
    }

    // next frame
  }, {
    key: 'nextFrame',
    value: function nextFrame() {
      this.pause();
      this.frame_index++;
      if (this.frame_index == this.images.length) {
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
        this.frame_index = this.images.length;
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
        var image = this.images[i];
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
    value: function generateFrame(final_frame) {
      var _this4 = this;

      var video = this.dom.video;
      this.ctx.drawImage(video, 0, 0, this.dom.canvas.width, this.dom.canvas.height);
      var data_url = this.dom.canvas.toDataURL('image/png');
      if (this.frames.length < 1 || this.frames.indexOf(data_url) < 0) {
        this.frames.push(data_url);
      }
      if (final_frame) {
        window.clearInterval(window.frame_interval);
        this.dom.video.pause();
        this.dom.video.currentTime = 0;
        this.generateImages();
      } else if (this.dom.video.currentTime / this.dom.video.duration > 0.99) {
        window.clearInterval(window.frame_interval);
        window.setTimeout(function () {
          return _this4.generateFrame(true);
        }, 10);
      }
    }

    // generate frames from this.dom.video
  }, {
    key: 'generateFrames',
    value: function generateFrames() {
      var _this5 = this;

      this.dom.video.pause();
      this.dom.video.currentTime = 0;
      this.dom.video.playbackRate = 2;
      this.dom.video.oncanplaythrough = function () {
        _this5.dom.canvas.width = _this5.dom.video.offsetWidth;
        _this5.dom.canvas.height = _this5.dom.video.offsetHeight;
        _this5.dom.progress.style.width = _this5.dom.canvas.width + 'px';
        _this5.dom.canvas.style.display = 'block';
        _this5.dom.video.style.display = 'none';
        window.frame_interval = window.setInterval(function () {
          return _this5.generateFrame();
        }, 30);
        _this5.dom.video.play();
        _this5.dom.video.oncanplaythrough = null;
      };
    }

    // generate images from frames
  }, {
    key: 'generateImages',
    value: function generateImages() {
      for (var i in this.frames) {
        var image = new Image();
        image.src = this.frames[i];
        this.images.push(image);
      }
      this.dom.progress.max = this.images.length - 1;
      for (var element in this.dom) {
        this.dom[element].removeAttribute('disabled');
      }
      this.dom.overlay.style.display = 'none';
      this.pause();
      this.drawFrame(0);
      this.play();
    }
  }]);

  return GifViewer;
})();

//# sourceMappingURL=gif-viewer.js.map