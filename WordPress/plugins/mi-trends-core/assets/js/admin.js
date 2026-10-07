/**
 * MI TRENDS admin screens.
 * Inventory: edits are staged (cells turn red) and the Save button counts them,
 * like the original's "Save N changes" — nothing is written until Save.
 */
(function () {
  "use strict";

  var form = document.querySelector("[data-mi-inventory]");
  if (!form) return;

  var save = form.querySelector("[data-mi-save]");
  var label = form.querySelector("[data-mi-save-label]");
  var inputs = Array.prototype.slice.call(form.querySelectorAll(".a-stock-input"));

  function refresh() {
    var dirty = 0;
    inputs.forEach(function (input) {
      var changed = input.value !== input.getAttribute("data-original");
      input.classList.toggle("is-dirty", changed);
      if (changed) dirty += 1;
    });
    save.disabled = dirty === 0;
    label.textContent = dirty ? "Save " + dirty + " change" + (dirty === 1 ? "" : "s") : "Save changes";
  }

  inputs.forEach(function (input) {
    input.addEventListener("input", refresh);
    input.addEventListener("focus", function () { input.select(); });
  });

  // Only send the cells that changed.
  form.addEventListener("submit", function () {
    inputs.forEach(function (input) {
      if (input.value === input.getAttribute("data-original")) input.disabled = true;
    });
  });

  window.addEventListener("beforeunload", function (event) {
    if (!save.disabled && !form.dataset.submitting) {
      event.preventDefault();
      event.returnValue = "";
    }
  });
  form.addEventListener("submit", function () { form.dataset.submitting = "1"; });

  refresh();
})();
