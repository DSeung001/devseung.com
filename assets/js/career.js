(function () {
  var DATA_URL = "/assets/data/career.json";

  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function findOption(options, id) {
    for (var i = 0; i < options.length; i++) {
      if (options[i].id === id) return options[i];
    }
    return options[0] || null;
  }

  function tierLabel(lv) {
    if (lv >= 8) return "고급";
    if (lv >= 4) return "중급";
    if (lv >= 1) return "초급";
    return "";
  }

  function formatLevel(lv) {
    var tier = tierLabel(lv);
    return (tier ? tier + " " : "") + "Lv." + lv;
  }

  function CareerPlayer(root, data) {
    this.root = root;
    this.stage = root.querySelector("[data-career-stage]");
    this.data = data;
    this.tickMs = data.tickMs || 900;
    this.choiceHoldMs = data.choiceHoldMs || 1200;
    this.bootMs = data.bootMs || 1200;
    this.skills = data.skills || [];
    this.events = data.events || [];

    this.playBtn = root.querySelector("[data-career-play]");
    this.board = root.querySelector("[data-career-board]");
    this.statusEl = root.querySelector("[data-career-status]");
    this.statusLabel = root.querySelector("[data-career-status-label]");
    this.skillsEl = root.querySelector("[data-career-skills]");
    this.logScroll = root.querySelector("[data-career-log-scroll]");
    this.pastEl = root.querySelector("[data-career-log-past]");
    this.splitEl = root.querySelector("[data-career-log-split]");
    this.currentEl = root.querySelector("[data-career-log-current]");
    this.choiceEl = root.querySelector("[data-career-choice]");
    this.replayBtn = root.querySelector("[data-career-replay]");
    this.bootEl = root.querySelector("[data-career-boot]");
    this.endModal = root.querySelector("[data-career-end-modal]");
    this.endCloseBtn = root.querySelector("[data-career-end-close]");
    this.endSkillsEl = root.querySelector("[data-career-end-skills]");
    this.docsScroll = document.querySelector(".docs-scroll");

    this.state = "idle";
    this.index = 0;
    this.levels = {};
    this.timer = null;
    this.skipping = false;
    this.scrollAnim = null;

    var self = this;
    this.playBtn.addEventListener("click", function () {
      self.start();
    });
    if (this.replayBtn) {
      this.replayBtn.addEventListener("click", function () {
        self.replay();
      });
    }
    if (this.endCloseBtn) {
      this.endCloseBtn.addEventListener("click", function () {
        self.hideEndModal();
      });
    }
  }

  CareerPlayer.prototype.setStageClass = function (name) {
    var el = this.stage || this.root;
    el.classList.remove("is-booting", "is-playing", "is-done");
    if (name) {
      el.classList.add(name);
    }
  };

  CareerPlayer.prototype.scrollStageIntoView = function (durationMs) {
    var stage = this.stage;
    var scroll = this.docsScroll;
    if (!stage || !scroll) return;

    var duration = typeof durationMs === "number" ? durationMs : 400;
    var startTop = scroll.scrollTop;
    var scrollRect = scroll.getBoundingClientRect();
    var stageRect = stage.getBoundingClientRect();
    var delta = 0;

    if (stageRect.top < scrollRect.top) {
      delta = stageRect.top - scrollRect.top - 8;
    } else if (stageRect.bottom > scrollRect.bottom) {
      delta = stageRect.bottom - scrollRect.bottom + 8;
      if (stageRect.top - delta < scrollRect.top) {
        delta = stageRect.top - scrollRect.top - 8;
      }
    }

    if (Math.abs(delta) < 1) return;

    var targetTop = startTop + delta;
    var maxTop = scroll.scrollHeight - scroll.clientHeight;
    if (targetTop < 0) targetTop = 0;
    if (targetTop > maxTop) targetTop = maxTop;

    if (this.scrollAnim !== null) {
      cancelAnimationFrame(this.scrollAnim);
      this.scrollAnim = null;
    }

    var startTime = null;
    var self = this;

    function easeOutCubic(t) {
      return 1 - Math.pow(1 - t, 3);
    }

    function frame(now) {
      if (startTime === null) startTime = now;
      var t = Math.min(1, (now - startTime) / duration);
      scroll.scrollTop = startTop + (targetTop - startTop) * easeOutCubic(t);
      if (t < 1) {
        self.scrollAnim = requestAnimationFrame(frame);
      } else {
        self.scrollAnim = null;
      }
    }

    this.scrollAnim = requestAnimationFrame(frame);
  };

  CareerPlayer.prototype.clearTimer = function () {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  };

  CareerPlayer.prototype.schedule = function (fn, ms) {
    var self = this;
    this.clearTimer();
    this.timer = setTimeout(function () {
      self.timer = null;
      fn.call(self);
    }, ms);
  };

  CareerPlayer.prototype.resetLevels = function () {
    this.levels = {};
    for (var i = 0; i < this.skills.length; i++) {
      this.levels[this.skills[i].id] = 0;
    }
  };

  CareerPlayer.prototype.applyGains = function (gains) {
    if (!gains || !gains.length) return;
    var flashed = {};
    for (var i = 0; i < gains.length; i++) {
      var g = gains[i];
      if (!g || !g.skill) continue;
      this.levels[g.skill] = typeof g.to === "number" ? g.to : 0;
      flashed[g.skill] = true;
    }
    this.renderStatus(flashed);
  };

  CareerPlayer.prototype.renderStatus = function (flashMap) {
    var html = "";
    var shown = 0;
    for (var i = 0; i < this.skills.length; i++) {
      var skill = this.skills[i];
      var lv = this.levels[skill.id] || 0;
      if (lv <= 0) continue;
      shown += 1;
      var flash = flashMap && flashMap[skill.id] ? " is-flash" : "";
      html +=
        '<li class="career-skill' +
        flash +
        '" data-skill="' +
        escapeHtml(skill.id) +
        '">' +
        '<span class="career-skill-label">' +
        escapeHtml(skill.label) +
        "</span>" +
        '<span class="career-skill-lv">' +
        escapeHtml(formatLevel(lv)) +
        "</span>" +
        "</li>";
    }
    if (!shown) {
      html =
        '<li class="career-skill career-skill-empty"><span class="career-skill-label">—</span></li>';
    }
    this.skillsEl.innerHTML = html;
  };

  CareerPlayer.prototype.setStatusHeading = function () {
    this.statusLabel.textContent = "STATUS";
    this.statusEl.classList.remove("is-final");
  };

  CareerPlayer.prototype.hideEndModal = function () {
    if (!this.endModal) return;
    this.endModal.hidden = true;
    this.endModal.setAttribute("aria-hidden", "true");
    if (this.endSkillsEl) this.endSkillsEl.innerHTML = "";
  };

  CareerPlayer.prototype.showEndModal = function () {
    if (!this.endModal || !this.endSkillsEl) return;
    var html = "";
    var shown = 0;
    for (var i = 0; i < this.skills.length; i++) {
      var skill = this.skills[i];
      var lv = this.levels[skill.id] || 0;
      if (lv <= 0) continue;
      shown += 1;
      html +=
        '<li class="career-end-skill">' +
        '<span class="career-end-skill-label">' +
        escapeHtml(skill.label) +
        "</span>" +
        '<span class="career-end-skill-lv">' +
        escapeHtml(formatLevel(lv)) +
        "</span>" +
        "</li>";
    }
    if (!shown) {
      html =
        '<li class="career-end-skill career-end-skill-empty"><span class="career-end-skill-label">—</span></li>';
    }
    this.endSkillsEl.innerHTML = html;
    this.endModal.hidden = false;
    this.endModal.setAttribute("aria-hidden", "false");
  };

  CareerPlayer.prototype.clearLog = function () {
    this.pastEl.innerHTML = "";
    this.currentEl.innerHTML = "";
    this.hideSplit();
  };

  CareerPlayer.prototype.hideSplit = function () {
    this.splitEl.hidden = true;
    this.splitEl.setAttribute("aria-hidden", "true");
  };

  CareerPlayer.prototype.showSplit = function () {
    this.splitEl.hidden = false;
    this.splitEl.setAttribute("aria-hidden", "false");
  };

  CareerPlayer.prototype.archiveCurrent = function () {
    if (!this.currentEl.firstChild) return;
    while (this.currentEl.firstChild) {
      this.pastEl.appendChild(this.currentEl.firstChild);
    }
    if (this.pastEl.firstChild) {
      this.showSplit();
    }
  };

  CareerPlayer.prototype.appendEventSep = function () {
    var hr = document.createElement("hr");
    hr.className = "career-event-sep";
    hr.setAttribute("aria-hidden", "true");
    this.pastEl.appendChild(hr);
  };

  CareerPlayer.prototype.beginEventBlock = function () {
    this.archiveCurrent();
    if (this.pastEl.firstChild) {
      this.appendEventSep();
    }
    this.scrollToCurrent();
  };

  CareerPlayer.prototype.scrollToCurrent = function () {
    var scroll = this.logScroll;
    if (!scroll) return;
    var self = this;
    requestAnimationFrame(function () {
      var anchor = null;
      if (self.splitEl && !self.splitEl.hidden) {
        anchor = self.splitEl;
      } else if (self.currentEl && self.currentEl.firstChild) {
        anchor = self.currentEl;
      } else if (self.choiceEl && !self.choiceEl.hidden) {
        anchor = self.choiceEl;
      }
      if (!anchor) {
        scroll.scrollTop = scroll.scrollHeight;
        return;
      }
      var scrollRect = scroll.getBoundingClientRect();
      var anchorRect = anchor.getBoundingClientRect();
      scroll.scrollTop += anchorRect.top - scrollRect.top - 6;
    });
  };

  CareerPlayer.prototype.appendLog = function (html, className) {
    var line = document.createElement("p");
    line.className = "career-line" + (className ? " " + className : "");
    line.innerHTML = html;
    this.currentEl.appendChild(line);
    this.scrollToCurrent();
  };

  CareerPlayer.prototype.appendLogPast = function (html, className) {
    var line = document.createElement("p");
    line.className = "career-line" + (className ? " " + className : "");
    line.innerHTML = html;
    this.pastEl.appendChild(line);
  };

  CareerPlayer.prototype.appendLevelUps = function (gains) {
    if (!gains || !gains.length) return;
    for (var i = 0; i < gains.length; i++) {
      var g = gains[i];
      var label = g.skill;
      for (var j = 0; j < this.skills.length; j++) {
        if (this.skills[j].id === g.skill) {
          label = this.skills[j].label;
          break;
        }
      }
      this.appendLog(
        "LEVEL UP! " +
          escapeHtml(label) +
          " " +
          escapeHtml(formatLevel(typeof g.to === "number" ? g.to : 0)),
        "career-levelup"
      );
    }
  };

  CareerPlayer.prototype.hideChoice = function () {
    this.choiceEl.hidden = true;
    this.choiceEl.setAttribute("aria-hidden", "true");
    this.choiceEl.innerHTML = "";
  };

  CareerPlayer.prototype.showBoot = function () {
    if (!this.bootEl) return;
    this.bootEl.hidden = false;
    this.bootEl.setAttribute("aria-hidden", "false");
  };

  CareerPlayer.prototype.hideBoot = function () {
    if (!this.bootEl) return;
    this.bootEl.hidden = true;
    this.bootEl.setAttribute("aria-hidden", "true");
  };

  CareerPlayer.prototype.showChoice = function (event, highlightId) {
    var opts = event.options || [];
    var html =
      '<p class="career-choice-prompt">' +
      (event.date ? "[" + escapeHtml(event.date) + "] " : "") +
      escapeHtml(event.text || "") +
      "</p>";
    html += '<div class="career-choice-options">';
    for (var i = 0; i < opts.length; i++) {
      var opt = opts[i];
      var checked = highlightId && opt.id === highlightId;
      var id = "career-opt-" + escapeHtml(opt.id);
      html +=
        '<section class="field-row career-choice-row' +
        (checked ? " is-chosen" : "") +
        '">' +
        '<input type="radio" name="career-choice" id="' +
        id +
        '" ' +
        (checked ? "checked " : "") +
        "disabled tabindex=\"-1\" />" +
        '<label for="' +
        id +
        '">' +
        escapeHtml(opt.label) +
        "</label>" +
        "</section>";
    }
    html += "</div>";
    this.choiceEl.innerHTML = html;
    this.choiceEl.hidden = false;
    this.choiceEl.setAttribute("aria-hidden", "false");
    this.scrollToCurrent();
  };

  CareerPlayer.prototype.setIdle = function () {
    this.clearTimer();
    this.state = "idle";
    this.index = 0;
    this.skipping = false;
    this.resetLevels();
    this.clearLog();
    this.hideChoice();
    this.hideBoot();
    this.hideEndModal();
    this.setStatusHeading();
    this.renderStatus();
    this.playBtn.hidden = false;
    this.board.hidden = true;
    this.setStageClass(null);
  };

  CareerPlayer.prototype.beginPlayback = function () {
    this.hideBoot();
    this.setStageClass("is-playing");
    this.state = "playing";
    this.step();
  };

  CareerPlayer.prototype.start = function () {
    this.clearTimer();
    this.state = "booting";
    this.index = 0;
    this.skipping = false;
    this.resetLevels();
    this.clearLog();
    this.hideChoice();
    this.hideEndModal();
    this.setStatusHeading();
    this.renderStatus();
    this.playBtn.hidden = true;
    this.board.hidden = false;
    this.setStageClass("is-booting");
    if (this.stage) {
      this.stage.style.setProperty("--career-boot-ms", this.bootMs + "ms");
    }
    this.scrollStageIntoView(400);
    this.showBoot();
    this.schedule(this.beginPlayback, this.bootMs);
  };

  CareerPlayer.prototype.finish = function () {
    this.clearTimer();
    this.state = "done";
    this.skipping = false;
    this.hideChoice();
    this.hideBoot();
    this.archiveCurrent();
    this.hideSplit();
    this.setStatusHeading();
    this.renderStatus();
    this.setStageClass("is-done");
    this.appendLogPast("— END —", "career-end");
    if (this.logScroll) {
      this.logScroll.scrollTop = this.logScroll.scrollHeight;
    }
    this.showEndModal();
  };

  CareerPlayer.prototype.replay = function () {
    this.setIdle();
  };

  CareerPlayer.prototype.step = function () {
    if (this.skipping || this.state !== "playing") return;

    if (this.index >= this.events.length) {
      this.finish();
      return;
    }

    var event = this.events[this.index];
    var type = event.type || "narrate";

    if (type === "choice") {
      this.playChoice(event);
      return;
    }

    this.playNarrate(event);
  };

  CareerPlayer.prototype.advance = function () {
    this.index += 1;
    this.schedule(this.step, this.tickMs);
  };

  CareerPlayer.prototype.playNarrate = function (event) {
    this.beginEventBlock();
    this.appendLog(
      (event.date ? "[" + escapeHtml(event.date) + "] " : "") +
        escapeHtml(event.text || "")
    );
    this.applyGains(event.gains);
    this.appendLevelUps(event.gains);
    this.advance();
  };

  CareerPlayer.prototype.playChoice = function (event) {
    var self = this;
    var opt = findOption(event.options || [], event.chosen);

    this.beginEventBlock();
    this.appendLog(
      (event.date ? "[" + escapeHtml(event.date) + "] " : "") +
        escapeHtml(event.text || "")
    );
    this.showChoice(event, null);

    this.schedule(function () {
      if (self.skipping || self.state !== "playing") return;
      self.showChoice(event, opt ? opt.id : null);

      self.schedule(function () {
        if (self.skipping || self.state !== "playing") return;

        if (opt) {
          self.appendLog(
            "> " + escapeHtml(opt.label),
            "career-choice-pick"
          );
          if (opt.result) {
            self.appendLog(escapeHtml(opt.result));
          }
          self.applyGains(opt.gains);
          self.appendLevelUps(opt.gains);
        }

        self.hideChoice();
        self.advance();
      }, self.choiceHoldMs);
    }, self.tickMs);
  };

  ready(function () {
    var root = document.querySelector("[data-career-root]");
    if (!root) return;

    fetch(DATA_URL)
      .then(function (res) {
        if (!res.ok) throw new Error("career.json " + res.status);
        return res.json();
      })
      .then(function (data) {
        var player = new CareerPlayer(root, data);
        player.setIdle();
      })
      .catch(function () {
        root.classList.add("is-error");
        var play = root.querySelector("[data-career-play]");
        if (play) {
          play.disabled = true;
          play.textContent = "!";
          play.setAttribute("aria-label", "이력 데이터를 불러오지 못했습니다");
        }
      });
  });
})();
