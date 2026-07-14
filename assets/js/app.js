(function () {
  var VALID = ["intro", "sites", "inquiry"];
  var DEFAULT = "intro";

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

  document.addEventListener("DOMContentLoaded", syncFromHash);
  window.addEventListener("hashchange", syncFromHash);
})();
