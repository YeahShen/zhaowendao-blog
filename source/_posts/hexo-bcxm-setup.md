---
title: 用 Hexo + bcxm 主题搭一个自己的博客
date: 2024-03-18 10:24:00
updated: 2024-03-20 09:10:00
categories:
  - 实用教程
tags:
  - Hexo
  - 建站
cover: /img/covers/cover-1.svg
description: 从安装依赖到换上卡片式主题，记录一次干净利落的建站过程。
---

Hexo 属于那种「打开就能用」的静态博客框架：写作只用 Markdown，一条命令生成整站纯静态文件，托管在任何支持静态网页的地方都能跑起来。这篇记录从零到发布的完整过程。

<!-- more -->

## 环境准备

先确认 Node 版本，Hexo 8 需要 Node 14 以上：

```bash
node -v
pnpm -v
```

用 pnpm 装依赖比 npm 快不少，也省磁盘空间：

```bash
pnpm install
```

## 项目结构

| 路径 | 作用 |
| --- | --- |
| `_config.yml` | 站点配置，标题、域名、永久链接都在这 |
| `source/_posts/` | 文章目录，一个 Markdown 文件就是一篇文章 |
| `themes/` | 主题目录 |
| `scaffolds/` | `hexo new` 时的模板 |

## 三行命令

日常只需要记住三个：

```bash
pnpm run server   # 本地预览，改文件自动刷新
pnpm run build    # 生成静态文件到 public/
pnpm run clean    # 清缓存，改配置后建议先跑一次
```

## 写第一篇文章

```bash
pnpm exec hexo new "我的第一篇笔记"
```

生成的文件带好了 front-matter，填上标题、日期、分类和标签就能写正文了。想控制首页显示的摘要长度，在正文第一段后面插入一行 `<!-- more -->` 即可。

> 建站这件事，配置比代码更花时间。先用默认配置跑起来，再慢慢打磨细节。

## 换成卡片式主题

默认的 landscape 主题比较朴素。我把它换成了 bcxm ——左侧栏放头像和统计，右侧是带封面图的文章卡片，支持深浅色切换和站内搜索，视觉上舒服很多。

主题装好之后，只需要在 `_config.yml` 里把 `theme` 改成主题名，剩下的交给 `<theme>/_config.yml` 里的开关逐项调整。
