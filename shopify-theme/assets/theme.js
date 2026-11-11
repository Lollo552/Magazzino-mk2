/* Bottega — theme scripts (no dependencies) */
(function () {
  'use strict';

  var routes = (window.theme && window.theme.routes) || {};
  var strings = (window.theme && window.theme.strings) || {};

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  function debounce(fn, wait) {
    var t;
    return function () {
      var args = arguments, self = this;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(self, args); }, wait);
    };
  }

  /* ---------- Toast ---------- */
  var toastTimer;
  function toast(html) {
    var el = $('#Toast');
    if (!el) return;
    el.innerHTML = html;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.hidden = true; }, 4000);
  }

  function updateCartCount(count) {
    $$('[data-cart-count]').forEach(function (el) {
      el.textContent = count;
      el.classList.toggle('is-empty', count === 0);
    });
  }

  /* ---------- Announcement bar rotation ---------- */
  $$('.announcement-bar[data-rotate]').forEach(function (bar) {
    var items = $$('.announcement-bar__item', bar);
    var i = 0;
    var seconds = parseInt(bar.getAttribute('data-rotate'), 10) || 5;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    setInterval(function () {
      items[i].classList.remove('is-active');
      i = (i + 1) % items.length;
      items[i].classList.add('is-active');
    }, seconds * 1000);
  });

  /* ---------- Mobile menu ---------- */
  var toggle = $('[data-menu-toggle]');
  var mobileNav = $('[data-mobile-nav]');
  if (toggle && mobileNav) {
    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      mobileNav.hidden = open;
    });
  }

  /* ---------- Close <details> dropdowns on outside click / Escape ---------- */
  document.addEventListener('click', function (e) {
    $$('.nav__dropdown[open], .facet[open], [data-search][open]').forEach(function (d) {
      if (!d.contains(e.target)) d.removeAttribute('open');
    });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    $$('details[open]').forEach(function (d) {
      if (d.classList.contains('accordion')) return;
      d.removeAttribute('open');
      var s = $('summary', d); if (s) s.focus();
    });
  });

  /* ---------- Predictive search ---------- */
  var searchDetails = $('[data-search]');
  if (searchDetails) {
    var input = $('[data-predictive-input]', searchDetails);
    var results = $('[data-predictive-results]', searchDetails);
    searchDetails.addEventListener('toggle', function () {
      if (searchDetails.open && input) input.focus();
    });
    if (input && results && routes.predictive_search_url) {
      input.addEventListener('input', debounce(function () {
        var q = input.value.trim();
        if (q.length < 2) { results.innerHTML = ''; return; }
        var url = routes.predictive_search_url + '?q=' + encodeURIComponent(q) +
          '&resources[type]=product&resources[limit]=6&section_id=predictive-search';
        fetch(url)
          .then(function (r) { return r.ok ? r.text() : ''; })
          .then(function (html) {
            var doc = new DOMParser().parseFromString(html, 'text/html');
            var content = doc.querySelector('.predictive');
            results.innerHTML = content ? content.outerHTML : '';
          })
          .catch(function () { results.innerHTML = ''; });
      }, 250));
    }
  }

  /* ---------- Quantity steppers ---------- */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-qty-minus], [data-qty-plus]');
    if (!btn) return;
    var wrap = btn.closest('[data-quantity]');
    var field = wrap && $('input', wrap);
    if (!field) return;
    var min = parseInt(field.min, 10);
    if (isNaN(min)) min = 0;
    var val = parseInt(field.value, 10) || 0;
    val = btn.hasAttribute('data-qty-plus') ? val + 1 : Math.max(min, val - 1);
    field.value = val;
    field.dispatchEvent(new Event('change', { bubbles: true }));
  });

  /* ---------- Product page ---------- */
  $$('[data-product-section]').forEach(function (section) {
    var jsonEl = $('[data-product-json]', section);
    var data = jsonEl ? JSON.parse(jsonEl.textContent) : { variants: [] };
    var form = $('.product-form', section);
    var mainImg = $('.product__main-media img', section);

    function setMainImage(src, srcset, alt, mediaId) {
      if (!mainImg || !src) return;
      mainImg.src = src;
      if (srcset) mainImg.srcset = srcset; else mainImg.removeAttribute('srcset');
      if (alt) mainImg.alt = alt;
      $$('[data-thumb]', section).forEach(function (t) {
        t.classList.toggle('is-active', String(t.getAttribute('data-media-id')) === String(mediaId));
      });
    }

    $$('[data-thumb]', section).forEach(function (thumb) {
      thumb.addEventListener('click', function () {
        setMainImage(thumb.getAttribute('data-src'), thumb.getAttribute('data-srcset'), thumb.getAttribute('data-alt'), thumb.getAttribute('data-media-id'));
      });
    });

    if (!form) return;
    var idInput = $('[data-variant-id]', form);
    var addBtn = $('[data-add-button]', form);
    var errorEl = $('[data-form-error]', form);
    var fieldsets = $$('.variant-picker[data-option-index]', form);

    function selectedOptions() {
      return fieldsets.map(function (fs) {
        var checked = $('input:checked', fs);
        return checked ? checked.value : null;
      });
    }

    function markUnavailable(current) {
      fieldsets.forEach(function (fs, idx) {
        $$('input[data-option]', fs).forEach(function (input) {
          var opts = current.slice(); opts[idx] = input.value;
          var match = data.variants.find(function (v) {
            return v.options.every(function (o, i) { return o === opts[i]; });
          });
          var label = input.nextElementSibling;
          if (label) label.classList.toggle('is-unavailable', !match || !match.available);
        });
      });
    }

    function onVariantChange() {
      var opts = selectedOptions();
      var variant = data.variants.find(function (v) {
        return v.options.every(function (o, i) { return o === opts[i]; });
      });
      fieldsets.forEach(function (fs, i) {
        var label = $('[data-selected-value]', fs);
        if (label) label.textContent = opts[i] || '';
      });
      markUnavailable(opts);

      if (!variant) {
        addBtn.disabled = true;
        addBtn.textContent = strings.unavailable;
        return;
      }
      idInput.value = variant.id;
      addBtn.disabled = !variant.available;
      addBtn.textContent = variant.available ? strings.addToCart : strings.soldOut;

      var cur = $('[data-price-current]', section);
      var cmp = $('[data-price-compare]', section);
      var priceWrap = $('[data-price]', section);
      if (cur) cur.innerHTML = variant.price;
      if (priceWrap) priceWrap.classList.toggle('price--on-sale', !!variant.compare_at_price);
      if (variant.compare_at_price) {
        if (!cmp) {
          cmp = document.createElement('s');
          cmp.className = 'price__compare';
          cmp.setAttribute('data-price-compare', '');
          cur.after(cmp);
        }
        cmp.innerHTML = variant.compare_at_price;
        cmp.hidden = false;
      } else if (cmp) {
        cmp.hidden = true;
      }

      if (variant.featured_media) {
        setMainImage(variant.featured_media.src, null, null, variant.featured_media.id);
      }

      var url = new URL(window.location.href);
      url.searchParams.set('variant', variant.id);
      window.history.replaceState({}, '', url.toString());
    }

    if (fieldsets.length) {
      form.addEventListener('change', function (e) {
        if (e.target.matches('input[data-option]')) onVariantChange();
      });
      markUnavailable(selectedOptions());
    }

    form.addEventListener('submit', function (e) {
      if (!window.fetch || !routes.cart_add_url) return;
      e.preventDefault();
      if (errorEl) errorEl.hidden = true;
      addBtn.classList.add('is-loading');
      addBtn.setAttribute('aria-busy', 'true');

      fetch(routes.cart_add_url + '.js', {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        body: new FormData(form)
      })
        .then(function (r) { return r.json().then(function (json) { return { ok: r.ok, json: json }; }); })
        .then(function (res) {
          if (!res.ok) throw new Error(res.json.description || res.json.message || 'Error');
          return fetch(routes.cart_url + '.js').then(function (r) { return r.json(); });
        })
        .then(function (cart) {
          updateCartCount(cart.item_count);
          toast(strings.added + ' &middot; <a href="' + routes.cart_url + '">' + strings.viewCart + ' &rarr;</a>');
        })
        .catch(function (err) {
          if (errorEl) { errorEl.textContent = err.message; errorEl.hidden = false; }
        })
        .finally(function () {
          addBtn.classList.remove('is-loading');
          addBtn.removeAttribute('aria-busy');
        });
    });
  });

  /* ---------- Share ---------- */
  $$('[data-share]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var url = btn.getAttribute('data-url');
      var title = btn.getAttribute('data-title');
      if (navigator.share) {
        navigator.share({ title: title, url: url }).catch(function () {});
      } else if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(function () { toast(url); });
      }
    });
  });

  /* ---------- Product recommendations ---------- */
  $$('[data-recommendations]').forEach(function (el) {
    var url = el.getAttribute('data-url');
    if (!url) return;
    var load = function () {
      fetch(url)
        .then(function (r) { return r.text(); })
        .then(function (html) {
          var doc = new DOMParser().parseFromString(html, 'text/html');
          var fresh = doc.querySelector('[data-recommendations]');
          if (fresh && fresh.innerHTML.trim()) el.innerHTML = fresh.innerHTML;
        })
        .catch(function () {});
    };
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) { io.disconnect(); load(); }
      }, { rootMargin: '0px 0px 400px 0px' });
      io.observe(el);
    } else {
      load();
    }
  });

  /* ---------- Collection filters: auto-submit ---------- */
  $$('[data-facets]').forEach(function (form) {
    form.addEventListener('change', function (e) {
      if (e.target.matches('[data-facet-input]')) form.submit();
    });
  });

  /* ---------- Cart page: update quantities via AJAX, then refresh section ---------- */
  var cartSection = $('[data-cart-section]');
  if (cartSection && routes.cart_change_url) {
    var refreshCart = function () {
      var sectionId = cartSection.closest('.shopify-section');
      var id = sectionId ? sectionId.id.replace('shopify-section-', '') : null;
      if (!id) { window.location.reload(); return; }
      fetch(window.location.pathname + '?section_id=' + id)
        .then(function (r) { return r.text(); })
        .then(function (html) {
          var doc = new DOMParser().parseFromString(html, 'text/html');
          var fresh = doc.querySelector('[data-cart-section]');
          if (fresh) cartSection.innerHTML = fresh.innerHTML;
          cartSection.classList.remove('is-updating');
        });
    };

    var changeLine = function (line, quantity) {
      cartSection.classList.add('is-updating');
      fetch(routes.cart_change_url + '.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ line: line, quantity: quantity })
      })
        .then(function (r) { return r.json(); })
        .then(function (cart) {
          updateCartCount(cart.item_count || 0);
          refreshCart();
        })
        .catch(function () { window.location.reload(); });
    };

    cartSection.addEventListener('change', debounce(function (e) {
      var input = e.target.closest('[data-cart-qty]');
      if (!input) return;
      changeLine(parseInt(input.getAttribute('data-line'), 10), Math.max(0, parseInt(input.value, 10) || 0));
    }, 350));

    cartSection.addEventListener('click', function (e) {
      var remove = e.target.closest('[data-cart-remove]');
      if (!remove) return;
      e.preventDefault();
      changeLine(parseInt(remove.getAttribute('data-line'), 10), 0);
    });

    var note = null;
    cartSection.addEventListener('input', debounce(function (e) {
      if (e.target.id !== 'CartNote') return;
      note = e.target.value;
      fetch(routes.cart_url + '/update.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: note })
      });
    }, 500));
  }

  /* ---------- Customer login: toggle recover password ---------- */
  var recover = $('[data-recover]');
  var login = $('[data-login]');
  if (recover && login) {
    var showRecover = function (show) {
      recover.hidden = !show;
      login.hidden = show;
    };
    if (window.location.hash === '#recover' || $('[data-recover-success]')) showRecover(true);
    $$('[data-toggle-recover]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        showRecover(recover.hidden);
      });
    });
  }

  /* ---------- Address forms: preselect country, confirm delete ---------- */
  $$('select[name="address[country]"]').forEach(function (select) {
    var def = select.getAttribute('data-default');
    if (def) select.value = def;
  });
  $$('form[data-confirm]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      if (!window.confirm(form.getAttribute('data-confirm'))) e.preventDefault();
    });
  });
})();
