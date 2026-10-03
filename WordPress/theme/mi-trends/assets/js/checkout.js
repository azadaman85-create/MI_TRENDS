/**
 * Checkout behaviour on top of WooCommerce's own checkout script (wc-checkout).
 *
 *  - Choosing UPI / COD refreshes the summary, because COD adds the handling
 *    fee and the "pay now / on delivery" split (MI Trends Core computes both).
 *  - The selected payment card gets the "active" outline.
 *  - Fields are checked before WooCommerce submits, with the original's inline
 *    messages (app/(store)/checkout/page.tsx → validate()). The server repeats
 *    every check, so this is only about showing errors where the shopper looks.
 */
(function ($) {
  "use strict";

  var rules = {
    billing_first_name: function (v) { return v.trim().length < 2 ? "Enter the name we should use for delivery." : ""; },
    billing_phone: function (v) { return /^[6-9][0-9]{9}$/.test(v.replace(/\D/g, "").slice(-10)) ? "" : "Enter a valid 10-digit Indian mobile number."; },
    billing_email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? "" : "Enter a valid email address."; },
    billing_address_1: function (v) { return v.trim().length < 8 ? "Add a complete house, flat or building address." : ""; },
    billing_address_2: function (v) { return v.trim().length < 3 ? "Add your road, area or locality." : ""; },
    billing_postcode: function (v) { return /^[1-9][0-9]{5}$/.test(v.trim()) ? "" : "Enter a valid 6-digit pincode."; },
    billing_city: function (v) { return v.trim().length < 2 ? "Enter your city." : ""; },
    billing_state: function (v) { return v ? "" : "Choose your state."; },
  };

  function setError(name, message) {
    var $input = $('[name="' + name + '"]');
    if (!$input.length) return;
    var $row = $input.closest(".form-row");
    $row.find(".field-error").remove();
    $input.attr("aria-invalid", message ? "true" : null);
    $row.toggleClass("woocommerce-invalid", !!message);
    if (message) {
      $("<span/>", { "class": "field-error", id: name + "-error", text: message }).appendTo($row);
      $input.attr("aria-describedby", name + "-error");
    } else {
      $input.removeAttr("aria-describedby");
    }
  }

  function validateUpi() {
    var $upi = $('[name="mi_upi_id"]:visible');
    if (!$upi.length) return "";
    var ok = /^[\w.-]{2,}@[\w.-]{2,}$/.test($upi.val().trim());
    var cod = $('input[name="payment_method"]:checked').val() === "mi_cod_advance";
    var message = ok ? "" : cod ? "Enter the UPI ID you'll pay the advance from." : "Enter a valid UPI ID, for example name@bank.";
    var $label = $upi.closest("label");
    $label.find(".field-error").remove();
    $upi.attr("aria-invalid", message ? "true" : null);
    if (message) $("<span/>", { "class": "field-error", text: message }).insertAfter($upi);
    return message ? "mi_upi_id" : "";
  }

  var $form = $("form.checkout");

  $form.on("checkout_place_order", function () {
    var first = "";
    Object.keys(rules).forEach(function (name) {
      var $input = $('[name="' + name + '"]');
      if (!$input.length) return;
      var message = rules[name]($input.val() || "");
      setError(name, message);
      if (message && !first) first = name;
    });
    var upi = validateUpi();
    if (upi && !first) first = upi;
    if (first) {
      var el = document.querySelector('[name="' + first + '"]');
      if (el) { el.focus(); el.scrollIntoView({ behavior: "smooth", block: "center" }); }
      return false;
    }
    return true;
  });

  $form.on("input change", "input, select", function () {
    if (rules[this.name]) setError(this.name, "");
    if (this.name === "mi_upi_id") $(this).attr("aria-invalid", null).siblings(".field-error").remove();
  });

  $form.on("input", "#billing_phone", function () {
    this.value = this.value.replace(/\D/g, "").slice(0, 10);
  });

  function markActive() {
    $(".payment-methods > li").each(function () {
      var checked = $(this).find('input[name="payment_method"]').is(":checked");
      $(this).toggleClass("active", checked);
    });
  }

  $(document.body).on("change", 'input[name="payment_method"]', function () {
    markActive();
    $(document.body).trigger("update_checkout");
  });
  $(document.body).on("updated_checkout payment_method_selected", markActive);
  markActive();
})(jQuery);
