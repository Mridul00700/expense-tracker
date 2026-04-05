const form = document.getElementById("expense-form");
const list = document.getElementById("expense-list");
const totalEl = document.getElementById("total");
console.log("DB in app.js:", window.db);
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const expense = {
    amount: Number(document.getElementById("amount").value),
    category: document.getElementById("category").value,
    note: "",
    date: new Date().toISOString()
  };

  await db.expenses.add(expense);

  form.reset();
  loadExpenses();
});

async function loadExpenses() {
  const expenses = await db.expenses.toArray();

  list.innerHTML = "";

  // Group by month
  const grouped = {};

  expenses.forEach(exp => {
    const date = new Date(exp.date);
    const key = `${date.getFullYear()}-${date.getMonth()}`;

    if (!grouped[key]) {
      grouped[key] = [];
    }

    grouped[key].push(exp);
  });

  // Sort months (latest first)
  const sortedKeys = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  let grandTotal = 0;

  sortedKeys.forEach(key => {
    const [year, month] = key.split("-");
    const monthName = new Date(year, month).toLocaleString("default", {
      month: "long",
      year: "numeric"
    });

    const section = document.createElement("div");

    // Calculate monthly total
    let monthlyTotal = 0;
    grouped[key].forEach(e => monthlyTotal += e.amount);
    grandTotal += monthlyTotal;

    section.innerHTML = `
      <div class="month-header">
        <div>
          <div class="month-title">${monthName}</div>
          <div class="month-total">₹${monthlyTotal}</div>
        </div>
      </div>
    `;

    grouped[key]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .forEach(exp => {
        const card = document.createElement("div");
        card.className = "card";

        card.innerHTML = `
          <div class="card-left">
            <div class="category">${exp.category}</div>
            <div class="note">${new Date(exp.date).toDateString()}</div>
          </div>
          <div class="amount">₹${exp.amount}</div>
        `;

        section.appendChild(card);
      });

    list.appendChild(section);
  });

  totalEl.textContent = `₹${grandTotal}`;
}

loadExpenses();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/expense-tracker/service-worker.js")
      .then(reg => {
        console.log("Service Worker registered", reg);
      })
      .catch(err => {
        console.log("Service Worker failed", err);
      });
  });
}

let newWorker;

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/service-worker.js").then(reg => {

    reg.addEventListener("updatefound", () => {
      newWorker = reg.installing;

      newWorker.addEventListener("statechange", () => {
        if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
          showUpdateBanner();
        }
      });
    });
  });
}

// Show update UI
function showUpdateBanner() {
  const banner = document.createElement("div");
  banner.innerHTML = `
    <div style="
      position: fixed;
      bottom: 80px;
      left: 10px;
      right: 10px;
      background: black;
      color: white;
      padding: 12px;
      border-radius: 10px;
      text-align: center;
    ">
      New version available
      <button id="update-btn" style="margin-left:10px;">Update</button>
    </div>
  `;

  document.body.appendChild(banner);

  document.getElementById("update-btn").onclick = () => {
    newWorker.postMessage("SKIP_WAITING");
    window.location.reload();
  };
}

document.getElementById("export-btn").onclick = async () => {
  const data = await db.expenses.toArray();

  const blob = new Blob([JSON.stringify(data)], {
    type: "application/json"
  });

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "expenses-backup.json";
  a.click();
};

const fileInput = document.getElementById("file-input");

document.getElementById("import-btn").onclick = () => {
  fileInput.click();
};

fileInput.onchange = async (e) => {
  const file = e.target.files[0];
  const text = await file.text();
  const data = JSON.parse(text);

  await db.expenses.clear();
  await db.expenses.bulkAdd(data);

  loadExpenses();
};