/* =====================================================================
   SITE CONFIG — Tru Foe HUB
   Paste your Firebase web-app config below (Firebase console →
   Project settings → Your apps → SDK setup and configuration).
   Until real values replace the placeholders, the forms run in
   "offline mode" (visitors are pointed to Instagram DMs instead)
   and the admin dashboard shows setup instructions.
   ===================================================================== */
window.TRUFOE_FIREBASE = {
  apiKey:            "PASTE_API_KEY",
  authDomain:        "PASTE_PROJECT.firebaseapp.com",
  projectId:         "PASTE_PROJECT_ID",
  storageBucket:     "PASTE_PROJECT.appspot.com",
  messagingSenderId: "PASTE_SENDER_ID",
  appId:             "PASTE_APP_ID"
};

/* true once real config is pasted */
window.TRUFOE_FIREBASE_READY =
  window.TRUFOE_FIREBASE.apiKey.indexOf("PASTE") === -1;
