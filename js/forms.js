/* =====================================================================
   FORMS — public submission handling (Speak On It + Booking)
   Writes to Firestore when configured; graceful "offline" mode
   (pointing to IG DMs) when site-config.js still has placeholders.
   ===================================================================== */
(function () {
  "use strict";

  var READY = !!window.TRUFOE_FIREBASE_READY && typeof firebase !== "undefined";
  var db = null;

  if (READY) {
    try {
      firebase.initializeApp(window.TRUFOE_FIREBASE);
      db = firebase.firestore();
    } catch (e) {
      READY = false;
    }
  }

  var IG_URL = "https://www.instagram.com/_trufoe/";

  function setStatus(form, msg, kind) {
    var s = form.querySelector(".card-form__status");
    if (!s) return;
    s.textContent = msg;
    s.className = "card-form__status" + (kind ? " is-" + kind : "");
  }

  function wire(formId, collection) {
    var form = document.getElementById(formId);
    if (!form) return;

    var btn = form.querySelector(".card-form__submit");
    var label = form.querySelector(".card-form__submit-label");

    /* offline mode: flag the form, submit becomes a DM redirect */
    if (!READY) {
      form.classList.add("is-offline");
      setStatus(form, "Direct line coming online soon — for now, hit the DMs and it lands the same.", "note");
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        window.open(IG_URL, "_blank", "noopener");
      });
      return;
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var message = (form.elements.message.value || "").trim();
      var name = (form.elements.name.value || "").trim();
      var contact = (form.elements.contact.value || "").trim();
      var type = form.elements.type.value;

      if (!message) {
        setStatus(form, "Say something first — the message is the whole point.", "error");
        form.elements.message.focus();
        return;
      }
      if (collection === "inquiries" && (!name || !contact)) {
        setStatus(form, "Name and a way to reach you — that's how business gets done.", "error");
        return;
      }

      btn.disabled = true;
      form.classList.add("is-sending");
      if (label) label.textContent = "Sending…";

      db.collection(collection).add({
        name: name.slice(0, 80),
        contact: contact.slice(0, 120),
        type: type,
        message: message.slice(0, 1600),
        status: "new",
        page: location.pathname,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      }).then(function () {
        form.classList.remove("is-sending");
        form.classList.add("is-sent");
        if (label) label.textContent = "Received ✦";
        setStatus(form, collection === "inquiries"
          ? "Inquiry received. Solid moves get solid replies."
          : "Received. Foe sees every one of these.", "ok");
        form.reset();
        setTimeout(function () {
          btn.disabled = false;
          form.classList.remove("is-sent");
          if (label) label.textContent = collection === "inquiries" ? "Send the inquiry" : "Send it up";
        }, 4000);
      }).catch(function () {
        btn.disabled = false;
        form.classList.remove("is-sending");
        setStatus(form, "Didn't go through — try again, or hit the DMs: @_trufoe", "error");
      });
    });
  }

  wire("questionForm", "questions");
  wire("bookingForm", "inquiries");
})();
