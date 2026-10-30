---
title: Nginx 配置 Brotli 压缩
date: 2026-10-30 15:20:00
categories:
  - 实用教程
tags:
  - Nginx
  - 性能
  - 压缩
cover: /img/covers/cover-7.webp
description: Nginx 不自带 Brotli，得把 ngx_brotli 手动编进去 —— 从拉代码、编译到写配置，一次走完。
---

Nginx 默认只会 GZip。Brotli 是 Google 的压缩算法，对 HTML、CSS、JS 这类文本资源的压缩率通常还能比 GZip 再高一些，浏览器的支持也已经很普遍。麻烦的地方在于 Brotli 不是 Nginx 的官方模块，得自己把 `ngx_brotli` 编译进去。

<!-- more -->

## 先下载 ngx_brotli

```bash
git clone https://gitee.com/xlsw/ngx_brotli.git
```

这里用的是 Gitee 上的镜像，国内拉取不会卡在网络上。

## 更新子模块

```bash
cd ngx_brotli
git submodule update --init
```

模块本身只负责和 Nginx 对接，真正的 brotli 算法以子模块的形式挂在仓库里。这一步不跑，编译时会直接报找不到源码。

## 重新编译 Nginx

```bash
cd /path/to/nginx

# 生成 Makefile，原有参数原样保留，末尾追加 --add-module
./configure ... --add-module=../ngx_brotli

# 编译并安装
make && make install

# 查看编译结果
nginx -V
```

`./configure` 这一行是关键。先跑一次 `nginx -V`，把当前这份 Nginx 的 `configure arguments` 整段复制出来，原样贴回命令里，再在最后追加 `--add-module=/path/to/ngx_brotli`。漏掉原有参数的话，重装出来的 Nginx 会丢掉之前的模块，HTTP/2、SSL 或者别的第三方模块都可能一起消失。

`make install` 会覆盖原来的可执行文件，编译前顺手备份一份旧的 `nginx` 二进制更稳妥。等 `nginx -V` 的输出里能看到 `--add-module=.../ngx_brotli`，就说明模块已经编进去了。

## 更新 Nginx 配置

把下面几行写进 `nginx.conf`，放 `http`、`server` 或者 `location` 层都可以：

```nginx
# nginx.conf
brotli on;                              # 启用
brotli_comp_level 6;                    # 压缩等级，默认 6，最高 11，太高会明显吃 CPU
brotli_buffers 16 8k;                   # 请求缓冲区的数量和大小
brotli_min_length 1k;                   # 指定压缩数据的最小长度，大于或等于才会压缩
brotli_types text/plain text/css application/javascript application/x-javascript text/javascript application/json application/xml application/rss+xml image/svg+xml;  # 需要压缩的 MIME 类型
brotli_static always;                   # 是否查找预压缩好的 .br 文件，可选 on / off / always
brotli_window 512k;                     # 窗口值，默认 512k
```

每条指令的分工：

| 指令 | 作用 | 常用值 |
| --- | --- | --- |
| `brotli` | 总开关 | `on` |
| `brotli_comp_level` | 压缩等级，0–11，默认 6 | 静态资源 9–11，动态内容 4–6 |
| `brotli_buffers` | 请求缓冲区的数量与大小 | `16 8k` |
| `brotli_min_length` | 最小压缩长度，低于它就不压 | `1k` |
| `brotli_types` | 参与压缩的 MIME 类型 | 文本类资源都加上 |
| `brotli_static` | 是否查找预压缩的 `.br` 文件 | `on` / `always` |
| `brotli_window` | 窗口大小，默认 512k | `512k` ~ `4m` |

配置改完先验证语法，再平滑重载：

```bash
nginx -t && nginx -s reload
```

## 确认真的生效了

```bash
curl -sI -H 'Accept-Encoding: br' https://example.com | grep -i content-encoding
```

返回 `Content-Encoding: br` 就说明压缩生效了。如果拿到的还是 `gzip`，或者干脆没有压缩头，一般就三个原因：响应的类型没写进 `brotli_types`、体积没到 `brotli_min_length`，或者指令写在了没被命中的层级上。

## Brotli 和 GZip 可以一起用

Brotli 不需要替换 GZip，两个一起开着才是完整方案。Nginx 会看请求头里的 `Accept-Encoding`：支持 `br` 就返回 Brotli，只认 `gzip` 就回落到 GZip，更老的客户端拿原文，谁都不会收到解不开的内容。

> Brotli 负责省流量，GZip 负责兜底。

<small>本文整理自 shanbo 的《Nginx配置Brotli》（知乎），有删改与补充。</small>
