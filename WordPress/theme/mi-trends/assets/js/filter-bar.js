/**
 * Shop filter token bar — the popover half of components/ui/filter-token-bar.tsx.
 *
 * Tokens are rendered by PHP from the URL. This script opens the same popovers
 * (choose a field, an operator, values) and then rewrites the URL using the
 * original encoding — one parameter per token, values comma-separated, a
 * leading "!" for "is not / is none of" — and loads it. Filtering itself
 * happens on the server (MI Trends Core), so results are always the real
 * WooCommerce catalogue.
 */
(function () {
  "use strict";

  var bar = document.querySelector("[data-mi-filter-bar]");
  var configNode = document.querySelector("[data-mi-filter-config]");
  if (!bar || !configNode) return;

  var config = JSON.parse(configNode.textContent || "{}");
  var fields = config.fields || [];
  var filters = (config.filters || []).map(function (f) { return { field: f.field, operator: f.operator, values: f.values.slice() }; });
  var labels = config.labels || {};
  var popover = null;

  function fieldById(id) { return fields.filter(function (f) { return f.id === id; })[0]; }
  function operatorOf(field, value) { return (field.operators || []).filter(function (o) { return o.value === value; })[0]; }

  /* ---------- URL ---------- */

  function navigate() {
    var url = new URL(config.baseUrl, window.location.href);
    (config.keep || []).forEach(function (pair) { url.searchParams.append(pair[0], pair[1]); });
    filters.forEach(function (filter) {
      if (!filter.values.length) return;
      var field = fieldById(filter.field);
      var op = field && operatorOf(field, filter.operator);
      url.searchParams.append(filter.field, (op && op.negate ? "!" : "") + filter.values.join(","));
    });
    window.location.href = url.toString();
  }

  /* ---------- Popover ---------- */

  function close() {
    if (!popover) return;
    popover.el.remove();
    if (popover.anchor) popover.anchor.setAttribute("aria-expanded", "false");
    document.removeEventListener("mousedown", onOutside, true);
    document.removeEventListener("keydown", onKey, true);
    var anchor = popover.anchor;
    popover = null;
    if (anchor && anchor.focus) anchor.focus();
  }

  function onOutside(event) {
    if (popover && !popover.el.contains(event.target) && !popover.anchor.contains(event.target)) close();
  }

  function onKey(event) {
    if (event.key === "Escape") { event.stopPropagation(); close(); }
  }

  function place(el, anchor) {
    var rect = anchor.getBoundingClientRect();
    var width = Math.min(304, window.innerWidth - 16);
    el.style.minWidth = Math.min(224, width) + "px";
    el.style.maxWidth = width + "px";
    var left = Math.min(rect.left, window.innerWidth - width - 8);
    el.style.left = Math.max(8, left) + "px";
    el.style.top = rect.bottom + 6 + "px";
  }

  function open(anchor, build) {
    close();
    var el = document.createElement("div");
    el.className = "fb-pop";
    el.setAttribute("role", "dialog");
    document.body.appendChild(el);
    build(el);
    place(el, anchor);
    anchor.setAttribute("aria-expanded", "true");
    popover = { el: el, anchor: anchor };
    document.addEventListener("mousedown", onOutside, true);
    document.addEventListener("keydown", onKey, true);
    var first = el.querySelector("input, button");
    if (first) first.focus();
  }

  function option(label, attrs) {
    var li = document.createElement("li");
    li.className = "fb-option";
    li.setAttribute("role", "option");
    li.tabIndex = 0;
    if (attrs && attrs.glyph) {
      var glyph = document.createElement("span");
      glyph.className = "fb-glyph";
      glyph.setAttribute("aria-hidden", "true");
      glyph.style.gap = "2px";
      attrs.glyph.slice(0, 3).forEach(function (hex) {
        var dot = document.createElement("span");
        dot.style.cssText = "width:8px;height:8px;border-radius:50%;border:1px solid rgb(0 0 0 / 0.15);background:" + hex;
        glyph.appendChild(dot);
      });
      li.appendChild(glyph);
    }
    if (attrs && typeof attrs.checked === "boolean") {
      var box = document.createElement("span");
      box.className = "fb-box";
      box.setAttribute("aria-hidden", "true");
      box.setAttribute("data-checked", attrs.checked ? "true" : "false");
      box.innerHTML = '<svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2.5 6.2l2.2 2.2L9.5 3.6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      li.appendChild(box);
      li.setAttribute("aria-selected", attrs.checked ? "true" : "false");
    }
    var text = document.createElement("span");
    text.className = "fb-option__label";
    text.textContent = label;
    li.appendChild(text);
    li.addEventListener("mouseenter", function () { li.setAttribute("data-active", "true"); });
    li.addEventListener("mouseleave", function () { li.removeAttribute("data-active"); });
    return li;
  }

  function activate(li, handler) {
    li.addEventListener("click", handler);
    li.addEventListener("keydown", function (event) {
      if (event.key === "Enter" || event.key === " ") { event.preventDefault(); handler(); }
      if (event.key === "ArrowDown" && li.nextElementSibling) { event.preventDefault(); li.nextElementSibling.focus(); }
      if (event.key === "ArrowUp" && li.previousElementSibling) { event.preventDefault(); li.previousElementSibling.focus(); }
    });
  }

  function list(el) {
    var ul = document.createElement("ul");
    ul.className = "fb-list";
    ul.setAttribute("role", "listbox");
    el.appendChild(ul);
    return ul;
  }

  /** Field picker. onPick(fieldId). */
  function fieldPicker(el, onPick) {
    var ul = list(el);
    fields.forEach(function (field) {
      var li = option(field.label);
      activate(li, function () { onPick(field.id); });
      ul.appendChild(li);
    });
  }

  /** Value picker for one filter (index into filters). */
  function valuePicker(el, index) {
    var filter = filters[index];
    var field = fieldById(filter.field);
    var op = operatorOf(field, filter.operator) || field.operators[0];
    var multi = !!op.multi;
    var selected = filter.values.slice();

    var search = document.createElement("div");
    search.className = "fb-search";
    var input = document.createElement("input");
    input.type = "text";
    input.placeholder = labels.search || "Search…";
    input.setAttribute("aria-label", field.label);
    search.appendChild(input);
    el.appendChild(search);

    var ul = list(el);
    if (multi) ul.setAttribute("aria-multiselectable", "true");

    function render() {
      var query = input.value.trim().toLowerCase();
      ul.innerHTML = "";
      var shown = field.options.filter(function (o) { return !query || o.label.toLowerCase().indexOf(query) !== -1; });
      if (!shown.length) {
        var note = document.createElement("li");
        note.className = "fb-note";
        note.textContent = labels.none || "No matches";
        ul.appendChild(note);
      }
      shown.forEach(function (o) {
        var checked = selected.indexOf(o.value) !== -1;
        var li = option(o.label, { checked: multi ? checked : undefined, glyph: o.palette });
        if (!multi && checked) li.setAttribute("data-active", "true");
        activate(li, function () {
          if (!multi) {
            filters[index].values = [o.value];
            navigate();
            return;
          }
          var at = selected.indexOf(o.value);
          if (at === -1) selected.push(o.value); else selected.splice(at, 1);
          render();
        });
        ul.appendChild(li);
      });
    }
    input.addEventListener("input", render);
    render();

    if (multi) {
      var foot = document.createElement("div");
      foot.className = "fb-search";
      foot.style.borderTop = "1px solid #e6e1d9";
      foot.style.borderBottom = "0";
      var apply = document.createElement("button");
      apply.type = "button";
      apply.className = "fb-add";
      apply.style.width = "100%";
      apply.style.justifyContent = "center";
      apply.textContent = labels.apply || "Apply";
      apply.addEventListener("click", function () {
        filters[index].values = selected.slice();
        if (!selected.length) filters.splice(index, 1);
        navigate();
      });
      foot.appendChild(apply);
      el.appendChild(foot);
    }
  }

  /* ---------- Wiring ---------- */

  bar.querySelectorAll("[data-mi-token]").forEach(function (token) {
    var index = Number(token.getAttribute("data-mi-token"));

    token.querySelector('[data-mi-seg="field"]').addEventListener("click", function (event) {
      var anchor = event.currentTarget;
      open(anchor, function (el) {
        fieldPicker(el, function (fieldId) {
          var field = fieldById(fieldId);
          filters[index] = { field: fieldId, operator: field.operators[0].value, values: [] };
          open(anchor, function (inner) { valuePicker(inner, index); });
        });
      });
    });

    token.querySelector('[data-mi-seg="operator"]').addEventListener("click", function (event) {
      var filter = filters[index];
      var field = fieldById(filter.field);
      open(event.currentTarget, function (el) {
        var ul = list(el);
        field.operators.forEach(function (op) {
          var li = option(op.label);
          if (op.value === filter.operator) li.setAttribute("data-active", "true");
          activate(li, function () {
            filter.operator = op.value;
            if (!op.multi && filter.values.length > 1) filter.values = filter.values.slice(0, 1);
            navigate();
          });
          ul.appendChild(li);
        });
      });
    });

    token.querySelector('[data-mi-seg="value"]').addEventListener("click", function (event) {
      open(event.currentTarget, function (el) { valuePicker(el, index); });
    });
  });

  var add = bar.querySelector("[data-mi-add]");
  if (add) {
    add.addEventListener("click", function () {
      open(add, function (el) {
        fieldPicker(el, function (fieldId) {
          var field = fieldById(fieldId);
          filters.push({ field: fieldId, operator: field.operators[0].value, values: [] });
          var index = filters.length - 1;
          open(add, function (inner) { valuePicker(inner, index); });
        });
      });
    });
  }

  window.addEventListener("resize", close);
  window.addEventListener("scroll", function () { if (popover) place(popover.el, popover.anchor); }, { passive: true });
})();
