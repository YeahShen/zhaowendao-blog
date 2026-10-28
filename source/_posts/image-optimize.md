---
title: 图片压缩与格式选择
date: 2024-01-09 14:30:00
categories:
  - 实用资源
tags:
  - 图片
  - 性能
cover: /img/covers/cover-4.svg
description: AVIF、WebP、JPEG 到底该用哪个，以及几个不需要上传的压缩工具。
---

图片通常是页面上最重的资源。选对格式、压对参数，往往比优化 JavaScript 收益更大。

<!-- more -->

## 格式怎么选

| 格式 | 适合 | 不适合 |
| --- | --- | --- |
| AVIF | 照片、渐变，压缩率最高 | 需要兼容旧浏览器 |
| WebP | 绝大多数场景的稳妥选择 | 极端压缩率需求 |
| JPEG | 兼容性兜底 | 大面积纯色、文字截图 |
| PNG | 截图、图标、需要透明 | 照片 |
| SVG | 图标、插画、logo | 复杂照片 |

结论很实际：**优先 AVIF，用 WebP 兜底，SVG 交给图标**。

## 用 picture 做渐进增强

```html
<picture>
  <source type="image/avif" srcset="photo.avif">
  <source type="image/webp" srcset="photo.webp">
  <img src="photo.jpg" alt="示例图片" loading="lazy" width="1200" height="800">
</picture>
```

浏览器会挑第一个认识的格式，都认识就下载体积最小的那个。

## 压缩工具

- `sharp` —— Node 生态，脚本化批量处理首选。
- `oxipng` / `pngquant` —— 无损 / 有损压缩 PNG。
- `cwebp`、`avifenc` —— 命令行转码。
- Squoosh —— 浏览器里跑，临时处理几张很方便。

```bash
# 批量转 WebP 并限制最大宽度
for f in *.jpg; do
  cwebp -q 78 -resize 1600 0 "$f" -o "${f%.jpg}.webp"
done
```

## 别忘了这几件事

1. **写上 `width` 和 `height`**，避免图片加载时的布局抖动。
2. 非首屏图片加 `loading="lazy"`。
3. 用 `srcset` 给不同屏幕准备不同尺寸，手机上不必下载桌面大图。
4. 首屏主图可以加 `fetchpriority="high"`，抢一点加载优先级。

做完这几步，同样一张图在手机上常常能省下一半以上流量。
