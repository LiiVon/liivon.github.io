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

  /* ---------- 项目详情弹窗 ---------- */
  var PROJECT_DETAILS = {
    perf: {
      title: "可视化 Linux 系统性能监控平台",
      meta: "独立开发者 | 2026.01 - 2026.04",
      background: "面向多服务节点集群，解决缺乏统一性能监控、异常快速定位困难的问题。",
      stack: ["C++", "Linux 内核模块", "eBPF/libbpf", "TC Hook", "gRPC", "Protobuf", "MySQL", "Qt6"],
      results: [
        "开发内核模块，利用 mmap 将 CPU 统计数据零拷贝映射到用户态，结合 /proc/stat 回退机制，兼顾采集性能与运行稳定性。",
        "基于 libbpf 实现 eBPF TC Hook 网络监控，在网卡 Ingress/Egress 路径原子累加流量与包计数，支持速率计算。",
        "设计 Push 模式分布式通信链路，Worker 周期性推送采集信息至 Manager，Manager 端完成主机识别、评分计算、变化率分析与离线节点清理。",
        "构建 gRPC 接口与 MySQL 持久化查询体系，设计 5 张业务表存储主表、网络、磁盘、内存、软中断明细及变化率数据，支持历史查询、趋势聚合与异常分析。",
        "实现多维加权健康评分模型，综合 CPU、内存、负载、磁盘、网络指标生成主机评分，为调度和异常定位提供统一参考。",
        "基于 Qt 6 开发可视化看板，通过 HTTP/JSON 接口实时拉取最新数据，支持 6 个 Tab 页面、多主机切换、3 秒自动刷新与趋势展示。",
        "设计三层自动降级策略：eBPF 加载失败回退 /proc/net/dev，内核模块 open 失败回退 /proc/stat，确保在非特权环境或能力受限机器上仍可正常运行。"
      ],
      repo: "https://github.com/LiiVon/perf_monitor"
    },
    cloud: {
      title: "AI 智能云存储系统",
      meta: "独立开发者 | 2026.04 - 2026.07",
      background: "面向个人/小团队文件管理需求，解决多格式文件检索效率低、查找不便的问题。",
      stack: ["C/C++", "MySQL", "Redis", "Nginx", "FastDFS", "FastCGI", "Docker", "FAISS", "DashScope"],
      results: [
        "基于 FastDFS 实现文件上传、下载、删除；上传前计算文件 MD5 并在服务端查重，已存在则直接秒传，避免重复存储。",
        "实现大文件分片上传：前端分片并标记序号，服务端按序接收，全部完成后合并为完整文件，支持断点续传。",
        "使用 Nginx 作为 HTTP 服务器与反向代理，将动态请求转发至 FastCGI 进程，实现动静分离；13 个 API 接口各自独立进程运行，互不影响。",
        "使用 MySQL 持久化用户账号与文件元数据，Redis 缓存用户会话与下载排行榜；两端数据不一致时从 MySQL 懒重建缓存。",
        "基于引用计数实现去重与延迟删除：多用户引用同一物理文件时只存一份，引用计数归零才执行物理删除，避免误删共享文件。",
        "实现文件分享与图床功能，提取码控制访问，取消分享时递减引用计数，归零触发物理清理。",
        "基于阿里百炼大模型 API + FAISS 实现 AI 语义搜索：图片经多模态模型生成文本描述，与文档内容统一做 Embedding 写入向量索引，搜索时按余弦相似度召回相关文件；相同文件复用向量缓存，避免重复调用 API。",
        "使用 Docker Compose 编排 MySQL、Nginx+FastDFS、FastCGI 应用三个容器，一键完成部署。"
      ],
      repo: "https://github.com/LiiVon/AI_YunCunChu"
    },
    reactor: {
      title: "Light Reactor 网络框架",
      meta: "开源项目 | 独立开发",
      background: "面向高并发 TCP 服务的 C++17 Reactor 网络框架，当前支持 Windows / Linux 双平台。",
      stack: ["C++17", "epoll/WSPoll", "主从 Reactor", "yaml-cpp", "线程池", "Prometheus"],
      results: [
        "主从 Reactor 模型：主循环负责 accept 新连接，子循环负责 IO 事件与回调处理，One Loop Per Thread。",
        "跨平台 Socket 抽象层与 Poller 工厂：Linux 下 EpollPoller，Windows 下 WSPollPoller。",
        "完整定时器能力（RunAfter/RunAt/RunEvery/Cancel），连接空闲超时回收与周期运行状态统计。",
        "内置 4 字节长度头协议编解码器，处理 TCP 半包/粘包；支持 PING-PONG 心跳。",
        "支持优雅停机：停止接入、等待在途发送完成、超时强制关闭；背压高水位回调保护慢连接。",
        "线程安全的异步日志系统（多输出器）、基于 yaml-cpp 的配置模块、Prometheus 文本格式指标导出。",
        "完整单测/集测体系、故障注入脚本与 GitHub Actions 双平台 CI，附 Echo 压测脚本与性能报告。"
      ],
      repo: "https://github.com/LiiVon/Cpp--Reactor-Framework"
    },
    miniorm: {
      title: "MiniORM",
      meta: "开源项目 | 独立开发",
      background: "轻量级、现代化的 C++20 对象关系映射（ORM）框架，目标是在统一抽象下展示查询构建、实体映射、连接管理与数据库适配的完整实现路径。",
      stack: ["C++20", "concepts/constexpr", "MySQL", "CMake", "模板元编程"],
      results: [
        "链式 QueryBuilder：将 select/insert/update/delete 用链式 API 表达，自动拼接条件、排序与分页。",
        "实体映射与 EntityMetadata 反射元数据：实体与数据库列双向映射，自动序列化/反序列化。",
        "RAII 连接池与 ScopedTransaction 事务管理，begin/commit/rollback 自动化，资源释放自动完成。",
        "运用 C++20 concepts 编译期约束实体与字段类型，CRTP 实体基类与模板元编程实现类型安全。",
        "MySQL 直连适配 + 内存型回退实现，适配器工厂抽象，便于扩展其他数据库。",
        "完整单元测试体系（ctest），无真实数据库也可验证实体与查询逻辑。"
      ],
      repo: "https://github.com/LiiVon/MiniORM"
    }
  };

  var overlay = document.getElementById("modalOverlay");
  var modalTitle = document.getElementById("modalTitle");
  var modalMeta = document.getElementById("modalMeta");
  var modalBody = document.getElementById("modalBody");
  var modalRepo = document.getElementById("modalRepo");
  var modalClose = document.getElementById("modalClose");

  function openDetail(key) {
    var d = PROJECT_DETAILS[key];
    if (!d || !overlay) { return; }

    modalTitle.textContent = d.title;
    modalMeta.textContent = d.meta;

    var html = "<h4 class=\"modal-label\">// 项目背景</h4>";
    html += "<p class=\"modal-text\">" + d.background + "</p>";
    html += "<h4 class=\"modal-label\">// 技术栈</h4><div class=\"card-tags\">";
    d.stack.forEach(function (t) { html += "<span class=\"tag\">" + t + "</span>"; });
    html += "</div>";
    html += "<h4 class=\"modal-label\">// 主要内容与成果</h4><ol class=\"modal-results\">";
    d.results.forEach(function (r) { html += "<li>" + r + "</li>"; });
    html += "</ol>";
    modalBody.innerHTML = html;

    modalRepo.setAttribute("href", d.repo);
    overlay.classList.add("is-open");
    document.body.classList.add("modal-open");
    modalClose.focus();
  }

  function closeDetail() {
    if (!overlay) { return; }
    overlay.classList.remove("is-open");
    document.body.classList.remove("modal-open");
  }

  if (overlay) {
    cards.forEach(function (card) {
      card.addEventListener("click", function (e) {
        if (e.target.closest("a")) { return; } /* 链接照常跳转 */
        openDetail(card.getAttribute("data-detail"));
      });
      card.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openDetail(card.getAttribute("data-detail"));
        }
      });
    });

    modalClose.addEventListener("click", closeDetail);
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) { closeDetail(); }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { closeDetail(); }
    });
  }

  /* ---------- 微信二维码放大预览 ---------- */
  var wechatCard = document.getElementById("wechatCard");
  var qrLightbox = document.getElementById("qrLightbox");

  function openQr() {
    if (!qrLightbox) { return; }
    qrLightbox.classList.add("is-open");
    document.body.classList.add("modal-open");
  }

  function closeQr() {
    if (!qrLightbox) { return; }
    qrLightbox.classList.remove("is-open");
    document.body.classList.remove("modal-open");
  }

  if (wechatCard && qrLightbox) {
    wechatCard.addEventListener("click", openQr);
    wechatCard.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openQr();
      }
    });
    qrLightbox.addEventListener("click", function (e) {
      if (e.target === qrLightbox) { closeQr(); }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { closeQr(); }
    });
  }
})();
