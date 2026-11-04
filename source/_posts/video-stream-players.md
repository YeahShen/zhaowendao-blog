---
title: 三种视频流浏览器播放解决方案
date: 2026-11-04 16:42:00
categories:
  - 前端开发
tags:
  - 视频
  - 直播
  - HLS
  - RTMP
cover: /img/covers/cover-6.svg
description: 转载：HLS、RTMP、RTSP 三种视频流协议的区别，以及浏览器里播放它们的几种方案。
---

> **转载说明** 本文转载自掘金社区，作者 [王二水](https://juejin.cn/user/2137106334090920)，原文发布于 2019-09-26。原文链接：[三种视频流浏览器播放解决方案](https://juejin.cn/post/6844903953126129671)。文章梳理了 HLS、RTMP、RTSP 三种视频流协议的区别，以及在浏览器里播放它们的几种方案。版权归原作者所有，本文仅作学习存档。

<!-- more -->

## 背景

最近在项目中遇到需要视频直播、视频回放等需求，在实现过程中也碰到了很多坑，因此在这里记录一下调研过程中遇到的解决方案。

## 视频流介绍

视频流大致分为三种：HLS,RTSP,RTMP，下面依次介绍下三种视频流

### HLS

[HLS](https://www.jianshu.com/p/426425cad08a)（Http Live Streaming) 是一个由苹果公司提出的基于HTTP的流媒体网络传输协议，直接把流媒体切片成一段段，信息保存到m3u列表文件中，
可以将不同速率的版本切成相应的片；播放器可以直接使用http协议请求流数据。  
优势：

- 可以在不同速率的版本间自由切换，实现无缝播放
- 省去使用其他协议的烦恼

劣势:

- 延迟大小受切片大小影响，不适合直播，适合视频点播。
- 实时性差，延迟高。HLS 的延迟基本在 10s+ 以上
- 文件碎片。特性的双刃剑，ts 切片较小，会造成海量小文件，对存储和缓存都有一定的挑战

### RTMP

[RTMP](https://zhuanlan.zhihu.com/p/27368329)（Real Time Message Protocol）由 Adobe 公司提出流媒体协议，并且是私有协议，未完全公开，用来解决多媒体数据传输流的多路复用（Multiplexing）和分包（packetizing）的问题，RTMP协议一般传输的是 flv，f4v 格式流。一般在 TCP 1个通道上传输命令和数据。  
优势：

- 在于低延迟，稳定性高，支持所有摄像头格式
- 专为流媒体开发的协议，对底层的优化比其它协议更加优秀

劣势：

- 浏览器需要加载 flash插件才能播放。
- RTMP 为 Adobe 私有协议，很多设备无法播放，特别是在 iOS 端，需要使用第三方解码器才能播放
- 基于 TCP 传输，非公共端口，可能会被防火墙阻拦

### RTSP

[RTSP](https://www.jianshu.com/p/4e3925f98e84)（Real-Time Stream Protocol）由Real Networks 和Netscape共同提出的流媒体协议，RTSP协议是共有协议，并有专门机构做维护。是[TCP/IP协议](https://baike.baidu.com/item/TCP%2FIP%E5%8D%8F%E8%AE%AE)体系中的一个[应用层](https://baike.baidu.com/item/%E5%BA%94%E7%94%A8%E5%B1%82)协议. RTSP协议一般传输的是 ts、mp4 格式的流，RTSP传输一般需要 2-3 个通道，命令和数据通道分离。基于文本的多媒体播放控制协议. RTSP定义流格式，流数据经由RTP传输；  
优势:

1. RTSP实时效果非常好，适合视频聊天，视频监控等方向。

劣势：

1. 浏览器不能直接播放，只能通过插件或者转码

## 播放解决方案

### HLS与RTMP的播放解决方案

**一、使用原生video**  
如果仅需要在移动设备的WebView上播放，我们可以选择使用html中嵌入hls播放。如下html能够在所有Safari或者安卓3.0以上的WebView上播放。这样就不需要使用第三方的播放器。

```html
<html lang="en">
    <head>
       <meta charset=utf-8/>
    </head>
    <body>
        <div id='player'>
           <video width="640" height="320" controls>
                <source src="http://10.10.5.119/live/livestream.m3u8" type="application/x-mpegURL">
           </video>
        </div>
    </body>
</html>
```

缺点：

1. 原生H5支持的媒体格式主要有MP4、OGG、WebM、M3U8
2. M3U8格式播放在pc端浏览器上支持兼容性差
3. 无法播放rtmp流的视频，因为原生不支持flv

优点：

1. 使用原生video，不用安装第三方插件

**二、使用flv.js**  
[flv.js](https://github.com/gwuhaolin/blog/blob/master/source/_posts/%E4%BD%BF%E7%94%A8flv.js%E5%81%9A%E7%9B%B4%E6%92%AD.md)是来自Bilibli的开源项目。它解析FLV文件喂给原生HTML5 Video标签播放音视频数据，使浏览器在不借助Flash的情况下播放FLV成为可能.

```javascript
import React, { PureComponent } from 'react';
import Reflv from 'reflv';

export class HttpFlv extends PureComponent {
  render() {
    return (
      <Reflv
        url={`http://localhost:7001/live/test.flv`}
        type="flv"
        isLive
        cors
      />
    )
  }
}
```

缺点：

1. 录播，依赖 原生HTML5 Video标签 和 Media Source Extensions API
2. 直播，依赖录播所需要的播放技术，同时依赖 HTTP FLV 或者 WebSocket 中的一种协议来传输FLV。其中HTTP FLV需通过流式IO去拉取数据，支持流式IO的有fetch或者stream
3. 由于依赖Media Source Extensions，目前所有iOS和Android4.4.4以下里的浏览器都不支持，也就是说目前对于移动端flv.js基本是不能用的。

优点：

1. 由于浏览器对原生Video标签采用了硬件加速，性能很好，支持高清
2. 同时支持录播和直播
3. 去掉对Flash的依赖

**三、video.js**  
video.js可以支持网页在所有的浏览器播放，免费的使用很多高级功能。这两种视频流的播放可以使用video.js，由于前端使用react开发，因此需要安装_video.js。_在进行两种不同流播放时需要注意的是设置不同的type,播放rtmp时type是 rtmp/flv，播放hls时type是 application/x-mpegURL。两种视频流都是基于flash的，因此需要flash的支持。

```javascript
class VideoPlayer extend Component {
      constructor(props) {
        super(props);
        this.VideoOptions = {
            autoplay: true,
            controls: false,
            sources: [{
                src: url,
                type: "application/x-mpegURL"
            }],
            fluid: 'true',
            playbackRates: [0.75, 1, 1.5, 2]
        }
    }
    componentDidMount() {
         this.player = videojs(this.videoNode, this.VideoOptions, function onPlayerReady() { })
    }
    componentWillUnmount() {
        if (this.player) {
            this.player.dispose()
        }
    }
  render(){
    return (
      <video
      	ref={node => this.videoNode = node}
        className='video-js vjs-16-9'
      />
    )
  }
}
```

> html5的video标签只支持mp4、webm、ogg三种格式，不支持flv格式， flv格式是flash专用的，rtmp流为flv格式的，必须使用flash播放器，在video.js内部可以检测浏览器是否支持html5播放器直接播放，如果不支持内部会自动调用浏览器的flash播放器播放视频。Edge、谷歌浏览器中网站默认是禁用flash的，手动设置为允许flash即可

缺点：

1. 依赖flash
2. 不支持rtsp流的播放

优点：

1. 它是开源免费的，你可以在github很容易的获取它的最新代码。
2. 使用它非常的容易，只要花几秒钟就可以架起一个视频播放页面。
3. 它几乎兼容所有的浏览器，并且优先使用html5，在不支持的浏览器中，会自动使用flash进行播放。
4. 界面可以定制，纯javascript和css打造。说明文档也非常的详细

### RTSP流播放解决方案

**一、利用VLC插件转流**  
浏览器安装VLC插件进行服务器映射转码，得到video标签能够正常打开的ogg格式视频然后播放

```html
<object type='application/x-vlc-plugin' pluginspage="http://www.videolan.org/" id='vlc' events='false' width="720" height="410">
    <param name='mrl' value='rtsp://admin:12345@192.168.10.235:554/h264/ch1/main/av_stream' />
    <param name='volume' value='50' />
    <param name='autoplay' value='true' />
    <param name='loop' value='false' />
    <param name='fullscreen' value='false' />
    <param name='controls' value='false' />
</object>
```

**优缺点**

- 优点： 可以直接播放RTSP，无需任何中介服务器的帮助
- 缺点： 需要手动安装插件； 基于NPAPI，不被最新的 Chrome 和 Firefox 支持
- 如果你项目的其他功能都能兼容客户电脑上的 IE 浏览器，这个方案就是首选。

**二、[html5_rtsp_player](https://github.com/Streamedian/html5_rtsp_player) + websocket_rtsp_proxy 实现视频流直播**

![html5_rtsp_player + websocket_rtsp_proxy 架构图](/img/posts/video-streaming/stream-player-arch.png)

实现步骤

1. 服务器安装streamedian服务器
2. 客户端通过video标签播放

```html
<video id="test_video" controls autoplay></video>
<script src="free.player.1.8.4.js"></script>
<script>
    if (window.Streamedian) {
        var errHandler = function(err){
            console.log('err', err.message);
        };
        var infHandler = function(inf) {
            console.log('info', inf)
        };
        var playerOptions = {
            socket: "ws://localhost:8088/ws/",
            redirectNativeMediaErrors : true,
            bufferDuration: 30,
            errorHandler: errHandler,
            infoHandler: infHandler
        };
        var html5Player  = document.getElementById("test_video");
        html5Player.src = "rtsp://184.72.239.149/vod/mp4://BigBuckBunny_175k.mov";
        var player = Streamedian.player('test_video', playerOptions);
        
        window.onbeforeunload = function(){
            player && player.destroy();
            player = null;
            Request = null;
        }
    }
</script>
```

注意：测试时先从官网申请license key，否则socket 只能识别localhost和127.0.0.1  
**优缺点**

- 优点：实现比较简单
- 缺点：收费的，免费版有很多限制

**三：ffmpeg + nginx + video，rtsp转rtmp播放**  
rtmp是adobe开发的协议，一般使用adobe media server 可以方便的搭建起来；随着开源时代的到来，有大神开发了nginx的rtmp插件，也可以直接使用nginx实现rtmp  
rtmp方式的最大的优点在于低延时，经过测试延时普遍在1-3秒，可以说很实时了；缺点在于它是adobe开发的，rtmp的播放严重依赖flash，而由于flash本身的安全，现代浏览器大多禁用flash  
**实现步骤**

1. 安装ffmpeg工具
2. 安装nginx
   注意：linux系统需要安装 nginx-rtmp-module 模块，Windows系统安装包含rtmp的(如nginx 1.7.11.3 Gryphon)
3. 更改nginx配置

```nginx
rtmp{
    server{
    listen 1935;
        application live{
          live on;
          record off;
        }
        application hls{
          live on;
          hls on;
          hls_path nginx-rtmp-module/hls;
          hls_cleanup off;
        }
    }
}
```

4. ffmpeg转码

```bash
ffmpeg -i "rtsp://184.72.239.149/vod/mp4://BigBuckBunny_175k.mov" -f flv -r 25 -s 1080*720 -an "rtmp://127.0.0.1:1935/hls/mystream"
```

5. video 播放

```html
<html>
<head>
<title>video</title>
<!-- 引入css -->
<link rel="stylesheet" type="text/css" href="./videojs/video-js.min.css" />
</head>
<body>
<video id="test_video" class="video-js vjs-default-skin vjs-big-play-centered" controls autoplay>
    <source src='rtmp://127.0.0.1:1935/hls/mystream' type='rtmp/flv'/>
</video>
</body>
</html>
<!-- 引入js -->
<script type="text/javascript" src="./videojs/video.min.js"></script>
<script type="text/javascript" src="./videojs/videojs-flash.js"></script>
<script>
videojs.options.flash.swf = "./videojs/video-js.swf"
    var player = videojs('test_video', {"autoplay":true});
    player.play();
</script>
```

注意：使用谷歌浏览器播放时，需要开启flash允许

**四：ffmpeg + video，rtsp转hls播放**  
HLS (HTTP Live Streaming) 直播 是有苹果提出的一个基于http的协议。其原理是把整个流切分成一个个的小视频文件，然后通过一个m3u8的文件列表来管理这些视频文件  
HTTP Live Streaming 并不是一个真正实时的流媒体系统，这是因为对应于媒体分段的大小和持续时间有一定潜在的时间延时。在客户端，至少在一个分段媒体文件被完全下载后才能够开始播放，而通常要求下载完两个媒体文件之后才开始播放以保证不同分段音视频之间的无缝连接。  
此外，在客户端开始下载之前，必须等待服务器端的编码器和流分割器至少生成一个TS文件，这也会带来潜在的时延。  
服务器软件将接收到的流每缓存一定时间后包装为一个新的TS文件，然后更新m3u8文件。m3u8文件中只保留最新的几个片段的索引，以保证观众任何时候连接进来都会看到较新的内容，实现近似直播的效果。  
这种方式的理论最小延时为一个ts文件的时长，一般为2-3个ts文件的时长。  
**实现步骤**

1. 安装ffmpeg工具
2. ffmpeg转码

```bash
ffmpeg -i "rtsp://184.72.239.149/vod/mp4://BigBuckBunny_175k.mov" -c copy -f hls -hls_time 2.0 -hls_list_size 0 -hls_wrap 15 "D:/Program Files/html/hls/test.m3u8"
```

ffmpeg 关于hls方面的指令说明

- -hls_time n: 设置每片的长度，默认值为2。单位为秒
- -hls_list_size n:设置播放列表保存的最多条目，设置为0会保存有所片信息，默认值为5
- -hls_wrap n:设置多少片之后开始覆盖，如果设置为0则不会覆盖，默认值为0.这个选项能够避免在磁盘上存储过多的片，而且能够限制写入磁盘的最多的片的数量
- -hls_start_number n:设置播放列表中sequence number的值为number，默认值为0

3. video 播放

```html
<html>
<head>
<title>video</title>
<!-- 引入css -->
<link rel="stylesheet" type="text/css" href="./videojs/video-js.min.css" />
</head>
<body>
<div class="videoBox">
    <video id="my_video_1" class="video-js vjs-default-skin" controls>
        <source src="http://localhost:8088/hls/test.m3u8" type="application/x-mpegURL"> 
    </video>
</div>
</body>
</html>
<script type="text/javascript" src="./videojs/video.min.js"></script>
<script type="text/javascript" src="./videojs/videojs-contrib-hls.min.js"></script>
<script>
videojs.options.flash.swf = "./videojs/video-js.swf"
    var player = videojs('my_video_1', {"autoplay":true});
    player.play();
</script>
```

**五、jsmpeg + ffmpeg**  
[JSMpeg](https://github.com/phoboslab/jsmpeg)是一个用JavaScript编写的视频播放器。它由MPEG-TS分路器，MPEG1视频和MP2音频解码器，WebGL和Canvas2D渲染器以及WebAudio声音输出组成。JSMpeg可以通过Ajax加载静态视频，并允许通过WebSockets发送MPEG，前端通过js解析MPEG不断绘制canvas，包括音频。JSMpeg可以在iPhone 5S上以30fps解码720p视频，适用于任何现代浏览器（Chrome，Firefox，Safari，Edge）。  
简单示例：

```html
<script src="jsmpeg.min.js"></script>
<div class="jsmpeg" data-url="video.ts"></div>
```

**六、WebRTC**  
WebRTC 是支持网页浏览器进行实时音视频的一套API，例如：HTML5 通过 webRTC 直接调用摄像头，但是如果要实现远程视频流的显示，则需要将 RTSP 转换为 WebRTC 流，供 web 端显示。

## 参考链接

- [RTMP、HTTP-FLV、HLS](https://zhuanlan.zhihu.com/p/48100533)
- [简述HLS,HTTP,RTSP,RTMP协议的区别](https://blog.csdn.net/bingqingsuimeng/article/details/79184948)
- [浏览器播放rtsp视频流解决方案](https://juejin.cn/post/6844903877217632264)
- [Chrome浏览器直播 rtsp格式 （Media Source Extensions + H5Stream）](https://segmentfault.com/q/1010000013117129)

## 最后

> 原文在这里：[gitHub](https://github.com/Rashomon511/MyBlog/issues/54) 如有遗漏，还请指正！！

**如果觉得对您有帮助！请别忘记点个赞或者关注哦**！**您的关注将是我前进的动力！！冲鸭！！！**

![「无畏前端」公众号二维码](/img/posts/video-streaming/weiwu-frontend-banner.png)

**「无畏前端」不定时更新社区优秀技术文章！**

<small>转载自掘金：[三种视频流浏览器播放解决方案](https://juejin.cn/post/6844903953126129671)，作者 王二水，原文发布于 2019-09-26。</small>
