const db = new Dexie("ExpenseDB");

db.version(1).stores({
  expenses: "++id, amount, category, note, date"
});

window.db = db;