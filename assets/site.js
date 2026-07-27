const body = document.body;
const page = body.dataset.page || "menu";
const root = body.dataset.root || ".";

const links = [
  ["menu", "MENU", `${root}/`],
  ["info", "INFO", `${root}/info/`],
  ["progress", "PROGRESS", `${root}/progress/`],
  ["logs", "LOGS", `${root}/logs/`],
  ["contact", "CONTACT", `${root}/contact/`],
];

const navLinks = links.map(([id, label, href]) => {
  const active = id === page;
  return `<a href="${href}" class="${active ? "active" : ""}"${active ? ' aria-current="page"' : ""}>${label}</a>`;
}).join("");

body.insertAdjacentHTML("afterbegin", `
  <header class="siteHeader ${page === "menu" ? "overlay" : ""}">
    <nav class="nav shell" aria-label="主导航">
      <a class="brand" href="${root}/"><span>R</span>RIM <i>PROJECT</i></a>
      <div class="navlinks">${navLinks}</div>
      <a class="status" href="${root}/progress/"><b></b> LIVE ROADMAP</a>
    </nav>
  </header>
`);

body.insertAdjacentHTML("beforeend", `
  <footer>
    <div class="shell">
      <div class="brand"><span>R</span>RIM <i>PROJECT</i></div>
      <p>一群朋友共同制作的非商业同人项目。<br>愿我们终能抵达。</p>
      <small>《明日方舟》及相关角色版权归 HYPERGRYPH 所有。<br>© 2026 RIM DEV TEAM</small>
    </div>
  </footer>
`);

const statusText = {
  todo: "待办",
  in_progress: "进行中",
  done: "已完成",
};

const dataUrl = `${root}/data/progress.json`;

async function loadProgressData() {
  const response = await fetch(dataUrl, { cache: "no-store" });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

function formatDate(value) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

function formatTime(value) {
  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

async function renderProgress() {
  const phaseList = document.querySelector("#phaseList");
  if (!phaseList) return;
  const loading = document.querySelector("#progressLoading");

  try {
    const data = await loadProgressData();
    const items = data.items || [];
    const done = items.filter(item => item.status === "done").length;
    const active = items.filter(item => item.status === "in_progress").length;
    const percent = items.length ? Math.round(done / items.length * 100) : 0;
    const phases = [...new Set(items.map(item => item.phase))];

    document.querySelector("#totalTasks").textContent = String(items.length);
    document.querySelector("#doneTasks").textContent = String(done);
    document.querySelector("#activeTasks").textContent = String(active);
    document.querySelector("#overallPercent").textContent = String(percent);
    document.querySelector("#updatedAt").textContent = formatDate(data.updated_at);
    document.querySelector("#overallRadial").style.setProperty("--p", `${percent * 3.6}deg`);

    phaseList.innerHTML = phases.map((phase, phaseIndex) => {
      const phaseItems = items.filter(item => item.phase === phase);
      const phaseDone = phaseItems.filter(item => item.status === "done").length;
      const phasePercent = Math.round(phaseDone / phaseItems.length * 100);
      const tasks = phaseItems.map(item => `
        <article class="task ${item.status}">
          <span class="staticCheck" aria-hidden="true">${item.status === "done" ? "✓" : item.status === "in_progress" ? "→" : ""}</span>
          <div class="taskCopy"><h4>${item.title}</h4><p>${item.detail}</p></div>
          <span class="target">${item.target}</span>
          <span class="stateBadge ${item.status}">${statusText[item.status] || item.status}</span>
        </article>
      `).join("");

      return `
        <section class="phaseBlock">
          <header>
            <div class="phaseIndex">${String(phaseIndex + 1).padStart(2, "0")}</div>
            <div><h3>${phase}</h3><p>${phaseDone} / ${phaseItems.length} 项完成</p></div>
            <div class="phaseBar"><i style="width:${phasePercent}%"></i></div>
            <b>${phasePercent}%</b>
          </header>
          <div class="taskList">${tasks}</div>
        </section>
      `;
    }).join("");
    loading.remove();
  } catch {
    loading.textContent = "暂时无法读取路线图数据，请稍后刷新。";
    loading.classList.add("error");
  }
}

async function renderLogs() {
  const timeline = document.querySelector("#timeline");
  if (!timeline) return;

  try {
    const data = await loadProgressData();
    const updates = data.updates || [];
    timeline.innerHTML = updates.length ? updates.map((update, index) => `
      <article>
        <div class="timelineNo">${String(index + 1).padStart(2, "0")}</div>
        <time>${formatDate(update.created_at)}<small>${formatTime(update.created_at)}</small></time>
        <div><span>${update.action}</span><h3>${update.title}</h3></div>
      </article>
    `).join("") : '<p class="empty">第一条更新将在任务状态变化后出现。</p>';
  } catch {
    timeline.innerHTML = '<p class="empty error">暂时无法读取开发日志，请稍后刷新。</p>';
  }
}

renderProgress();
renderLogs();
