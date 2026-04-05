const dbInstance = new Dexie("ExpenseDB");

dbInstance.version(1).stores({
  expenses: "++id, amount, category, note, date"
});

// ✅ expose globally
window.db = dbInstance;