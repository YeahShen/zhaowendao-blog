/* ===================================================================
 *  bcxm 主题助手函数（不依赖 hexo-util，主题零外部依赖）
 * =================================================================== */

/** 去标签 + 解实体（含数字实体，避免摘要里出现 &amp;#x2F; 这类残留） */
function stripHTML(input) {
  return String(input || '')
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&#x([0-9a-f]+);/gi, (m, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (m, dec) => String.fromCharCode(parseInt(dec, 10)))
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}

/** 截断 */
function truncate(str, options) {
  const { length = 140, omission = '…' } = options || {};
  const s = String(str || '');
  if (s.length <= length) return s;
  return s.slice(0, length).replace(/[\s,，。.!！?？:：;；]+$/, '') + omission;
}

const isExternal = (p) => /^https?:\/\//i.test(p) || /^\/\//.test(p);

/** 把 "路径 || 图标" 解析成对象 */
function parseMenuItem(label, value) {
  const [name, icon = ''] = String(label).split('||').map((s) => s.trim());
  if (value && typeof value === 'object') {
    return {
      name,
      icon,
      path: '',
      external: false,
      children: Object.entries(value).map(([k, v]) => parseMenuItem(k, v))
    };
  }
  const [path = '#', ic] = String(value || '')
    .split('||')
    .map((s) => s.trim());
  return {
    name,
    icon: icon || ic || '',
    path,
    external: isExternal(path),
    children: null
  };
}

module.exports = function (hexo) {
  const toUrl = (ctx, p) => (typeof ctx.url_for === 'function' ? ctx.url_for(p) : p);

  /** 导航菜单 → 数组 */
  hexo.extend.helper.register('bcxm_menu', function () {
    const menu = (this.theme && this.theme.menu) || {};
    return Object.entries(menu).map(([label, value]) => {
      const item = parseMenuItem(label, value);
      item.href = item.external ? item.path : toUrl(this, item.path);
      if (item.children) {
        item.children = item.children.map((c) => ({
          ...c,
          href: c.external ? c.path : toUrl(this, c.path)
        }));
      }
      return item;
    });
  });

  /** 文章封面 */
  hexo.extend.helper.register('bcxm_cover', function (post) {
    const cover = post && post.cover;
    if (!cover) return '';
    return toUrl(this, cover);
  });

  /** 文章摘要（纯文本） */
  hexo.extend.helper.register('bcxm_excerpt', function (post, length) {
    const len = Number(length) || 140;
    const raw = post.excerpt || post.content || '';
    return truncate(stripHTML(raw).trim().replace(/\s+/g, ' '), { length: len });
  });

  /** 侧栏「已运行时间」 */
  hexo.extend.helper.register('bcxm_runtime', function (since) {
    const start = new Date(since || this.theme.runtime_since || '2024-01-01');
    if (isNaN(start.getTime())) return '';
    const days = Math.max(0, Math.floor((Date.now() - start.getTime()) / 86400000));
    return `${days} 天`;
  });

  /** 把主题调色板输出成 CSS 变量 */
  hexo.extend.helper.register('bcxm_palette', function () {
    const c = (this.theme && this.theme.theme_color) || {};
    const d = (this.theme && this.theme.dark_color) || {};
    const map = {
      '--bcxm-main': c.main,
      '--bcxm-paginator': c.paginator,
      '--bcxm-hover': c.button_hover,
      '--bcxm-selection': c.text_selection,
      '--bcxm-link': c.link,
      '--bcxm-meta': c.meta,
      '--bcxm-hr': c.hr,
      '--bcxm-code-fg': c.code_foreground,
      '--bcxm-toc': c.toc,
      '--bcxm-dark-bg': d.background,
      '--bcxm-dark-card': d.card,
      '--bcxm-dark-text': d.text,
      '--bcxm-dark-text-highlight': d.text_highlight,
      '--bcxm-dark-border': d.border
    };
    return Object.entries(map)
      .filter(([, v]) => v)
      .map(([k, v]) => `${k}:${v}`)
      .join(';');
  });

  /** 文章是否显示目录（有二级以上标题才显示） */
  hexo.extend.helper.register('bcxm_has_toc', function (post) {
    const html = (post && post.content) || '';
    return /<h[2-4][^>]*id=/i.test(html);
  });

  /** 侧栏最新文章 */
  hexo.extend.helper.register('bcxm_recent', function (limit) {
    const n = Number(limit) || 5;
    return this.site.posts.sort('-date').limit(n).toArray();
  });

  /** 判断当前页面是否属于某个导航项 */
  hexo.extend.helper.register('bcxm_active', function (itemPath) {
    const norm = (p) => String(p || '').replace(/\/index\.html$/, '/').replace(/\/$/, '');
    const cur = norm(this.page.path);
    const base = norm(itemPath);
    if (base === '') return cur === '';
    return cur === base || cur.indexOf(base + '/') === 0;
  });

  /** 文章字数与阅读时长 */
  hexo.extend.helper.register('bcxm_wordcount', function (post) {
    const text = stripHTML((post && post.content) || '');
    const words = text.replace(/\s+/g, '').length;
    const minutes = Math.max(1, Math.round(words / 400));
    return { words, minutes };
  });
};
