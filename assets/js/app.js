(function () {
  var VALID = ["intro", "sites", "inquiry"];
  var DEFAULT = "intro";
  var MAIL_TO = "seungryeol156@gmail.com";
  var GITHUB_NEW =
    "https://github.com/DSeung001/devseung.com/issues/new";
  var SUBJECT = "Inquiry from devseung.com";

  function currentHash() {
    var raw = (location.hash || "").replace(/^#/, "").toLowerCase();
    return VALID.indexOf(raw) !== -1 ? raw : DEFAULT;
  }

  function showPanel(id) {
    var panels = document.querySelectorAll("[data-panel]");
    for (var i = 0; i < panels.length; i++) {
      var panel = panels[i];
      var active = panel.getAttribute("data-panel") === id;
      if (active) {
        panel.removeAttribute("hidden");
        panel.setAttribute("aria-hidden", "false");
      } else {
        panel.setAttribute("hidden", "");
        panel.setAttribute("aria-hidden", "true");
      }
    }

    var links = document.querySelectorAll("[data-nav]");
    for (var j = 0; j < links.length; j++) {
      var link = links[j];
      var isActive = link.getAttribute("data-nav") === id;
      if (isActive) {
        link.classList.add("is-active");
        link.setAttribute("aria-current", "page");
      } else {
        link.classList.remove("is-active");
        link.removeAttribute("aria-current");
      }
    }

    document.title =
      {
        intro: "Intro | DevSeung",
        sites: "Sites | DevSeung",
        inquiry: "Inquiry | DevSeung",
      }[id] || "DevSeung";
  }

  function syncFromHash() {
    var id = currentHash();
    if (!location.hash || location.hash.toLowerCase() !== "#" + id) {
      history.replaceState(null, "", "#" + id);
    }
    showPanel(id);
  }

  function inquiryFields() {
    var emailEl = document.getElementById("inquiry_email");
    var noteEl = document.getElementById("inquiry_note");
    return {
      email: emailEl ? emailEl.value.trim() : "",
      note: noteEl ? noteEl.value.trim() : "",
    };
  }

  function buildBody(email, note) {
    var parts = [];
    if (email) {
      parts.push("From: " + email);
      parts.push("");
    }
    parts.push(note);
    return parts.join("\n");
  }

  function bindInquiry() {
    var buttons = document.querySelectorAll("[data-inquiry]");
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].addEventListener("click", function (event) {
        var kind = event.currentTarget.getAttribute("data-inquiry");
        var fields = inquiryFields();

        if (!fields.note) {
          event.preventDefault();
          alert("문의 내용(Note)을 입력해 주세요.");
          var noteEl = document.getElementById("inquiry_note");
          if (noteEl) noteEl.focus();
          return;
        }

        var body = buildBody(fields.email, fields.note);

        if (kind === "mailto") {
          event.preventDefault();
          var mailto =
            "mailto:" +
            MAIL_TO +
            "?subject=" +
            encodeURIComponent(SUBJECT) +
            "&body=" +
            encodeURIComponent(body);
          window.location.href = mailto;
          return;
        }

        if (kind === "github") {
          event.preventDefault();
          var githubUrl =
            GITHUB_NEW +
            "?title=" +
            encodeURIComponent(SUBJECT) +
            "&body=" +
            encodeURIComponent(body);
          window.open(githubUrl, "_blank", "noopener,noreferrer");
        }
      });
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    syncFromHash();
    bindInquiry();
  });
  window.addEventListener("hashchange", syncFromHash);
})();
