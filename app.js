const form = document.getElementById("expense-form");
const list = document.getElementById("expense-list");
const totalEl = document.getElementById("total");
const progressBar = document.getElementById("progress-bar");
const insightEl = document.getElementById("insight");

const budgetInput = document.getElementById("budget-input");
const saveBudgetBtn = document.getElementById("save-budget");

const exportBtn = document.getElementById("export-btn");
const importBtn = document.getElementById("import-btn");
const fileInput = document.getElementById("file-input");

const categorySelect = document.getElementById("category");
const customCategoryInput = document.getElementById("custom-category");

let monthlyBudget = localStorage.getItem("budget") || 0;
budgetInput.value = monthlyBudget;

const categoryMap = {
  Food: { icon: "🍔" },
  Travel: { icon: "🚗" },
  Shopping: { icon: "🛍️" },
  Bills: { icon: "💡" }
};

/* SHOW CUSTOM CATEGORY INPUT */
categorySelect.addEventListener("change", () => {
  if (categorySelect.value === "Others") {
    customCategoryInput.style.display = "block";
  } else {
    customCategoryInput.style.display = "none";
  }
});

/* SAVE BUDGET */
saveBudgetBtn.onclick = () => {
  let val = Number(budgetInput.value);
  if (val < 0) val = 0;

  monthlyBudget = val;
  budgetInput.value = val;

  localStorage.setItem("budget", monthlyBudget);
  loadExpenses();
};

/* ADD EXPENSE */
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  let category = categorySelect.value;

  if (category === "Others") {
    category = customCategoryInput.value || "Others";
  }

  const expense = {
    amount: Number(document.getElementById("amount").value),
    category: category,
    date: new Date().toISOString()
  };

  await db.expenses.add(expense);

  form.reset();
  customCategoryInput.style.display = "none";

  loadExpenses();
});

/* DELETE */
list.addEventListener("click", async (e) => {
  const card = e.target.closest(".card");
  if (!card) return;

  const id = Number(card.dataset.id);
  await db.expenses.delete(id);
  loadExpenses();
});

/* EXPORT */
exportBtn.onclick = async () => {
  const data = await db.expenses.toArray();

  const blob = new Blob([JSON.stringify(data)], {
    type: "application/json"
  });

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "expenses-backup.json";
  a.click();
};

/* IMPORT */
importBtn.onclick = () => fileInput.click();

fileInput.onchange = async (e) => {
  const file = e.target.files[0];
  const text = await file.text();
  const data = JSON.parse(text);

  await db.expenses.clear();
  await db.expenses.bulkAdd(data);

  loadExpenses();
};

/* LOAD */
async function loadExpenses() {
  const expenses = await db.expenses.toArray();

  list.innerHTML = "";
  let total = 0;

  if (expenses.length === 0) {
    list.innerHTML = `<p style="text-align:center;color:gray;">No expenses yet</p>`;
  }

  expenses.reverse().forEach(exp => {
    total += exp.amount;

    const cat = categoryMap[exp.category] || { icon: "💸" };

    const card = document.createElement("div");
    card.className = "card";
    card.dataset.id = exp.id;

    card.innerHTML = `
      <div>
        <div class="category">${cat.icon} ${exp.category}</div>
        <div class="note">${new Date(exp.date).toDateString()}</div>
      </div>
      <div>₹${exp.amount}</div>
    `;

    list.appendChild(card);
  });

  totalEl.textContent = `₹${total}`;

  /* PROGRESS */
  if (monthlyBudget > 0) {
    const percent = (total / monthlyBudget) * 100;

    progressBar.style.width = `${Math.min(percent, 100)}%`;

    if (percent > 100) progressBar.style.background = "red";
    else if (percent > 80) progressBar.style.background = "orange";
    else progressBar.style.background = "green";
  }

  insightEl.textContent = "Track your spending wisely 💡";
}

loadExpenses();

/* SERVICE WORKER */
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/expense-tracker/service-worker.js");
}