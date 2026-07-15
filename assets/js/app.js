(function () {
  var VALID = ["intro", "sites", "inquiry"];
  var DEFAULT = "intro";
  var MAIL_TO = "seungryeol156@gmail.com";
  var GITHUB_NEW =
    "https://github.com/DSeung001/devseung.com/issues/new";
  var SUBJECT = "Inquiry from devseung.com";

  var closeSiteModal = function () {};

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

    closeSiteModal();
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

  function bindSiteModal() {
    var modal = document.querySelector("[data-site-modal]");
    if (!modal) return;

    var titleEl = document.getElementById("site-modal-title");
    var bodyEl = modal.querySelector("[data-site-modal-body]");
    var windowEl = modal.querySelector(".site-modal-window");

    function closeModal() {
      if (modal.hasAttribute("hidden")) return;
      modal.setAttribute("hidden", "");
      modal.setAttribute("aria-hidden", "true");
      document.body.classList.remove("site-modal-open");
      if (titleEl) titleEl.textContent = "";
      if (bodyEl) bodyEl.innerHTML = "";
    }

    closeSiteModal = closeModal;

    function openModal(trigger) {
      var id = trigger.getAttribute("data-site-open");
      var source = document.getElementById("site-desc-" + id);
      if (!source || !bodyEl || !titleEl) return;

      var card = trigger.closest(".site-window");
      var titleNode = card ? card.querySelector(".title-bar .title") : null;
      titleEl.textContent = titleNode ? titleNode.textContent.trim() : "";
      bodyEl.innerHTML = source.innerHTML;

      modal.removeAttribute("hidden");
      modal.setAttribute("aria-hidden", "false");
      document.body.classList.add("site-modal-open");

      var closeBtn = modal.querySelector("[data-site-modal-close]");
      if (closeBtn) closeBtn.focus();
    }

    var openers = document.querySelectorAll("[data-site-open]");
    for (var i = 0; i < openers.length; i++) {
      openers[i].addEventListener("click", function (event) {
        openModal(event.currentTarget);
      });
    }

    var closers = modal.querySelectorAll("[data-site-modal-close]");
    for (var j = 0; j < closers.length; j++) {
      closers[j].addEventListener("click", function (event) {
        event.stopPropagation();
        closeModal();
      });
    }

    modal.addEventListener("click", function (event) {
      if (event.target === modal) closeModal();
    });

    if (windowEl) {
      windowEl.addEventListener("click", function (event) {
        event.stopPropagation();
      });
    }

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closeModal();
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    bindSiteModal();
    syncFromHash();
    bindInquiry();
  });
  window.addEventListener("hashchange", syncFromHash);
})();
