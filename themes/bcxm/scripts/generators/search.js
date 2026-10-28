/* ===================================================================
 *  站内搜索索引生成器 → /search.json
 *  不依赖 hexo-generator-searchdb 等插件，也不依赖 hexo-util
 * =================================================================== */

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

module.exports = function (hexo) {
  hexo.extend.generator.register('bcxm_search', function (locals) {
    const cfg = hexo.theme.config.search;
    if (cfg && cfg.enable === false) return;

    const root = hexo.config.root || '/';
    const posts = locals.posts
      .sort('-date')
      .toArray()
      .map((post) => ({
        title: post.title || '',
        url: root + String(post.path || '').replace(/^\//, ''),
        date: post.date ? post.date.format('YYYY-MM-DD') : '',
        categories: (post.categories ? post.categories.toArray() : []).map((c) => c.name),
        tags: (post.tags ? post.tags.toArray() : []).map((t) => t.name),
        text: stripHTML(post.content || '')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 3000)
      }));

    return {
      path: 'search.json',
      data: JSON.stringify(posts)
    };
  });
};
