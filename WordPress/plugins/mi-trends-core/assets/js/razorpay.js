/**
 * Order-pay page: open Razorpay Standard Checkout, then verify on the server.
 * The client half of the original checkout's Razorpay handler.
 */
(function () {
  "use strict";

  var cfg = window.MI_RAZORPAY;
  if (!cfg || typeof window.Razorpay !== "function") return;

  var button = document.querySelector("[data-mi-rzp-open]");
  var errorBox = document.querySelector("[data-mi-rzp-error]");
  var busy = false;

  function showError(message) {
    if (!errorBox) return;
    errorBox.textContent = message;
    errorBox.hidden = false;
    if (button) button.disabled = false;
    busy = false;
  }

  function verify(response) {
    if (errorBox) { errorBox.hidden = false; errorBox.textContent = cfg.i18n.verifying; }
    fetch(cfg.verifyUrl, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        order_id: cfg.orderId,
        order_key: cfg.orderKey,
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
      }),
    })
      .then(function (res) { return res.json().then(function (json) { return { ok: res.ok, json: json }; }); })
      .then(function (result) {
        if (!result.ok || !result.json.success) throw new Error((result.json && result.json.message) || cfg.i18n.failed);
        window.location.href = result.json.redirect;
      })
      .catch(function (error) { showError(error.message || cfg.i18n.failed); });
  }

  function open() {
    if (busy) return;
    busy = true;
    if (button) button.disabled = true;
    if (errorBox) errorBox.hidden = true;

    var options = Object.assign({}, cfg.options, {
      handler: verify,
      modal: { ondismiss: function () { showError(cfg.i18n.cancelled); } },
    });
    var checkout = new window.Razorpay(options);
    checkout.on("payment.failed", function (response) {
      showError((response && response.error && response.error.description) || cfg.i18n.failed);
    });
    checkout.open();
  }

  if (button) button.addEventListener("click", open);
  open();
})();
