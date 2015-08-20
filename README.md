Gif Viewer
===================

What This Project Does
-------------
This is a tool used for extracting frames from an HTML5 video element and creating a frame-by-frame player in HTML5 Canvas with some extra tools. This is meant to be used for animated charts or other data-driven gifs to allow for frame-by-frame analysis as well as easy-to-use variable playback speeds. Written as a side-project to learn [ES6](http://www.ecma-international.org/ecma-262/6.0/index.html).

How It Works:
--------------
Simply, put, it finds a HTML5 video version of the GIF source and extracts frames by playing the videowhile taking snapshots via HTML5 canvas's toDataUrl method. Playback is then performed by looping through the array of images and drawing them back to canvas via the drawImage method. 

How to Use it
---------
There are several options:
- Clone this repository and open the index.html file.
- Visit [http://morrow.github.io/gif-viewer](http://morrow.github.io/gif-viewer) and enter a URL.
- Append an imgur or gfycat GIF link to *http://morrow.github.io/gif-viewer/#/insert-url-here*

Example Links
---------------
> Most of these examples came from [/r/dataisbeautiful](https://reddit.com/r/dataisbeautiful), which is a great resource for informative data-driven images and videos.
- [1933 to 2100 USA Age Distribution](http://morrow.github.io/gif-viewer/#/http://i.imgur.com/XQWQ57j.gif) - credit: [StephenHolzman](https://www.reddit.com/user/StephenHolzman)
- [Taxi pickups in NYC by hour and trip length](http://morrow.github.io/gif-viewer/#/http://i.imgur.com/1ODzIhd.gif) - credit: [fhoffa](https://www.reddit.com/user/fhoffa)
- [The shortest path through the 48 continental state capitals](http://morrow.github.io/gif-viewer/#/http://i.imgur.com/pQBJO7d.gif) - credit: [indeddit](https://www.reddit.com/user/indeddit)
- [Animated map showing US obesity levels, 1985-2010 [CDC]](http://morrow.github.io/gif-viewer/#/http://i.imgur.com/U7Zv0Pw.gifv) - credit: [zipzopzoobitybop](https://www.reddit.com/user/zipzopzoobitybop)
- [Animated Baseball Stats](http://morrow.github.io/gif-viewer/#/http://gfycat.com/OpenFarflungDarklingbeetle) - credit: [crivexp2](https://www.reddit.com/user/crivexp2)

License
---------
MIT License (MIT)
Copyright (c) 2015 Terry Morrow
