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
  }

  // initialize class variables, load gif if location.hash contains url

  _createClass(GifViewer, [{
    key: 'initialize',
    value: function initialize() {
      this.frames = [];
      this.images = [];
      this.frame_index = 0;
      this.playback_rate = 1;
      // load if url is specified in anchor
      if (window.location.hash.length > 1) {
        if (window.location.hash.match(/http/i)) {
          this.dom.url.value = 'http' + window.location.hash.split('http')[1];
          this.loadGif();
        }
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
            _this.dom.draw_cursor.checked ? _this.dom.draw_cursor.removeAttribute('checked') : _this.dom.draw_cursor.setAttribute('checked', 'checked');break;
            break;
        }
      };
      // load gif on url change
      this.dom.load_gif.onsubmit = function (e) {
        e.preventDefault();
        window.location.hash = '/' + _this.dom.url.value;
        _this.initialize();
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
      if (!window.localStorage['alert_given']) {
        alert('Please stay on this page while the extraction process runs. Results will vary if ran in a background tab. This warning will only appear once. Thanks. :)');
        window.localStorage['alert_given'] = true;
      }
      // asynchronously load video (experimental feature, trying to load entire video before playing)
      this.changeStatus('loading');
      var xhr = new XMLHttpRequest();
      xhr.responseType = 'blob';
      xhr.crossOrigin = 'Anonymous';
      xhr.open('GET', src, true);
      xhr.onload = function (e) {
        if (xhr.status == 200) {
          if (xhr.getResponseHeader('content-type').match('video')) {
            _this2.dom.video.src = URL.createObjectURL(xhr.response);
            for (var element in _this2.dom) {
              _this2.dom[element].setAttribute('disabled', 'disabled');
            }
            _this2.generateFrames();
          } else {
            _this2.dom.overlay.innerHTML = 'Error loading GIF';
            window.setTimeout(function () {
              _this2.changeStatus('ready');
              _this2.dom.overlay.innerHTML = 'Extracting frames from GIF, please wait...';
            }, 2000);
          }
        }
      };
      xhr.onerror = function (e) {
        _this2.dom.overlay.innerHTML = 'Error loading GIF.';
        window.setTimeout(function () {
          _this2.changeStatus('ready');
          _this2.dom.overlay.innerHTML = 'Extracting frames from GIF, please wait...';
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
      this.dom.video.style.display = 'block';
      this.dom.canvas.style.display = 'none';
      this.dom.video.oncanplaythrough = function () {
        _this5.dom.canvas.width = _this5.dom.video.offsetWidth;
        _this5.dom.canvas.height = _this5.dom.video.offsetHeight;
        _this5.dom.video.style.display = 'none';
        _this5.dom.canvas.style.display = 'block';
        _this5.dom.progress.style.width = _this5.dom.canvas.width + 'px';
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
      this.pause();
      this.drawFrame(0);
      this.play();
    }
  }]);

  return GifViewer;
})();

//# sourceMappingURL=gif-viewer.js.map