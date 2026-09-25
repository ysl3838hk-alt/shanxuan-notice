/**
 * 善玄精舍 — 儀式通告編輯器 (sample-v2 layout)
 */
(function () {
  "use strict";

  /** Default SAMPLE matches sample-v2.pdf for side-by-side verification */
  const SAMPLE = {
    title: "三師寶誕",
    lunarDate: "癸卯年四月十八日",
    solarDate: "2023年6月5日",
    weekday: "星期一",
    time: "晚上八時",
    pickDate: "2023-06-05",
    address: "香港灣仔駱克道348-350號恒發商業大廈3字樓 電話: 2528 3368",
    footer: "*工作人員必須於儀式開始前30分鐘到達預備",
    staff: [
      { role: "主禮生", type: "single", names: "杜緣義" },
      { role: "讚生", type: "single", names: "袁玉孝" },
      { role: "左貢生", type: "single", names: "袁研真" },
      { role: "右貢生", type: "single", names: "林慈芬" },
      { role: "魚生", type: "single", names: "陳樂慧" },
      { role: "罄生", type: "single", names: "苗啟修" },
      { role: "鼓生", type: "single", names: "黎承義" },
      { role: "宣祝生", type: "single", names: "羅立修" },
      { role: "鸞生", type: "single", names: "黃良凈" },
      { role: "推沙", type: "single", names: "韓趣儀" },
      { role: "記錄生", type: "multi", names: "陳研修、袁研真" },
      { role: "後備", type: "slots", slots: ["羅英慧", ""] },
      { role: "公關", type: "slots", slots: ["", ""] },
    ],
  };

  const WEEKDAYS = [
    "星期日",
    "星期一",
    "星期二",
    "星期三",
    "星期四",
    "星期五",
    "星期六",
  ];

  let state = null;

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  function cloneSample() {
    return JSON.parse(JSON.stringify(SAMPLE));
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /**
   * Spread role characters evenly across ~3 em slots (Excel 分散對齊).
   * First and last glyphs pinned; 2-char roles put 2nd char at last slot.
   */
  function distributeRole(role) {
    const chars = Array.from(String(role || "").replace(/\s/g, ""));
    if (chars.length === 0) {
      return `<span class="role-label role-distribute"></span>`;
    }
    if (chars.length === 1) {
      return `<span class="role-label role-distribute"><span class="role-ch">${escapeHtml(
        chars[0]
      )}</span></span>`;
    }
    const inner = chars
      .map((c) => `<span class="role-ch">${escapeHtml(c)}</span>`)
      .join("");
    return `<span class="role-label role-distribute">${inner}</span>`;
  }

  function formatSolar(y, m, d) {
    return `${y}年${m}月${d}日`;
  }

  function formatLunar(y, m, d) {
    if (typeof Solar === "undefined") {
      console.warn("lunar-javascript not loaded");
      return "";
    }
    const lunar = Solar.fromYmd(y, m, d).getLunar();
    const ganZhi = lunar.getYearInGanZhi();
    const month = lunar.getMonthInChinese(); // may include 闰
    const day = lunar.getDayInChinese();
    return `${ganZhi}年${month}月${day}日`;
  }

  function parsePickDate(value) {
    if (!value) return null;
    const parts = value.split("-").map(Number);
    if (parts.length !== 3 || parts.some((n) => !n && n !== 0)) return null;
    const [y, m, d] = parts;
    if (!y || !m || !d) return null;
    return { y, m, d };
  }

  function applyPickDate(value) {
    const parsed = parsePickDate(value);
    if (!parsed) return;
    const { y, m, d } = parsed;
    $("#f-solar").value = formatSolar(y, m, d);
    const dt = new Date(y, m - 1, d);
    $("#f-weekday").value = WEEKDAYS[dt.getDay()];
    const lunar = formatLunar(y, m, d);
    if (lunar) $("#f-lunar").value = lunar;
    state.pickDate = value;
    updatePreview();
  }

  function bindForm() {
    $("#f-title").value = state.title;
    $("#f-lunar").value = state.lunarDate;
    $("#f-solar").value = state.solarDate;
    $("#f-weekday").value = state.weekday;
    $("#f-time").value = state.time;
    $("#f-address").value = state.address;
    $("#f-footer").value = state.footer;
    if ($("#f-pick-date")) {
      $("#f-pick-date").value = state.pickDate || "";
    }
    renderStaffEditor();
  }

  function readFormBasics() {
    state.title = $("#f-title").value.trim();
    state.lunarDate = $("#f-lunar").value.trim();
    state.solarDate = $("#f-solar").value.trim();
    state.weekday = $("#f-weekday").value.trim();
    state.time = $("#f-time").value.trim();
    state.address = $("#f-address").value.trim();
    state.footer = $("#f-footer").value.trim();
    if ($("#f-pick-date")) {
      state.pickDate = $("#f-pick-date").value || "";
    }
  }

  function renderStaffEditor() {
    const list = $("#staff-list");
    list.innerHTML = "";
    state.staff.forEach((row, i) => {
      const el = document.createElement("div");
      el.className = "staff-row staff-row-fixed";
      el.dataset.index = String(i);

      const type = row.type || "single";
      const namesVal = type === "slots" ? "" : escapeHtml(row.names || "");

      el.innerHTML = `
        <div class="staff-row-top fixed-role">
          <span class="idx">${i + 1}</span>
          <span class="role-fixed" title="崗位固定">${escapeHtml(row.role || "")}</span>
        </div>
        <div class="staff-names-area"></div>
      `;

      const namesArea = $(".staff-names-area", el);
      if (type === "slots") {
        const slots = (row.slots && row.slots.length ? row.slots : ["", ""]).slice(0, 2);
        while (slots.length < 2) slots.push("");
        namesArea.innerHTML = `<div class="staff-slots"></div>`;
        const slotsEl = $(".staff-slots", namesArea);
        slots.forEach((s, si) => {
          slotsEl.appendChild(makeSlotRow(i, si, s));
        });
      } else {
        namesArea.innerHTML = `
          <div class="field" style="margin-top:6px;margin-bottom:0">
            <input type="text" class="f-names" placeholder="${
              type === "multi" ? "姓名（可用、分隔多人）" : "姓名"
            }" value="${namesVal}" />
            ${
              type === "multi"
                ? '<p class="hint">多人請用「、」分隔，例如：陳研修、袁研真</p>'
                : ""
            }
          </div>`;
      }

      list.appendChild(el);
    });
  }

  function makeSlotRow(staffIdx, slotIdx, value) {
    const row = document.createElement("div");
    row.className = "slot-row";
    row.innerHTML = `
      <span class="idx">${slotIdx + 1}</span>
      <input type="text" class="f-slot" data-slot="${slotIdx}" placeholder="姓名（可留空）" value="${escapeHtml(
      value || ""
    )}" />
    `;
    return row;
  }

  function syncStaffFromDom() {
    const rows = $$(".staff-row");
    rows.forEach((el, i) => {
      const cur = state.staff[i];
      if (!cur) return;
      if (cur.type === "slots") {
        const slots = $$(".f-slot", el).map((inp) => inp.value.trim());
        while (slots.length < 2) slots.push("");
        cur.slots = slots.slice(0, 2);
      } else {
        cur.names = ($(".f-names", el) && $(".f-names", el).value.trim()) || "";
      }
      // role and type stay fixed
    });
  }

  function updatePreview() {
    readFormBasics();
    if ($("#staff-list") && $("#staff-list").children.length) {
      syncStaffFromDom();
    }

    $("#p-contact").textContent = state.address;
    $("#p-title").textContent = state.title || "　";

    $("#p-date-lunar").textContent = state.lunarDate || "";
    let right = "";
    if (state.solarDate) right += state.solarDate;
    if (state.weekday) right += (right ? " " : "") + `(${state.weekday})`;
    if (state.time) right += (right ? " " : "") + state.time;
    $("#p-date-right").textContent = right;

    const tbody = $("#p-staff");
    tbody.innerHTML = "";
    state.staff.forEach((row, i) => {
      const tr = document.createElement("tr");
      tr.className =
        "staff-row-main" + (row.type === "slots" ? " has-slots" : "");
      const nameHtml = formatNameCell(row);
      // Half-width colon to match sample-v2
      tr.innerHTML = `
        <td class="col-num">${i + 1}</td>
        <td class="col-role">${distributeRole(row.role || "")}</td>
        <td class="col-colon">:</td>
        <td class="col-name">${nameHtml}</td>
      `;
      tbody.appendChild(tr);
    });

    const footer = state.footer || "";
    const body = footer.startsWith("*") ? footer.slice(1) : footer;
    $("#p-footer").innerHTML = `<span class="star">*</span>${escapeHtml(body)}`;
  }

  function formatNameCell(row) {
    if (row.type === "slots") {
      const slots = row.slots || [];
      const items = slots
        .map(
          (s, i) =>
            `<li><span class="sub-num">${i + 1}</span>${escapeHtml(
              s || ""
            )}</li>`
        )
        .join("");
      return `<ul class="sub-list">${items}</ul>`;
    }
    return escapeHtml(row.names || "");
  }

  function onStaffChange(e) {
    const t = e.target;
    if (!t.classList.contains("f-names") && !t.classList.contains("f-slot")) {
      return;
    }
    updatePreview();
  }

  function loadSample() {
    state = cloneSample();
    bindForm();
    updatePreview();
  }

  function suggestedFilename() {
    const title = (state.title || "通告").replace(/[\\/:*?"<>|]/g, "_");
    const solar = (state.solarDate || "").replace(/[\\/:*?"<>|]/g, "_");
    return solar ? `${title}_${solar}.pdf` : `${title}.pdf`;
  }

  function exportPdf() {
    readFormBasics();
    syncStaffFromDom();
    updatePreview();
    const prev = document.title;
    document.title = suggestedFilename().replace(/\.pdf$/i, "");
    window.print();
    setTimeout(() => {
      document.title = prev;
    }, 500);
  }

  function init() {
    state = cloneSample();
    bindForm();
    updatePreview();

    [
      "f-title",
      "f-lunar",
      "f-solar",
      "f-weekday",
      "f-time",
      "f-address",
      "f-footer",
    ].forEach((id) => {
      $(`#${id}`).addEventListener("input", updatePreview);
    });

    $("#f-pick-date").addEventListener("change", (e) => {
      applyPickDate(e.target.value);
    });
    $("#f-pick-date").addEventListener("input", (e) => {
      if (e.target.value) applyPickDate(e.target.value);
    });

    $("#staff-list").addEventListener("input", onStaffChange);

    $("#btn-load-sample").addEventListener("click", () => {
      if (confirm("載入樣本會覆蓋目前內容，確定？")) loadSample();
    });
    $("#btn-export").addEventListener("click", exportPdf);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
