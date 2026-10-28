/* ===================================================================
   bcxm theme — 前端交互
   零依赖：深色模式 / 抽屉菜单 / 搜索 / 目录高亮 / 代码复制 / 回到顶部
   =================================================================== */
(function () {
  'use strict';

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- 1. 深色模式 ---------------- */
  (function initTheme() {
    var btn = $('#theme-toggle');
    var stored = null;
    try { stored = localStorage.getItem('bcxm-theme'); } catch (e) {}
    if (!stored) {
      root.setAttribute('data-theme', root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');
    }
    if (!btn) return;
    btn.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('bcxm-theme', next); } catch (e) {}
      var meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', next === 'dark' ? '#121212' : '#49B1F5');
    });
  })();

  /* ---------------- 2. 滚动相关 ---------------- */
  var header = $('#page-header');
  var progress = $('#scroll-progress');
  var backTop = $('#back-to-top');
  var ringBar = $('#ring-bar');
  var ringLen = ringBar ? ringBar.getTotalLength ? ringBar.getTotalLength() : 97.4 : 97.4;

  if (ringBar && ringBar.getTotalLength) {
    try { ringLen = ringBar.getTotalLength(); } catch (e) {}
  }

  var article = $('#article-content');
  var tocPercent = $('#toc-percent');

  var ticking = false;

  function onScrollFrame() {
    var y = window.scrollY || document.documentElement.scrollTop;
    var docH = document.documentElement.scrollHeight - window.innerHeight;
    var ratio = docH > 0 ? Math.min(1, y / docH) : 0;

    if (progress) progress.style.transform = 'scaleX(' + ratio + ')';
    if (header) header.classList.toggle('is-stuck', y > 8);

    if (backTop) {
      var show = y > 320;
      backTop.classList.toggle('is-visible', show);
      if (ringBar) {
        ringBar.style.strokeDasharray = ringLen;
        ringBar.style.strokeDashoffset = ringLen * (1 - ratio);
      }
    }

    if (tocPercent && article) {
      var rect = article.getBoundingClientRect();
      var total = rect.height - window.innerHeight * 0.5;
      var read = Math.min(1, Math.max(0, (-rect.top + window.innerHeight * 0.3) / Math.max(1, total)));
      tocPercent.textContent = Math.round(read * 100) + '%';
    }

    updateActiveToc();
    ticking = false;
  }

  function requestScroll() {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(onScrollFrame);
    }
  }

  window.addEventListener('scroll', requestScroll, { passive: true });
  window.addEventListener('resize', requestScroll);

  if (backTop) {
    backTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  /* ---------------- 3. 抽屉菜单 ---------------- */
  (function initDrawer() {
    var drawer = $('#drawer');
    if (!drawer) return;
    var openBtn = $('#drawer-open');
    var panel = $('.drawer-panel', drawer);

    function open() {
      drawer.classList.add('open');
      drawer.setAttribute('aria-hidden', 'false');
      if (openBtn) openBtn.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
      var first = panel && panel.querySelector('a, button');
      if (first) first.focus({ preventScroll: true });
    }

    function close() {
      drawer.classList.remove('open');
      drawer.setAttribute('aria-hidden', 'true');
      if (openBtn) openBtn.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      if (openBtn) openBtn.focus({ preventScroll: true });
    }

    if (openBtn) openBtn.addEventListener('click', open);
    $$('[data-drawer-close]', drawer).forEach(function (el) {
      el.addEventListener('click', close);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && drawer.classList.contains('open')) close();
    });
  })();

  /* ---------------- 4. 导航下拉（点击展开，触屏可用） ---------------- */
  $$('.nav-item.has-children').forEach(function (item) {
    var toggle = $('.nav-toggle', item);
    if (!toggle) return;
    toggle.addEventListener('click', function (e) {
      e.preventDefault();
      var isOpen = item.classList.contains('is-open');
      $$('.nav-item.has-children').forEach(function (other) {
        other.classList.remove('is-open');
        var t = $('.nav-toggle', other);
        if (t) t.setAttribute('aria-expanded', 'false');
      });
      item.classList.toggle('is-open', !isOpen);
      toggle.setAttribute('aria-expanded', String(!isOpen));
    });
  });

  document.addEventListener('click', function (e) {
    if (!e.target.closest('.nav-item.has-children')) {
      $$('.nav-item.has-children').forEach(function (other) {
        other.classList.remove('is-open');
        var t = $('.nav-toggle', other);
        if (t) t.setAttribute('aria-expanded', 'false');
      });
    }
  });

  /* ---------------- 5. 目录高亮 ---------------- */
  var tocLinks = $$('.toc-body .toc-link');
  var headingTargets = [];

  function collectHeadings() {
    headingTargets = tocLinks
      .map(function (link) {
        var href = link.getAttribute('href') || '';
        var id = href.charAt(0) === '#' ? href.slice(1) : '';
        var el = id ? document.getElementById(decodeURIComponent(id)) : null;
        return el ? { el: el, link: link } : null;
      })
      .filter(Boolean);
  }

  function updateActiveToc() {
    if (!headingTargets.length) return;
    var offset = 90;
    var current = headingTargets[0];
    for (var i = 0; i < headingTargets.length; i++) {
      if (headingTargets[i].el.getBoundingClientRect().top <= offset) current = headingTargets[i];
      else break;
    }
    headingTargets.forEach(function (item) {
      item.link.classList.toggle('active', item === current);
    });
  }

  collectHeadings();
  if (headingTargets.length) updateActiveToc();

  /* 目录平滑跳转（补偿固定头高度） */
  $$('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var href = link.getAttribute('href');
      if (!href || href === '#') return;
      var id = decodeURIComponent(href.slice(1));
      var target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      var top = target.getBoundingClientRect().top + window.scrollY - 76;
      window.scrollTo({ top: top, behavior: reduceMotion ? 'auto' : 'smooth' });
      history.replaceState(null, '', href);
      if (document.body.classList.contains('toc-mobile-open')) {
        document.body.classList.remove('toc-mobile-open');
      }
    });
  });

  /* 移动端目录浮层 */
  var tocToggle = $('#toc-toggle');
  if (tocToggle) {
    tocToggle.classList.add('is-visible');
    tocToggle.addEventListener('click', function () {
      document.body.classList.toggle('toc-mobile-open');
    });
  }

  /* ---------------- 6. 代码块复制 ---------------- */
  $$('.article-content .highlight').forEach(function (block) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'code-copy';
    btn.textContent = '复制';
    btn.setAttribute('aria-label', '复制代码');
    btn.addEventListener('click', function () {
      var codeEl = block.querySelector('.code pre') || block.querySelector('pre');
      if (!codeEl) return;
      var text = codeEl.innerText.replace(/\n$/, '');
      var done = function () {
        btn.textContent = '已复制';
        btn.classList.add('is-copied');
        setTimeout(function () {
          btn.textContent = '复制';
          btn.classList.remove('is-copied');
        }, 1600);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, fallback);
      } else {
        fallback();
      }
      function fallback() {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); done(); } catch (e) {}
        document.body.removeChild(ta);
      }
    });
    block.appendChild(btn);
  });

  /* ---------------- 7. 站内搜索 ---------------- */
  (function initSearch() {
    var modal = $('#search-modal');
    if (!modal) return;
    var openBtn = $('#search-open');
    var input = $('#search-input');
    var resultsBox = $('#search-results');
    var indexUrl = modal.getAttribute('data-index') || '/search.json';
    var index = null;
    var loading = null;
    var activeIndex = -1;

    function normalize(s) {
      return String(s || '').toLowerCase().replace(/\s+/g, ' ');
    }

    function loadIndex() {
      if (index) return Promise.resolve(index);
      if (loading) return loading;
      loading = fetch(indexUrl, { credentials: 'same-origin' })
        .then(function (r) { return r.ok ? r.json() : []; })
        .then(function (data) {
          index = Array.isArray(data) ? data : [];
          return index;
        })
        .catch(function () {
          index = [];
          return index;
        });
      return loading;
    }

    function escapeHtml(s) {
      return String(s).replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
      });
    }

    function highlight(text, term) {
      var safe = escapeHtml(text);
      if (!term) return safe;
      var re = new RegExp('(' + term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
      return safe.replace(re, '<mark>$1</mark>');
    }

    function search(term) {
      var q = normalize(term).trim();
      if (!q) return [];
      if (!index) return [];
      var scored = [];
      index.forEach(function (post) {
        var title = normalize(post.title);
        var cats = normalize((post.categories || []).join(' '));
        var tags = normalize((post.tags || []).join(' '));
        var text = normalize(post.text);
        var score = 0;
        if (title.indexOf(q) !== -1) score += 12;
        if (cats.indexOf(q) !== -1) score += 5;
        if (tags.indexOf(q) !== -1) score += 4;
        var textHits = text.split(q).length - 1;
        if (textHits > 0) score += Math.min(6, textHits);
        if (score > 0) scored.push({ post: post, score: score, hits: textHits });
      });
      return scored.sort(function (a, b) { return b.score - a.score; }).slice(0, 12);
    }

    function render(term) {
      var list = search(term);
      activeIndex = -1;
      if (!term.trim()) {
        resultsBox.innerHTML = '<p class="search-hint">输入关键词开始搜索，支持标题、摘要与分类。</p>';
        return;
      }
      if (!list.length) {
        resultsBox.innerHTML = '<p class="search-hint">没有找到与「' + escapeHtml(term) + '」相关的文章。</p>';
        return;
      }
      var html = '';
      list.forEach(function (item, i) {
        var p = item.post;
        var excerpt = '';
        if (item.hits > 0 && p.text) {
          var idx = normalize(p.text).indexOf(normalize(term));
          var start = Math.max(0, idx - 30);
          excerpt = p.text.slice(start, start + 110);
          if (start > 0) excerpt = '…' + excerpt;
        }
        html += '<a class="search-result' + (i === 0 ? ' is-active' : '') + '" href="' + p.url + '">' +
          '<span class="search-result-title">' + highlight(p.title, term) + '</span>' +
          '<span class="search-result-meta">' + (p.date || '') +
          ((p.categories && p.categories.length) ? ' · ' + escapeHtml(p.categories.join(' / ')) : '') +
          '</span>' +
          (excerpt ? '<p class="search-result-excerpt">' + highlight(excerpt, term) + '</p>' : '') +
          '</a>';
      });
      resultsBox.innerHTML = html;
      activeIndex = 0;
    }

    function open() {
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      loadIndex();
      setTimeout(function () { input.focus(); input.select(); }, 60);
    }

    function close() {
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      if (openBtn) openBtn.focus({ preventScroll: true });
    }

    function move(dir) {
      var items = $$('.search-result', resultsBox);
      if (!items.length) return;
      activeIndex = (activeIndex + dir + items.length) % items.length;
      items.forEach(function (el, i) { el.classList.toggle('is-active', i === activeIndex); });
      items[activeIndex].scrollIntoView({ block: 'nearest' });
    }

    var debounce;
    if (input) {
      input.addEventListener('input', function () {
        clearTimeout(debounce);
        var value = input.value;
        debounce = setTimeout(function () {
          if (!index && value.trim()) loadIndex().then(function () { render(value); });
          else render(value);
        }, 120);
      });

      input.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
        else if (e.key === 'Enter') {
          var current = $('.search-result.is-active', resultsBox);
          if (current) window.location.href = current.getAttribute('href');
        }
      });
    }

    if (openBtn) openBtn.addEventListener('click', open);
    $$('[data-search-close]', modal).forEach(function (el) { el.addEventListener('click', close); });

    document.addEventListener('keydown', function (e) {
      var isOpen = modal.classList.contains('is-open');
      if (e.key === 'Escape' && isOpen) { close(); return; }
      var typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);
      if (!typing && (e.key === '/' || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k'))) {
        e.preventDefault();
        if (!isOpen) open();
      }
    });
  })();

  requestScroll();
})();
