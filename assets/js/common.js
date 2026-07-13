(function () {
  var SUPPORTED_LANGS = ["ko", "en", "ja", "zh-CN"];
  var DEFAULT_LANG = "ko";

  function getDictionary(lang) {
    var table = window.DEVSEUNG_I18N || {};
    return table[lang] || table[DEFAULT_LANG] || {};
  }

  function t(lang, key) {
    var dict = getDictionary(lang);
    if (Object.prototype.hasOwnProperty.call(dict, key)) {
      return dict[key];
    }
    var fallback = getDictionary(DEFAULT_LANG);
    return fallback[key] || key;
  }

  function getStoredLang() {
    try {
      return window.localStorage.getItem("devseung.lang");
    } catch (error) {
      console.warn("localStorage is unavailable when reading language:", error);
      return null;
    }
  }

  function setStoredLang(lang) {
    try {
      window.localStorage.setItem("devseung.lang", lang);
    } catch (error) {
      console.warn("localStorage is unavailable when writing language:", error);
    }
  }

  function detectLang() {
    var queryLang = new URL(window.location.href).searchParams.get("lang");
    if (queryLang && SUPPORTED_LANGS.indexOf(queryLang) >= 0) {
      return queryLang;
    }

    var storedLang = getStoredLang();
    if (storedLang && SUPPORTED_LANGS.indexOf(storedLang) >= 0) {
      return storedLang;
    }

    var navLang = (navigator.language || "").toLowerCase();
    if (navLang.indexOf("zh") === 0) {
      return "zh-CN";
    }
    if (navLang.indexOf("ja") === 0) {
      return "ja";
    }
    if (navLang.indexOf("en") === 0) {
      return "en";
    }
    return DEFAULT_LANG;
  }

  function applyText(lang) {
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      el.textContent = t(lang, key);
    });

    document.querySelectorAll("[data-i18n-content]").forEach(function (el) {
      var key = el.getAttribute("data-i18n-content");
      el.setAttribute("content", t(lang, key));
    });

    document.querySelectorAll("[data-i18n-aria-label]").forEach(function (el) {
      var key = el.getAttribute("data-i18n-aria-label");
      el.setAttribute("aria-label", t(lang, key));
    });
  }

  function updateLangInLinks(lang) {
    document.querySelectorAll(".js-lang-link").forEach(function (el) {
      var href = el.getAttribute("href");
      if (!href) return;
      try {
        var url = new URL(href, window.location.href);
        if (url.origin !== window.location.origin) {
          return;
        }
        url.searchParams.set("lang", lang);
        el.setAttribute("href", url.pathname + url.search + url.hash);
      } catch (error) {
        console.warn("Skipping invalid navigation URL:", href, error);
      }
    });
  }

  function setupIssueLinks(lang) {
    document.querySelectorAll(".js-issue-link").forEach(function (el) {
      var subject = el.getAttribute("data-issue-subject") || "Inquiry";
      var title = "[FAQ] " + subject;
      var body = [
        "Language: " + lang,
        "Page: " + window.location.pathname,
        "",
        "Question/Inquiry:",
        "",
        "(Please describe your question in detail.)"
      ].join("\n");
      var issueUrl =
        "https://github.com/DSeung001/devseung.com/issues/new?title=" +
        encodeURIComponent(title) +
        "&body=" +
        encodeURIComponent(body);
      el.setAttribute("href", issueUrl);
    });
  }

  function setupLangSwitcher(lang) {
    var selector = document.getElementById("lang-switcher");
    if (!selector) return;

    selector.value = lang;
    selector.addEventListener("change", function () {
      var next = selector.value;
      setStoredLang(next);
      var url = new URL(window.location.href);
      url.searchParams.set("lang", next);
      window.location.assign(url.toString());
    });
  }

  function setup() {
    var lang = detectLang();
    setStoredLang(lang);
    document.documentElement.setAttribute("lang", lang);
    applyText(lang);
    updateLangInLinks(lang);
    setupIssueLinks(lang);
    setupLangSwitcher(lang);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setup);
  } else {
    setup();
  }
})();
