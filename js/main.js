/* ============================================
   DEV.FOLIO 交互脚本
   - 移动端导航 / 作品筛选 / 表单校验 / 滚动进场
   ============================================ */
(function () {
  "use strict";

  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 年份 ---------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ---------- 移动端菜单 ---------- */
  var menuToggle = document.getElementById("menuToggle");
  var navLinks = document.getElementById("navLinks");

  if (menuToggle && navLinks) {
    menuToggle.addEventListener("click", function () {
      var open = navLinks.classList.toggle("is-open");
      menuToggle.classList.toggle("is-open", open);
      menuToggle.setAttribute("aria-expanded", String(open));
      menuToggle.setAttribute("aria-label", open ? "关闭菜单" : "打开菜单");
    });

    navLinks.addEventListener("click", function (e) {
      if (e.target.closest("a")) {
        navLinks.classList.remove("is-open");
        menuToggle.classList.remove("is-open");
        menuToggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ---------- 作品筛选 ---------- */
  var filterBtns = document.querySelectorAll(".filter-btn");
  var cards = document.querySelectorAll(".project-card");

  filterBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      filterBtns.forEach(function (b) { b.classList.remove("is-active"); });
      btn.classList.add("is-active");

      var filter = btn.getAttribute("data-filter");
      cards.forEach(function (card) {
        var match = filter === "all" || card.getAttribute("data-category") === filter;
        card.classList.toggle("is-hidden", !match);
      });
    });
  });

  /* ---------- 表单校验与提交 ---------- */
  var form = document.getElementById("contactForm");
  var status = document.getElementById("formStatus");

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var fields = form.querySelectorAll(".form-input");
      var valid = true;

      fields.forEach(function (field) {
        field.classList.remove("is-error");
        var value = field.value.trim();
        var bad = !value;
        if (field.type === "email" && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          bad = true;
        }
        if (bad) {
          valid = false;
          field.classList.add("is-error");
        }
      });

      if (!valid) {
        status.textContent = "× 请完整填写所有字段（邮箱格式需正确）";
        status.className = "form-status is-bad";
        return;
      }

      var name = document.getElementById("name").value.trim();
      var email = document.getElementById("email").value.trim();
      var message = document.getElementById("message").value.trim();

      /* 静态站点: 通过 mailto 打开邮件客户端发送 */
      var subject = encodeURIComponent("[作品集] 来自 " + name + " 的消息");
      var body = encodeURIComponent(message + "\n\n—— " + name + " (" + email + ")");
      window.location.href = "mailto:2671749518@qq.com?subject=" + subject + "&body=" + body;

      status.textContent = "✓ 已为你打开邮件客户端，感谢留言！";
      status.className = "form-status is-ok";
      form.reset();
    });

    form.addEventListener("input", function (e) {
      if (e.target.classList.contains("form-input")) {
        e.target.classList.remove("is-error");
      }
    });
  }

  /* ---------- 滚动进场动效 ---------- */
  var revealTargets = document.querySelectorAll(
    ".project-card, .skill-card, .knowledge-card, .about-side, .section-head, .contact-form"
  );

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    revealTargets.forEach(function (el) { el.classList.add("is-visible"); });
  } else {
    revealTargets.forEach(function (el) { el.classList.add("reveal"); });

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    revealTargets.forEach(function (el) { observer.observe(el); });
  }
})();
