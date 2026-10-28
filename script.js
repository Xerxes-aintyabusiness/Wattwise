const appliances = [
  { id: 1, name: "Electric Fan", watts: 65, kwh: 32, cost: 256, on: true },
  { id: 2, name: "Refrigerator", watts: 150, kwh: 45, cost: 360, on: true },
  { id: 3, name: "Television", watts: 100, kwh: 18, cost: 144, on: false }
];

let monthlyBudget = 2000;
let selectedAppliance = null;
let idleMode = [];
let awayMode = false;
let schedules = [];
let usageHistory = [];

const ratePerKwh = 8;

const pageContent = document.getElementById("pageContent");

function updateSummary() {
  const cost = appliances.reduce((sum, a) => sum + a.cost, 0);

  const watts = appliances
    .filter(a => a.on)
    .reduce((sum, a) => sum + a.watts, 0);

  document.getElementById("estimatedCost").textContent =
    "₱" + cost.toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

  document.getElementById("totalWattage").textContent = watts + " W";
}

function showPage(page) {
  switch (page) {
    case "history":
      renderHistory();
      break;
    case "scheduler":
      renderScheduler();
      break;
    case "appliances":
      renderAddAppliance();
      break;
    case "list":
      renderApplianceList();
      break;
    case "features":
      renderFeatures();
      break;
    case "notifications":
      renderNotifications();
      break;
    default:
      pageContent.innerHTML = "<h2>Dashboard</h2>";
  }
}

document.querySelectorAll(".menu-card").forEach(button => {
  button.addEventListener("click", () => {
    showPage(button.dataset.page);
  });
});

function renderApplianceList() {
  const sorted = [...appliances].sort((a, b) => b.cost - a.cost);

  pageContent.innerHTML = `
    <h2>Added Appliances</h2>
    <p>Ranked from highest to lowest estimated monthly cost.</p>
    <div id="applianceItems"></div>
    <div class="form-group">
      <label>Monthly budget (₱)</label>
      <input type="number" id="budgetInput" min="1"
        value="${monthlyBudget}">
    </div>
    <button class="action-button" id="saveBudget">Save Budget</button>
    <div id="budgetStatus"></div>
  `;

  const list = document.getElementById("applianceItems");

  sorted.forEach((a, index) => {
    const item = document.createElement("div");
    item.className = "appliance";

    const info = document.createElement("div");
    info.className = "appliance-info";

    const name = document.createElement("strong");
    name.textContent = `${index + 1}. ${a.name}`;

    const detail = document.createElement("small");
    detail.textContent = `${a.watts} W · ${a.kwh} kWh · ₱${a.cost.toFixed(2)}/month`;

    info.append(name, detail);

    const button = document.createElement("button");
    button.className = "action-button";
    button.textContent = "Details";
    button.addEventListener("click", () => {
      selectedAppliance = a.id;
      renderApplianceDetails(a.id);
    });

    item.append(info, button);
    list.appendChild(item);
  });

  document.getElementById("saveBudget").addEventListener("click", () => {
    const value = Number(document.getElementById("budgetInput").value);

    if (!Number.isFinite(value) || value <= 0) {
      alert("Please enter a valid budget.");
      return;
    }

    monthlyBudget = value;
    renderBudgetStatus();
  });

  renderBudgetStatus();
}

function renderBudgetStatus() {
  const cost = appliances.reduce((sum, a) => sum + a.cost, 0);
  const percentage = cost / monthlyBudget * 100;
  const remaining = monthlyBudget - cost;

  const status = document.getElementById("budgetStatus");
  if (!status) return;

  const fillColor = percentage >= 100 ? "#c73e3e"
    : percentage >= 80 ? "#e3a329" : "#29966b";

  status.innerHTML = `
    <h3>Monthly Budget</h3>
    <p>₱${cost.toFixed(2)} of ₱${monthlyBudget.toFixed(2)} used
      (${percentage.toFixed(1)}%)</p>
    <div class="budget-track">
      <div class="budget-fill"
        style="width:${Math.min(percentage, 100)}%;background:${fillColor}">
      </div>
    </div>
    <p>${remaining >= 0
      ? "₱" + remaining.toFixed(2) + " remaining"
      : "₱" + Math.abs(remaining).toFixed(2) + " over budget"}</p>
    ${percentage >= 100
      ? '<div class="notice">Budget reached or exceeded!</div>'
      : percentage >= 80
        ? '<div class="notice">Warning: Your budget is almost full.</div>'
        : ""}
  `;
}

function renderApplianceDetails(id) {
  const a = appliances.find(item => item.id === id);
  if (!a) return;

  pageContent.innerHTML = `
    <button class="action-button" id="backToList">← Back to List</button>
    <h2 style="margin-top:20px">${escapeHTML(a.name)}</h2>
    <p>Estimated monthly cost: ₱${a.cost.toFixed(2)}</p>
    <p>Power rating: ${a.watts} W</p>
    <p>Energy consumed: ${a.kwh} kWh</p>

    <div class="form-group">
      <label>Daily energy limit (kWh)</label>
      <input id="energyLimit" type="number" min="0.1" step="0.1"
        value="${a.limit || 2}">
    </div>

    <button class="action-button" id="saveLimit">Save Limit</button>
    <button class="action-button ${a.on ? "off" : ""}" id="togglePower">
      Turn ${a.on ? "OFF" : "ON"}
    </button>

    <p id="limitMessage" style="margin-top:12px"></p>
  `;

  document.getElementById("backToList").onclick = renderApplianceList;

  document.getElementById("saveLimit").onclick = () => {
    const limit = Number(document.getElementById("energyLimit").value);

    if (!Number.isFinite(limit) || limit <= 0) {
      alert("Enter a valid energy limit.");
      return;
    }

    a.limit = limit;
    document.getElementById("limitMessage").textContent =
      "Daily energy limit saved.";
  };

  document.getElementById("togglePower").onclick = () => {
    a.on = !a.on;
    updateSummary();
    renderApplianceDetails(id);
  };
}

function renderAddAppliance() {
  pageContent.innerHTML = `
    <h2>Add Appliance</h2>
    <div class="form-group">
      <label>Appliance name</label>
      <input id="newName" placeholder="e.g. Rice Cooker">
    </div>
    <div class="form-group">
      <label>Power rating (watts)</label>
      <input id="newWatts" type="number" min="1" placeholder="e.g. 700">
    </div>
    <div class="form-group">
      <label>Estimated usage (hours per day)</label>
      <input id="newHours" type="number" min="0" max="24"
        step="0.5" value="4">
    </div>
    <button class="action-button" id="addDevice">Add Appliance</button>
  `;

  document.getElementById("addDevice").onclick = () => {
    const name = document.getElementById("newName").value.trim();
    const watts = Number(document.getElementById("newWatts").value);
    const hours = Number(document.getElementById("newHours").value);

    if (!name || !Number.isFinite(watts) || watts <= 0 ||
        !Number.isFinite(hours) || hours < 0 || hours > 24) {
      alert("Please enter a name, valid wattage, and usage from 0 to 24 hours.");
      return;
    }

    const kwh = watts * hours * 30 / 1000;

    appliances.push({
      id: Date.now(),
      name,
      watts,
      kwh,
      cost: kwh * ratePerKwh,
      on: false
    });

    updateSummary();
    renderApplianceList();
  };
}

function renderFeatures() {
  pageContent.innerHTML = `
    <h2>Smart Features</h2>

    <div class="appliance">
      <div class="appliance-info">
        <strong>Away Mode</strong>
        <small>Manage selected appliances when away.</small>
      </div>
      <button class="action-button" id="awayToggle">
        ${awayMode ? "Disable" : "Enable"}
      </button>
    </div>

    <h3>Idle Mode</h3>
    <p>Choose appliances for idle monitoring.</p>
    <div id="idleDevices"></div>
  `;

  document.getElementById("awayToggle").onclick = () => {
    awayMode = !awayMode;
    renderFeatures();
  };

  const idleDevices = document.getElementById("idleDevices");

  appliances.forEach(a => {
    const row = document.createElement("div");
    row.className = "appliance";

    const label = document.createElement("label");
    label.textContent = a.name;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = idleMode.includes(a.id);

    checkbox.addEventListener("change", () => {
      if (checkbox.checked) {
        if (!idleMode.includes(a.id)) idleMode.push(a.id);
      } else {
        idleMode = idleMode.filter(id => id !== a.id);
      }
    });

    row.append(label, checkbox);
    idleDevices.appendChild(row);
  });
}

function renderScheduler() {
  pageContent.innerHTML = `
    <h2>Appliance Scheduler</h2>
    <div class="form-group">
      <label>Appliance</label>
      <select id="scheduleDevice">
        ${appliances.map(a =>
          `<option value="${a.id}">${escapeHTML(a.name)}</option>`
        ).join("")}
      </select>
    </div>
    <div class="form-group">
      <label>Action</label>
      <select id="scheduleAction">
        <option value="OFF">Turn OFF</option>
        <option value="ON">Turn ON</option>
      </select>
    </div>
    <div class="form-group">
      <label>Time</label>
      <input id="scheduleTime" type="time" value="22:00">
    </div>
    <div class="form-group">
      <label>Repeat (Monday to Sunday)</label>
      <div class="days-checkbox-group">
        <label><input type="checkbox" name="schedDay" value="Monday" checked> Mon</label>
        <label><input type="checkbox" name="schedDay" value="Tuesday" checked> Tue</label>
        <label><input type="checkbox" name="schedDay" value="Wednesday" checked> Wed</label>
        <label><input type="checkbox" name="schedDay" value="Thursday" checked> Thu</label>
        <label><input type="checkbox" name="schedDay" value="Friday" checked> Fri</label>
        <label><input type="checkbox" name="schedDay" value="Saturday" checked> Sat</label>
        <label><input type="checkbox" name="schedDay" value="Sunday" checked> Sun</label>
      </div>
    </div>
    <button class="action-button" id="addSchedule">Add Schedule</button>
    
    <h3 style="margin-top: 30px;">Active Schedules</h3>
    <div id="scheduleItems"></div>
  `;

  document.getElementById("addSchedule").onclick = () => {
    const id = Number(document.getElementById("scheduleDevice").value);
    const action = document.getElementById("scheduleAction").value;
    const timeVal = document.getElementById("scheduleTime").value;
    const appliance = appliances.find(a => a.id === id);

    let [hours, minutes] = timeVal.split(":");
    hours = parseInt(hours);
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    const formattedTime = `${hours}:${minutes} ${ampm}`;

    const checkedDays = Array.from(document.querySelectorAll('input[name="schedDay"]:checked'))
      .map(cb => cb.value);
    
    const repeatText = checkedDays.length === 7 ? "Monday to Sunday" : checkedDays.join(", ");

    const protectedNames = ["refrigerator", "router"];

    if (protectedNames.some(name =>
      appliance.name.toLowerCase().includes(name)) ||
      /medical|life support/i.test(appliance.name)) {
      alert("Scheduling blocked: this appliance is protected by the safety rules.");
      return;
    }

    schedules.push({ id, action, time: formattedTime, repeat: repeatText || "None" });
    renderScheduler();
  };

  const list = document.getElementById("scheduleItems");
  list.innerHTML = "";

  if (schedules.length === 0) {
    list.innerHTML = `<p style="color: var(--muted); margin-top: 10px;">No schedules added yet.</p>`;
    return;
  }

  schedules.forEach(s => {
    const a = appliances.find(item => item.id === s.id);
    const row = document.createElement("div");
    row.className = "appliance";

    const info = document.createElement("div");
    info.className = "appliance-info";

    info.innerHTML = `
      <strong>Appliance</strong>
      <small style="margin-bottom: 4px;">&nbsp;&nbsp;&nbsp;&nbsp;${a ? escapeHTML(a.name) : "Unknown"}</small>
      <strong>Action</strong>
      <small style="margin-bottom: 4px;">&nbsp;&nbsp;&nbsp;&nbsp;Turn ${s.action}</small>
      <strong>Time</strong>
      <small style="margin-bottom: 4px;">&nbsp;&nbsp;&nbsp;&nbsp;${s.time}</small>
      <strong>Repeat</strong>
      <small>&nbsp;&nbsp;&nbsp;&nbsp;(${s.repeat})</small>
    `;

    row.appendChild(info);
    list.appendChild(row);
  });
}

function renderHistory() {
  pageContent.innerHTML = `
    <h2>Usage History</h2>
    <div class="form-group">
      <label>History period</label>
      <select id="historyPeriod">
        <option value="Daily">Daily</option>
        <option value="Weekly">Weekly</option>
        <option value="Monthly">Monthly</option>
      </select>
    </div>
    <p id="historyMessage">Your saved usage records will appear here.</p>
    <div id="historyTable"></div>
  `;

  document.getElementById("historyPeriod").onchange = event => {
    const period = event.target.value;
    document.getElementById("historyMessage").textContent =
      `${period} usage history`;
    renderHistoryTable();
  };

  renderHistoryTable();
}

function renderHistoryTable() {
  const table = document.getElementById("historyTable");
  if (!table) return;

  table.replaceChildren();

  if (usageHistory.length === 0) {
    table.textContent = "No usage history recorded yet.";
    return;
  }

  usageHistory.forEach(record => {
    const row = document.createElement("p");
    row.textContent =
      `${record.date} · ${record.name} · ${record.kwh.toFixed(2)} kWh · ₱${record.cost.toFixed(2)}`;
    table.appendChild(row);
  });
}

function renderNotifications() {
  pageContent.innerHTML = `
    <h2>Notifications</h2>
    <div class="appliance">
      <div class="appliance-info">
        <strong>Phantom Load Detector</strong>
        <small>Your TV may be consuming power while off.</small>
      </div>
      <button class="action-button" id="idleAlert">View</button>
    </div>
    <div class="appliance">
      <div class="appliance-info">
        <strong>Wattage Alert</strong>
        <small>Review appliance power consumption.</small>
      </div>
      <button class="action-button" id="powerAlert">View</button>
    </div>
  `;

  document.getElementById("idleAlert").onclick = () => {
    showPage("features");
  };

  document.getElementById("powerAlert").onclick = () => {
    showPage("list");
  };
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

updateSummary();
renderApplianceList();