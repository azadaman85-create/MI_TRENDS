/**
 * MI TRENDS storefront behaviour.
 *
 * Replaces the React state of the Next.js app (StoreProvider, CartDrawer,
 * SearchOverlay, MobileNav, Toast, the home carousel and the product page)
 * with plain DOM code. Server endpoints are provided by MI Trends Core:
 *   admin-ajax.php  mi_add_to_cart, mi_quick_add, mi_update_cart_item,
 *                   mi_toggle_wishlist, mi_subscribe, mi_contact, mi_refresh
 *   REST            mi-trends/v1/search, mi-trends/v1/track-order
 * Every page works without this file; it adds the in-place behaviour.
 */
(function () {
  "use strict";

  var CONFIG = window.MI_TRENDS || {};
  var I18N = CONFIG.i18n || {};
  var doc = document;

  function $(selector, root) { return (root || doc).querySelector(selector); }
  function $$(selector, root) { return Array.prototype.slice.call((root || doc).querySelectorAll(selector)); }
  function format(text) {
    var args = Array.prototype.slice.call(arguments, 1);
    var i = 0;
    return String(text || "")
      .replace(/%(\d)\$[sd]/g, function (_, n) { return args[Number(n) - 1]; })
      .replace(/%[sd]/g, function () { return args[i++]; });
  }

  /* ------------------------------------------------------------------ */
  /* Requests                                                            */
  /* ------------------------------------------------------------------ */

  function ajax(action, data) {
    var body = new FormData();
    body.append("action", action);
    body.append("nonce", CONFIG.nonce || "");
    Object.keys(data || {}).forEach(function (key) { body.append(key, data[key]); });
    return fetch(CONFIG.ajaxUrl, { method: "POST", body: body, credentials: "same-origin" })
      .then(function (response) { return response.json(); })
      .then(function (json) {
        var payload = json && json.data ? json.data : {};
        applyServerState(payload);
        if (!json || !json.success) {
          var error = new Error(payload.message || I18N.genericError);
          error.payload = payload;
          throw error;
        }
        return payload;
      });
  }

  function rest(path, options) {
    options = options || {};
    var headers = { "X-WP-Nonce": CONFIG.restNonce || "" };
    if (options.body) headers["Content-Type"] = "application/json";
    return fetch(CONFIG.restUrl + path, {
      method: options.method || "GET",
      headers: headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
      credentials: "same-origin",
    }).then(function (response) {
      return response.json().then(function (json) {
        if (!response.ok) {
          var error = new Error((json && json.message) || I18N.genericError);
          error.data = json;
          throw error;
        }
        return json;
      });
    });
  }

  /** Fragments + counts returned by every cart/wishlist endpoint. */
  function applyServerState(payload) {
    if (!payload) return;
    var fragments = payload.fragments || {};
    Object.keys(fragments).forEach(function (selector) {
      if (selector.charAt(0) === "m" && selector.indexOf("mi_") === 0) return; // data, not markup
      $$(selector).forEach(function (node) {
        var holder = doc.createElement("div");
        holder.innerHTML = fragments[selector];
        var fresh = holder.firstElementChild;
        if (fresh) node.replaceWith(fresh);
      });
    });
    if (typeof fragments.mi_cart_count !== "undefined") setCount("cart", fragments.mi_cart_count);
    if (payload.counts) {
      if (typeof payload.counts.cart !== "undefined") setCount("cart", payload.counts.cart);
      if (typeof payload.counts.wishlist !== "undefined") setCount("wishlist", payload.counts.wishlist);
    }
  }

  function setCount(kind, value) {
    value = Number(value) || 0;
    $$('[data-mi-count="' + kind + '"]').forEach(function (badge) {
      var capped = badge.classList.contains("mobile-tab-badge") && value > 99 ? "99+" : String(value);
      badge.textContent = capped;
      badge.hidden = value === 0;
    });
  }

  /* ------------------------------------------------------------------ */
  /* Toast — components/Toast.tsx                                         */
  /* ------------------------------------------------------------------ */

  var toastTimer = null;
  var TOAST_ICONS = {
    success: '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
    error: '<circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
  };

  function svg(inner, size, cls) {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"' + (cls ? ' class="' + cls + '"' : "") + ' aria-hidden="true">' + inner + "</svg>";
  }

  function dismissToast() {
    var existing = $(".toast");
    if (existing) existing.remove();
    window.clearTimeout(toastTimer);
  }

  function showToast(message, tone) {
    if (!message) return;
    tone = tone || "success";
    dismissToast();
    var root = $("[data-mi-toast-root]") || doc.body;
    var toast = doc.createElement("div");
    toast.className = "toast toast-" + tone;
    toast.setAttribute("role", tone === "error" ? "alert" : "status");
    toast.setAttribute("aria-live", tone === "error" ? "assertive" : "polite");
    toast.setAttribute("aria-atomic", "true");
    toast.innerHTML =
      svg(TOAST_ICONS[tone] || TOAST_ICONS.info, 20, "toast-icon") +
      "<p></p>" +
      '<button class="icon-button toast-close" type="button" aria-label="Dismiss notification">' +
      svg('<path d="M18 6 6 18"/><path d="m6 6 12 12"/>', 17) +
      "</button>" +
      '<span class="toast-timer" aria-hidden="true"></span>';
    toast.querySelector("p").textContent = message;
    toast.querySelector(".toast-close").addEventListener("click", dismissToast);
    root.appendChild(toast);
    toastTimer = window.setTimeout(dismissToast, 3600);
  }

  window.MITrendsToast = showToast;

  /* ------------------------------------------------------------------ */
  /* Overlays — cart drawer, search, mobile nav, size guide               */
  /* ------------------------------------------------------------------ */

  var current = null; // { name, layer, restore, returnFocus }

  function focusFirst(container) {
    var target = $("[data-mi-close]", container) || $("input, button, a", container);
    if (target) window.setTimeout(function () { target.focus(); }, 0);
  }

  function closeOverlay() {
    if (!current) return;
    var overlay = current;
    current = null;
    overlay.restore();
    syncTabs();
    if (overlay.returnFocus && overlay.returnFocus.focus) overlay.returnFocus.focus();
  }

  function mountFromTemplate(name) {
    var template = $('template[data-mi-template="' + name + '"]');
    if (!template) return null;
    var fragment = template.content.cloneNode(true);
    var layer = fragment.firstElementChild;
    doc.body.appendChild(fragment);
    return layer;
  }

  function openOverlay(name, trigger) {
    if (current && current.name === name) return;
    closeOverlay();

    var layer;
    var restore;

    if (name === "cart") {
      var source = $('[data-mi-source="cart"]');
      if (!source) {
        window.location.href = CONFIG.cartUrl;
        return;
      }
      var drawer = source.firstElementChild;
      layer = doc.createElement("div");
      layer.className = "drawer-layer cart-drawer-layer";
      layer.setAttribute("role", "presentation");
      layer.appendChild(drawer);
      doc.body.appendChild(layer);
      restore = function () { source.appendChild(drawer); layer.remove(); };
    } else {
      layer = mountFromTemplate(name);
      if (!layer) return;
      restore = function () { layer.remove(); };
      if (name === "search") initSearch(layer);
    }

    // Clicking the dimmed backdrop (the layer itself) closes, like the React onMouseDown check.
    layer.addEventListener("mousedown", function (event) {
      if (event.target === layer) closeOverlay();
    });

    current = { name: name, layer: layer, restore: restore, returnFocus: trigger || doc.activeElement };
    syncTabs();
    if (name === "search") {
      var input = $("input[type=search]", layer);
      window.setTimeout(function () { if (input) input.focus(); }, 0);
    } else {
      focusFirst(layer);
    }
  }

  /** Active state of the Search and Bag tabs follows the open overlay. */
  function syncTabs() {
    $$("[data-mi-tab]").forEach(function (tab) {
      var on = !!current && current.name === tab.getAttribute("data-mi-tab");
      if (tab.getAttribute("data-mi-tab") === "cart" && !current && tab.classList.contains("is-cart-page")) on = true;
      tab.classList.toggle("is-active", on);
      var indicator = $(".mobile-tab-indicator", tab);
      if (indicator) indicator.hidden = !on;
      var icon = $("svg", tab);
      if (icon) icon.setAttribute("stroke-width", on ? "2.4" : "1.9");
    });
  }

  doc.addEventListener("click", function (event) {
    var opener = event.target.closest("[data-mi-open]");
    if (opener) {
      event.preventDefault();
      openOverlay(opener.getAttribute("data-mi-open"), opener);
      return;
    }
    if (event.target.closest("[data-mi-close]")) {
      event.preventDefault();
      closeOverlay();
    }
  });

  doc.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && current) {
      closeOverlay();
      return;
    }
    // "/" opens search, unless the shopper is typing — SearchOverlay.tsx.
    var target = event.target;
    var typing = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT" || target.isContentEditable);
    if (event.key === "/" && !typing && !event.metaKey && !event.ctrlKey) {
      event.preventDefault();
      openOverlay("search");
    }
  });

  // Links inside an overlay navigate; close first so focus/scroll restore cleanly.
  doc.addEventListener("click", function (event) {
    if (!current) return;
    var link = event.target.closest("a[href]");
    if (link && current.layer.contains(link)) closeOverlay();
  });

  /* ------------------------------------------------------------------ */
  /* Search — live suggestions                                            */
  /* ------------------------------------------------------------------ */

  function initSearch(layer) {
    var form = $("[data-mi-search-form]", layer);
    var input = $("input[type=search]", layer);
    var clear = $("[data-mi-search-clear]", layer);
    var list = $("[data-mi-search-list]", layer);
    var heading = $("[data-mi-search-heading]", layer);
    var all = $("[data-mi-search-all]", layer);
    var empty = $("[data-mi-search-empty]", layer);
    var rowTemplate = $('template[data-mi-template="search-suggestion"]');
    var popular = list.innerHTML;
    var timer = null;
    var serial = 0;

    function render(items, query) {
      if (!query) {
        list.innerHTML = popular;
        heading.textContent = I18N.popular;
        all.hidden = true;
        empty.hidden = true;
        list.hidden = false;
        return;
      }
      heading.textContent = format(items.length === 1 ? I18N.matchOne : I18N.matchMany, items.length);
      all.hidden = items.length === 0;
      empty.hidden = items.length > 0;
      list.hidden = items.length === 0;
      list.innerHTML = "";
      items.slice(0, 6).forEach(function (item) {
        var row = rowTemplate.content.firstElementChild.cloneNode(true);
        $('[data-mi-field="url"]', row).href = item.url;
        var art = $('[data-mi-field="art"]', row);
        art.setAttribute("aria-label", item.name + " product artwork");
        var img = $('[data-mi-field="image"]', row);
        if (item.image) {
          img.src = item.image;
        } else {
          img.remove();
          art.style.background = "linear-gradient(145deg, " + item.palette[0] + ", " + item.palette[1] + " 58%, " + item.palette[2] + ")";
          var label = doc.createElement("span");
          label.setAttribute("aria-hidden", "true");
          label.textContent = item.art || "";
          art.appendChild(label);
        }
        $('[data-mi-field="collection"]', row).textContent = item.collection;
        $('[data-mi-field="name"]', row).textContent = item.name;
        $('[data-mi-field="type"]', row).textContent = item.type;
        $('[data-mi-field="price"]', row).textContent = item.price_formatted;
        list.appendChild(row);
      });
    }

    function run() {
      var query = input.value.trim();
      clear.hidden = !input.value;
      if (!query) { render([], ""); return; }
      var mine = ++serial;
      rest("search?q=" + encodeURIComponent(query))
        .then(function (data) { if (mine === serial) render(data.items || [], query); })
        .catch(function () { if (mine === serial) render([], query); });
    }

    input.addEventListener("input", function () {
      window.clearTimeout(timer);
      timer = window.setTimeout(run, 160);
    });
    clear.addEventListener("click", function () { input.value = ""; run(); input.focus(); });
    $$("[data-mi-search-chip]", layer).forEach(function (chip) {
      chip.addEventListener("click", function () {
        input.value = chip.getAttribute("data-mi-search-chip");
        run();
        input.focus();
      });
    });
    all.addEventListener("click", function () {
      if (form.requestSubmit) form.requestSubmit();
      else form.submit();
    });
    form.addEventListener("submit", function (event) {
      if (!input.value.trim()) event.preventDefault();
    });
  }

  /* ------------------------------------------------------------------ */
  /* Wishlist, quick add, drawer quantities                               */
  /* ------------------------------------------------------------------ */

  function paintWishlist(id, on) {
    $$('[data-mi-wishlist="' + id + '"]').forEach(function (button) {
      if (button.hasAttribute("data-mi-wishlist-remove")) return;
      button.classList.toggle("is-active", on && button.classList.contains("product-card__wishlist"));
      button.classList.toggle("saved", on && button.classList.contains("gallery-heart"));
      button.classList.toggle("is-saved", on && button.classList.contains("mobile-buy-wishlist"));
      if (button.hasAttribute("aria-pressed")) button.setAttribute("aria-pressed", on ? "true" : "false");
      var heart = $("svg", button);
      if (heart) heart.setAttribute("fill", on ? "currentColor" : "none");
    });
  }

  doc.addEventListener("click", function (event) {
    var heart = event.target.closest("[data-mi-wishlist]");
    if (!heart) return;
    event.preventDefault();
    event.stopPropagation();
    var id = heart.getAttribute("data-mi-wishlist");
    ajax("mi_toggle_wishlist", { product_id: id })
      .then(function (data) {
        paintWishlist(id, !!data.wishlisted);
        showToast(data.message, data.wishlisted ? "success" : "info");
        if (heart.hasAttribute("data-mi-wishlist-remove") || (!data.wishlisted && heart.closest("[data-mi-saved-card]"))) {
          var card = heart.closest("[data-mi-saved-card]");
          if (card) card.remove();
          if (!$("[data-mi-saved-card]")) window.location.reload();
        }
      })
      .catch(function (error) { showToast(error.message, "error"); });
  });

  doc.addEventListener("click", function (event) {
    var button = event.target.closest("[data-mi-quick-add]");
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();
    button.disabled = true;
    ajax("mi_quick_add", { product_id: button.getAttribute("data-mi-quick-add") })
      .then(function (data) { showToast(data.message, "success"); openOverlay("cart"); })
      .catch(function (error) { showToast(error.message || I18N.unavailable, "error"); })
      .then(function () { button.disabled = false; });
  });

  doc.addEventListener("click", function (event) {
    var button = event.target.closest("[data-mi-cart-qty]");
    if (!button) return;
    event.preventDefault();
    var quantity = Number(button.getAttribute("data-mi-cart-qty"));
    button.disabled = true;
    ajax("mi_update_cart_item", { cart_item_key: button.getAttribute("data-mi-key"), quantity: quantity })
      .then(function (data) { if (data.message) showToast(data.message, "info"); })
      .catch(function (error) { showToast(error.message, "error"); button.disabled = false; });
  });

  /* ------------------------------------------------------------------ */
  /* Back to top — Footer.tsx                                             */
  /* ------------------------------------------------------------------ */

  var backToTop = $("[data-mi-back-to-top]");
  if (backToTop) {
    var onScroll = function () { backToTop.hidden = window.scrollY <= 700; };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    backToTop.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });
  }

  /* ------------------------------------------------------------------ */
  /* Home — hero carousel, feed tabs, coupon copy                         */
  /* ------------------------------------------------------------------ */

  var hero = $("[data-mi-hero]");
  if (hero) {
    var track = $(".hero-track", hero);
    var slides = $$(".hero-slide", hero);
    var dots = $$("[data-mi-hero-go]", hero);
    var active = 0;
    var paused = false;
    var timer = null;
    var touchStart = null;

    var paint = function () {
      track.style.transform = "translateX(-" + active * 100 + "%)";
      slides.forEach(function (slide, index) {
        slide.setAttribute("aria-hidden", index === active ? "false" : "true");
        var cta = $(".hero-copy .button", slide);
        if (cta) cta.tabIndex = index === active ? 0 : -1;
      });
      dots.forEach(function (dot, index) {
        dot.setAttribute("aria-selected", index === active ? "true" : "false");
        var bar = $("span", dot);
        bar.style.transform = "scaleX(0)";
        if (index === active && !paused) {
          bar.getBoundingClientRect(); // forces a reflow so the progress transition restarts
          bar.style.transform = "scaleX(1)";
        }
      });
    };
    var restart = function () {
      window.clearInterval(timer);
      if (!paused) timer = window.setInterval(function () { active = (active + 1) % slides.length; paint(); }, 5500);
    };
    var move = function (step) { active = (active + step + slides.length) % slides.length; paint(); restart(); };
    var setPaused = function (value) { paused = value; paint(); restart(); };

    $$("[data-mi-hero-move]", hero).forEach(function (button) {
      button.addEventListener("click", function () { move(Number(button.getAttribute("data-mi-hero-move"))); });
    });
    dots.forEach(function (dot) {
      dot.addEventListener("click", function () { active = Number(dot.getAttribute("data-mi-hero-go")); paint(); restart(); });
    });
    hero.addEventListener("mouseenter", function () { setPaused(true); });
    hero.addEventListener("mouseleave", function () { setPaused(false); });
    hero.addEventListener("focusin", function () { setPaused(true); });
    hero.addEventListener("focusout", function () { setPaused(false); });
    hero.addEventListener("touchstart", function (event) { touchStart = event.touches[0] ? event.touches[0].clientX : null; }, { passive: true });
    hero.addEventListener("touchend", function (event) {
      if (touchStart === null) return;
      var end = event.changedTouches[0] ? event.changedTouches[0].clientX : touchStart;
      var delta = end - touchStart;
      if (Math.abs(delta) > 50) move(delta > 0 ? -1 : 1);
      touchStart = null;
    });
    paint();
    restart();
  }

  $$("[data-mi-feed]").forEach(function (feed) {
    var tabs = $$("[data-mi-feed-tab]", feed);
    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        var key = tab.getAttribute("data-mi-feed-tab");
        tabs.forEach(function (other) {
          var on = other === tab;
          other.classList.toggle("is-active", on);
          other.setAttribute("aria-selected", on ? "true" : "false");
        });
        $$("[data-mi-feed-panel]", feed).forEach(function (panel) {
          panel.hidden = panel.getAttribute("data-mi-feed-panel") !== key;
        });
      });
    });
  });

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text);
    return Promise.reject(new Error("Clipboard unavailable"));
  }

  $$("[data-mi-copy-coupon]").forEach(function (button) {
    button.addEventListener("click", function () {
      var code = button.getAttribute("data-mi-copy-coupon");
      copyText(code).then(function () {
        $('[data-mi-coupon-state="idle"]', button).hidden = true;
        $('[data-mi-coupon-state="done"]', button).hidden = false;
        showToast(format(I18N.copied, code));
        window.setTimeout(function () {
          $('[data-mi-coupon-state="idle"]', button).hidden = false;
          $('[data-mi-coupon-state="done"]', button).hidden = true;
        }, 2200);
      }).catch(function () {});
    });
  });

  $$("[data-mi-copy-order]").forEach(function (button) {
    button.addEventListener("click", function () {
      copyText(button.getAttribute("data-mi-copy-order")).then(function () {
        $('[data-mi-copy-state="idle"]', button).hidden = true;
        $('[data-mi-copy-state="done"]', button).hidden = false;
        showToast(I18N.orderCopied);
        window.setTimeout(function () {
          $('[data-mi-copy-state="idle"]', button).hidden = false;
          $('[data-mi-copy-state="done"]', button).hidden = true;
        }, 2000);
      }).catch(function () { showToast(I18N.copyFailed, "error"); });
    });
  });

  /* ------------------------------------------------------------------ */
  /* Product page                                                         */
  /* ------------------------------------------------------------------ */

  var pdp = $("[data-mi-pdp]");
  if (pdp) {
    var form = $("[data-mi-buy-form]", pdp);
    var mainVisual = $("[data-mi-main-visual]", pdp);
    var viewLabel = $("[data-mi-view-label]", pdp);
    var thumbs = $$("[data-mi-view]", pdp);
    var sizeBlock = $("[data-mi-size-block]", pdp);
    var sizeError = $("[data-mi-size-error]", pdp);
    var mobileSize = $("[data-mi-mobile-size]", pdp);
    var qtyLabel = $("[data-mi-qty]", pdp);
    var inputs = {
      variation: $("[data-mi-variation-id]", form),
      size: $("[data-mi-size-input]", form),
      color: $("[data-mi-color-input]", form),
      qty: $("[data-mi-qty-input]", form),
    };
    var quantity = 1;
    var busy = false;

    thumbs.forEach(function (thumb, index) {
      thumb.addEventListener("click", function () {
        thumbs.forEach(function (other) { other.classList.toggle("active", other === thumb); });
        $$(":scope > svg", mainVisual).forEach(function (visual, i) { visual.hidden = i !== index; });
        mainVisual.className = mainVisual.className.replace(/view-\d/, "view-" + index);
        if (viewLabel) viewLabel.textContent = $("span", thumb).textContent;
      });
    });

    $$("[data-mi-color]", pdp).forEach(function (swatch) {
      swatch.addEventListener("click", function () {
        $$("[data-mi-color]", pdp).forEach(function (other) {
          var on = other === swatch;
          other.classList.toggle("active", on);
          other.setAttribute("aria-pressed", on ? "true" : "false");
        });
        inputs.color.value = swatch.getAttribute("data-mi-color");
        $("[data-mi-color-name]", pdp).textContent = inputs.color.value;
      });
    });

    $$("[data-mi-size]", pdp).forEach(function (button) {
      button.addEventListener("click", function () {
        if (button.disabled) return;
        $$("[data-mi-size]", pdp).forEach(function (other) { other.classList.toggle("active", other === button); });
        inputs.size.value = button.getAttribute("data-mi-size-slug");
        inputs.variation.value = button.getAttribute("data-mi-variation");
        sizeError.hidden = true;
        if (mobileSize) mobileSize.textContent = format(I18N.sizeLabel, button.getAttribute("data-mi-size"));
      });
    });

    $$("[data-mi-qty-step]", pdp).forEach(function (button) {
      button.addEventListener("click", function () {
        quantity = Math.max(1, Math.min(5, quantity + Number(button.getAttribute("data-mi-qty-step"))));
        qtyLabel.textContent = quantity;
        inputs.qty.value = quantity;
      });
    });

    var ensureSize = function () {
      if (inputs.variation.value && inputs.variation.value !== "0") return true;
      sizeError.hidden = false;
      sizeBlock.scrollIntoView({ behavior: "smooth", block: "center" });
      return false;
    };

    var addToBag = function (buyNow) {
      if (busy || !ensureSize()) return;
      busy = true;
      ajax("mi_add_to_cart", {
        product_id: form.querySelector('[name="product_id"]').value,
        variation_id: inputs.variation.value,
        size: inputs.size.value,
        color: inputs.color.value,
        quantity: inputs.qty.value,
      })
        .then(function (data) {
          if (buyNow) { window.location.href = data.checkout_url || CONFIG.checkoutUrl; return; }
          showToast(data.message, "success");
          openOverlay("cart");
        })
        .catch(function (error) { showToast(error.message, "error"); })
        .then(function () { busy = false; });
    };

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var buyNow = event.submitter ? event.submitter.hasAttribute("data-mi-buy-now") : false;
      addToBag(buyNow);
    });
    var mobileAdd = $("[data-mi-mobile-add]", pdp);
    if (mobileAdd) mobileAdd.addEventListener("click", function () { addToBag(false); });

    // Pincode check — same estimate as the original: 3–4 days out, a 2-day window.
    var pinBox = $("[data-mi-pincode]", pdp);
    if (pinBox) {
      var pinInput = $("[data-mi-pincode-input]", pinBox);
      var pinMessage = $("[data-mi-pincode-message]", pinBox);
      pinInput.addEventListener("input", function () {
        pinInput.value = pinInput.value.replace(/\D/g, "").slice(0, 6);
        pinMessage.hidden = true;
      });
      $("[data-mi-pincode-check]", pinBox).addEventListener("click", function () {
        var pin = pinInput.value;
        pinMessage.hidden = false;
        if (!/^[1-9][0-9]{5}$/.test(pin)) {
          pinMessage.className = "pin-error";
          pinMessage.textContent = I18N.pincodeInvalid;
          return;
        }
        var from = new Date();
        from.setDate(from.getDate() + 3 + (Number(pin.slice(-1)) % 2));
        var to = new Date(from);
        to.setDate(to.getDate() + 2);
        var fmt = function (date) { return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" }); };
        pinMessage.className = "pin-success";
        pinMessage.textContent = format(I18N.deliveryRange, fmt(from), fmt(to));
      });
    }
  }

  /* ------------------------------------------------------------------ */
  /* Cart page                                                            */
  /* ------------------------------------------------------------------ */

  $$("[data-mi-coupon-hint]").forEach(function (chip) {
    chip.addEventListener("click", function () {
      var input = $("#coupon");
      if (input) { input.value = chip.getAttribute("data-mi-coupon-hint"); input.focus(); }
    });
  });
  var couponInput = $("#coupon");
  if (couponInput) couponInput.addEventListener("input", function () { couponInput.value = couponInput.value.toUpperCase(); });

  /* ------------------------------------------------------------------ */
  /* Shop sort                                                            */
  /* ------------------------------------------------------------------ */

  $$("[data-mi-sort] select").forEach(function (select) {
    select.addEventListener("change", function () { select.form.submit(); });
  });

  /* ------------------------------------------------------------------ */
  /* Forms — newsletter / notify-me, contact, track order                 */
  /* ------------------------------------------------------------------ */

  $$("[data-mi-subscribe]").forEach(function (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var email = form.querySelector('[name="email"]');
      if (!email.value.trim()) return;
      ajax("mi_subscribe", {
        email: email.value,
        source: form.querySelector('[name="source"]').value,
        mi_hp: form.querySelector('[name="mi_hp"]').value,
      })
        .then(function (data) { showToast(data.message || I18N.newsletter); form.reset(); })
        .catch(function (error) { showToast(error.message, "error"); });
    });
  });

  $$("[data-mi-contact]").forEach(function (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var data = {};
      ["name", "email", "order_id", "message", "mi_hp"].forEach(function (name) {
        var field = form.querySelector('[name="' + name + '"]');
        data[name] = field ? field.value : "";
      });
      $("[data-mi-contact-error]", form).hidden = true;
      ajax("mi_contact", data)
        .then(function (response) {
          $("[data-mi-contact-confirm]", form).hidden = false;
          showToast(response.message);
          form.reset();
        })
        .catch(function (error) {
          var box = $("[data-mi-contact-error]", form);
          box.textContent = error.message;
          box.hidden = false;
        });
    });
  });

  $$("[data-mi-track]").forEach(function (box) {
    var form = $("[data-mi-track-form]", box);
    var error = $("[data-mi-track-error]", box);
    var result = $("[data-mi-track-result]", box);
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var order = form.querySelector('[name="order"]').value.trim();
      var contact = form.querySelector('[name="contact"]').value.trim();
      error.hidden = true;
      result.hidden = true;
      rest("track-order", { method: "POST", body: { order: order, contact: contact } })
        .then(function (data) {
          $("[data-mi-track-id]", result).textContent = data.order;
          $("[data-mi-track-stage]", result).textContent = data.stage_label;
          var list = $("[data-mi-track-timeline]", result);
          list.innerHTML = "";
          data.stages.forEach(function (stage, index) {
            var li = doc.createElement("li");
            if (stage.done) li.className = "done";
            var badge = doc.createElement("span");
            if (stage.done) badge.innerHTML = svg('<path d="M20 6 9 17l-5-5"/>', 12);
            else badge.textContent = String(index + 1);
            var text = doc.createElement("p");
            text.textContent = stage.label;
            li.appendChild(badge);
            li.appendChild(text);
            list.appendChild(li);
          });
          $("[data-mi-track-note]", result).hidden = !!data.complete;
          var courier = $("[data-mi-track-courier]", result);
          courier.hidden = !data.tracking;
          courier.textContent = data.tracking || "";
          result.hidden = false;
        })
        .catch(function (err) {
          error.textContent = err.message;
          error.hidden = false;
        });
    });
    if (form.querySelector('[name="order"]').value) form.querySelector('[name="contact"]').focus();
  });

  /* ------------------------------------------------------------------ */
  /* Account — reveal password, strength, client-side checks              */
  /* ------------------------------------------------------------------ */

  $$("[data-mi-reveal]").forEach(function (button) {
    button.addEventListener("click", function () {
      var input = button.parentElement.querySelector("input");
      var show = input.type === "password";
      input.type = show ? "text" : "password";
      button.setAttribute("aria-pressed", show ? "true" : "false");
      button.setAttribute("aria-label", show ? "Hide password" : "Show password");
      button.innerHTML = show
        ? svg('<path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/>', 17)
        : svg('<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>', 17);
    });
  });

  $$("[data-mi-strength]").forEach(function (input) {
    var hint = input.closest(".acct__field").querySelector("[data-mi-strength-hint]");
    var labels = ["Too short", "Weak", "Fair", "Strong", "Very strong"];
    input.addEventListener("input", function () {
      var value = input.value;
      var score = 0;
      if (value.length >= 8) score += 1;
      if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score += 1;
      if (/[0-9]/.test(value)) score += 1;
      if (/[^A-Za-z0-9]/.test(value)) score += 1;
      hint.textContent = value ? "Password strength: " + labels[score] : "Use 8+ characters with a number or symbol.";
    });
  });

  var phone = $("#reg_phone");
  if (phone) phone.addEventListener("input", function () { phone.value = phone.value.replace(/\D/g, "").slice(0, 10); });

  function fieldError(input, message) {
    var field = input.closest(".acct__field");
    var existing = field.querySelector(".acct__error");
    if (existing) existing.remove();
    input.removeAttribute("aria-invalid");
    if (!message) return false;
    input.setAttribute("aria-invalid", "true");
    var span = doc.createElement("span");
    span.className = "acct__error";
    span.textContent = message;
    field.appendChild(span);
    return true;
  }

  $$("[data-mi-auth]").forEach(function (form) {
    var email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    form.addEventListener("submit", function (event) {
      var failed = false;
      if (form.getAttribute("data-mi-auth") === "signup") {
        var name = form.querySelector('[name="mi_name"]');
        var mail = form.querySelector('[name="email"]');
        var tel = form.querySelector('[name="billing_phone"]');
        var pass = form.querySelector('[name="password"]');
        failed = fieldError(name, name.value.trim().length < 2 ? "Tell us what to call you." : "") || failed;
        failed = fieldError(mail, !email.test(mail.value.trim()) ? "Enter a valid email address." : "") || failed;
        failed = fieldError(tel, !/^[6-9][0-9]{9}$/.test(tel.value) ? "Enter a valid 10-digit Indian mobile number." : "") || failed;
        if (pass) failed = fieldError(pass, pass.value.length < 8 ? "Use at least 8 characters." : "") || failed;
      } else {
        var user = form.querySelector('[name="username"]');
        var pw = form.querySelector('[name="password"]');
        failed = fieldError(user, !email.test(user.value.trim()) ? "Enter a valid email address." : "") || failed;
        failed = fieldError(pw, !pw.value ? "Enter your password." : "") || failed;
      }
      if (failed) event.preventDefault();
    });
    $$("input", form).forEach(function (input) {
      input.addEventListener("input", function () { if (input.closest(".acct__field")) fieldError(input, ""); });
    });
  });

  /* ------------------------------------------------------------------ */
  /* FAQs — one answer open at a time                                     */
  /* ------------------------------------------------------------------ */

  $$("[data-mi-faq] details").forEach(function (details) {
    details.addEventListener("toggle", function () {
      if (!details.open) return;
      $$("[data-mi-faq] details").forEach(function (other) { if (other !== details) other.open = false; });
    });
  });

  /* ------------------------------------------------------------------ */
  /* Notices from full-page posts → toasts, and optional state refresh     */
  /* ------------------------------------------------------------------ */

  if (CONFIG.refreshOnLoad) {
    ajax("mi_refresh", {}).catch(function () {});
  }

  if (doc.body.classList.contains("woocommerce-cart")) {
    $$("[data-mi-tab='cart']").forEach(function (tab) { tab.classList.add("is-cart-page"); });
  }
})();
