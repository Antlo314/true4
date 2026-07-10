/* =====================================================================
   ADMIN — "The Office" dashboard
   Auth-gated realtime inbox for booking inquiries + Speak On It.
   Fan-submitted text is rendered with textContent only (XSS-safe).
   ===================================================================== */
(function () {
  "use strict";

  var setupView = document.getElementById("setupView");
  var gateView = document.getElementById("gateView");
  var dashView = document.getElementById("dashView");

  /* ---------- unconfigured → setup instructions ---------- */
  if (!window.TRUFOE_FIREBASE_READY || typeof firebase === "undefined") {
    setupView.hidden = false;
    return;
  }

  firebase.initializeApp(window.TRUFOE_FIREBASE);
  var auth = firebase.auth();
  var db = firebase.firestore();

  var unsub = [];
  var cache = { inquiries: [], questions: [] };
  var activeTab = "inquiries";

  /* ---------- auth gate ---------- */
  var loginForm = document.getElementById("loginForm");
  var loginStatus = loginForm.querySelector(".card-form__status");

  loginForm.addEventListener("submit", function (e) {
    e.preventDefault();
    loginStatus.textContent = "Checking…";
    loginStatus.className = "card-form__status is-note";
    auth.signInWithEmailAndPassword(
      document.getElementById("aEmail").value.trim(),
      document.getElementById("aPass").value
    ).catch(function () {
      loginStatus.textContent = "No entry. Check the email and password.";
      loginStatus.className = "card-form__status is-error";
    });
  });

  document.getElementById("signOut").addEventListener("click", function () {
    auth.signOut();
  });

  auth.onAuthStateChanged(function (user) {
    if (user) {
      gateView.hidden = true;
      dashView.hidden = false;
      listen();
    } else {
      dashView.hidden = true;
      gateView.hidden = false;
      unsub.forEach(function (u) { u(); });
      unsub = [];
    }
  });

  /* ---------- realtime listeners ---------- */
  function listen() {
    ["inquiries", "questions"].forEach(function (col) {
      unsub.push(
        db.collection(col).orderBy("createdAt", "desc").limit(200)
          .onSnapshot(function (snap) {
            cache[col] = snap.docs.map(function (d) {
              var v = d.data() || {};
              v.id = d.id;
              v.col = col;
              return v;
            });
            refresh();
          }, function () {
            var list = document.getElementById("list");
            list.textContent = "";
            list.appendChild(emptyState("Can't read the inbox.",
              "Check the Firestore rules — the signed-in account needs read access."));
          })
      );
    });
  }

  /* ---------- render ---------- */
  function refresh() {
    var inq = cache.inquiries, qs = cache.questions;
    var newCount = inq.concat(qs).filter(function (x) { return x.status === "new"; }).length;

    text("statNew", newCount);
    text("statInq", inq.length);
    text("statQ", qs.length);
    text("tabInqN", inq.length ? "· " + inq.length : "");
    text("tabQN", qs.length ? "· " + qs.length : "");

    var list = document.getElementById("list");
    list.textContent = "";
    var items = cache[activeTab];

    if (!items.length) {
      list.appendChild(emptyState(
        activeTab === "inquiries" ? "No inquiries yet." : "Nobody's spoken on it yet.",
        "When someone submits the form on the site, it lands here in real time."));
      return;
    }
    items.forEach(function (item) { list.appendChild(row(item)); });
  }

  function row(item) {
    var el = div("admin-item" + (item.status === "new" ? " is-new" : ""));

    var top = div("admin-item__top");
    var type = div("admin-item__type"); type.textContent = item.type || "message";
    top.appendChild(type);
    if (item.name) { var n = span("admin-item__name"); n.textContent = item.name; top.appendChild(n); }
    if (item.contact) { var c = span("admin-item__contact"); c.textContent = item.contact; top.appendChild(c); }
    var t = span("admin-item__time"); t.textContent = timeAgo(item.createdAt); top.appendChild(t);
    el.appendChild(top);

    var msg = div("admin-item__msg"); msg.textContent = item.message || ""; el.appendChild(msg);

    var foot = div("admin-item__foot");
    var st = document.createElement("button");
    st.className = "admin-status";
    st.dataset.s = item.status || "new";
    st.textContent = "● " + (item.status || "new");
    st.title = "Click to cycle: new → read → handled";
    st.addEventListener("click", function () {
      var next = { new: "read", read: "handled", handled: "new" }[item.status || "new"];
      db.collection(item.col).doc(item.id).update({ status: next });
    });
    foot.appendChild(st);

    if (item.contact) {
      var cp = document.createElement("button");
      cp.className = "admin-copy";
      cp.textContent = "Copy contact";
      cp.addEventListener("click", function () {
        navigator.clipboard.writeText(item.contact).then(function () {
          cp.textContent = "Copied ✦";
          setTimeout(function () { cp.textContent = "Copy contact"; }, 1500);
        });
      });
      foot.appendChild(cp);
    }
    el.appendChild(foot);
    return el;
  }

  /* ---------- tabs ---------- */
  document.querySelectorAll(".admin-tab").forEach(function (tab) {
    tab.addEventListener("click", function () {
      activeTab = tab.dataset.tab;
      document.querySelectorAll(".admin-tab").forEach(function (x) {
        x.classList.toggle("is-active", x === tab);
      });
      refresh();
    });
  });

  /* ---------- helpers ---------- */
  function div(cls) { var d = document.createElement("div"); d.className = cls; return d; }
  function span(cls) { var s = document.createElement("span"); s.className = cls; return s; }
  function text(id, v) { document.getElementById(id).textContent = v; }
  function emptyState(title, sub) {
    var d = div("admin-empty");
    var b = document.createElement("b"); b.textContent = title;
    var p = document.createElement("span"); p.textContent = sub;
    d.appendChild(b); d.appendChild(p);
    return d;
  }
  function timeAgo(ts) {
    if (!ts || !ts.toDate) return "just now";
    var s = Math.floor((Date.now() - ts.toDate().getTime()) / 1000);
    if (s < 60) return "just now";
    if (s < 3600) return Math.floor(s / 60) + "m ago";
    if (s < 86400) return Math.floor(s / 3600) + "h ago";
    if (s < 604800) return Math.floor(s / 86400) + "d ago";
    return ts.toDate().toLocaleDateString();
  }
})();
