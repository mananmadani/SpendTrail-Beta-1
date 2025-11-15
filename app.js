// Data Management
function getData() { return JSON.parse(localStorage.getItem('SpendTrail-data') || '{"income":[],"expenses":[]}'); }
function setData(data) { localStorage.setItem('SpendTrail-data', JSON.stringify(data)); }
// Long press handler
let pressTimer = null;
let isLongPress = false;

function handleLongPress(dataType, index, element) {
  isLongPress = false;
  
  pressTimer = setTimeout(() => {
    isLongPress = true;
    if (window.navigator.vibrate) window.navigator.vibrate(50);
    showEditDeleteMenu(dataType, index, element);
  }, 500); // 500ms for long press
}

function cancelLongPress() {
  clearTimeout(pressTimer);
}

function showEditDeleteMenu(dataType, index, element) {
  // Create floating menu
  const existingMenu = document.getElementById('context-menu');
  if (existingMenu) existingMenu.remove();
  
  const menu = document.createElement('div');
  menu.id = 'context-menu';
  menu.className = 'context-menu';
  menu.innerHTML = `
    <button class="context-menu-item edit" onclick="editEntry('${dataType}', ${index}); closeContextMenu();">
      <span style="font-size:18px;">✏️</span> Edit
    </button>
    <button class="context-menu-item delete" onclick="deleteEntry('${dataType}', ${index}); closeContextMenu();">
      <span style="font-size:18px;">🗑️</span> Delete
    </button>
    <button class="context-menu-item cancel" onclick="closeContextMenu();">
      Cancel
    </button>
  `;
  
  document.body.appendChild(menu);
  
  // Add backdrop
  const backdrop = document.createElement('div');
  backdrop.id = 'context-menu-backdrop';
  backdrop.className = 'context-menu-backdrop';
  backdrop.onclick = closeContextMenu;
  document.body.appendChild(backdrop);
  
  // Animate in
  setTimeout(() => {
    backdrop.classList.add('active');
    menu.classList.add('active');
  }, 10);
}

function closeContextMenu() {
  const menu = document.getElementById('context-menu');
  const backdrop = document.getElementById('context-menu-backdrop');
  
  if (menu) {
    menu.classList.remove('active');
    setTimeout(() => menu.remove(), 300);
  }
  
  if (backdrop) {
    backdrop.classList.remove('active');
    setTimeout(() => backdrop.remove(), 300);
  }
}
// Globals
let currentTab = 'home', currentAddType = 'expense';

// Tab Switching
function switchTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.getElementById(`tab-${tab}`).classList.add('active');
  document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
  
  if (tab === 'home') loadHome();
  if (tab === 'add') setTodayDate();
  
  if (window.navigator.vibrate) window.navigator.vibrate(10);
}
// Home Tab
function loadHome() {
  const data = getData();
  const totalIncome = data.income.reduce((s, i) => s + Number(i.amount), 0);
  const totalExpense = data.expenses.reduce((s, e) => s + Number(e.amount), 0);
  const balance = totalIncome - totalExpense;
  document.getElementById('balance').textContent = `₹${balance.toFixed(2)}`;
  document.getElementById('total-income').textContent = `₹${totalIncome.toFixed(2)}`;
  document.getElementById('total-expense').textContent = `₹${totalExpense.toFixed(2)}`;
  document.getElementById('balance-trend').textContent = balance >= 0 ? 'Looking good!' : 'Spending more';
  loadRecentTransactions();
}

function loadRecentTransactions() {
  const data = getData();
  let all = [...data.income.map((e, i) => ({...e, type: 'income', dataType: 'income', index: i})),
             ...data.expenses.map((e, i) => ({...e, type: 'expense', dataType: 'expenses', index: i}))];
  all.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  const recent = all.slice(0, 10);
  const list = document.getElementById('recent-list');
  const empty = document.getElementById('empty-recent');
  if (!recent.length) { list.innerHTML = ''; empty.style.display = 'block'; return; }
  empty.style.display = 'none';
  list.innerHTML = recent.map(item => `<div class="transaction-item"><div class="transaction-icon ${item.type}">${item.type === 'income' ? '↗' : '↘'}</div><div class="transaction-info"><div class="transaction-category">${item.category}</div><div class="transaction-date">${formatDate(item.date)}${item.note ? ' • ' + item.note : ''}</div></div><div class="transaction-amount ${item.type}">${item.type === 'income' ? '+' : '-'}₹${item.amount}</div></div>`).join('');
}

function formatDate(d) {
  const date = new Date(d), today = new Date(), yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Add Tab
function switchAddType(type) {
  currentAddType = type;
  document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
  document.querySelector(`[data-type="${type}"]`).classList.add('active');
  document.getElementById('submit-btn').textContent = type === 'income' ? 'Add Income' : 'Add Expense';
  updateCategoryList();
  // Force date update
  const today = new Date().toISOString().split('T')[0];
  const inp = document.getElementById('add-date');
  if (inp) inp.value = today;
  if (window.navigator.vibrate) window.navigator.vibrate(10);
}

function openAddModal(type) { switchTab('add'); switchAddType(type); }

function updateCategoryList() {
  const data = getData();
  const cats = currentAddType === 'income' ? [...new Set(data.income.map(e => e.category).filter(Boolean))] : [...new Set(data.expenses.map(e => e.category).filter(Boolean))];
  document.getElementById('category-list').innerHTML = cats.map(c => `<option value="${c}">`).join('');
}

function setTodayDate() {
  const today = new Date().toISOString().split('T')[0];
  const inp = document.getElementById('add-date');
  if (inp) inp.value = today;
}

document.getElementById('add-form').addEventListener('submit', function(e) {
  e.preventDefault();
  const amount = document.getElementById('add-amount').value;
  const category = document.getElementById('add-category').value.trim();
  const date = document.getElementById('add-date').value;
  const note = document.getElementById('add-note').value.trim();
  if (!amount || !category || !date) return;
  const data = getData();
  const entry = { amount, category, date, note, timestamp: Date.now() };
  currentAddType === 'income' ? data.income.push(entry) : data.expenses.push(entry);
  setData(data);
  this.reset();
  setTodayDate();
  showToast(`${currentAddType === 'income' ? 'Income' : 'Expense'} added!`, 'success');
  if (currentTab === 'home') loadHome();
  if (window.navigator.vibrate) window.navigator.vibrate(20);
});

// Overlay
function openOverlay(title, content) {
  document.getElementById('overlay-title').textContent = title;
  document.getElementById('overlay-content').innerHTML = content;
  document.getElementById('overlay').classList.add('active');
}

function closeOverlay() {
  // Check if we're in a category view within ledger
  if (currentOverlayContext && currentOverlayContext.type === 'category') {
    // Go back to ledger list instead of closing overlay
    currentOverlayContext = { type: 'ledger' };
    showLedger();
  } else {
    // Normal close
    document.getElementById('overlay').classList.remove('active');
    currentOverlayContext = null;
  }
  if (window.navigator.vibrate) window.navigator.vibrate(10);
}

// Edit & Delete
function editEntry(dataType, index) {
  const data = getData();
  const entry = data[dataType][index];
  openOverlay('Edit Entry', `<div class="add-form"><div class="form-group"><label>Amount</label><input type="number" id="edit-amount" value="${entry.amount}" step="0.01" required></div><div class="form-group"><label>Category</label><input type="text" id="edit-category" value="${entry.category}" required></div><div class="form-group"><label>Date</label><input type="date" id="edit-date" value="${entry.date}" required></div><div class="form-group"><label>Note</label><input type="text" id="edit-note" value="${entry.note || ''}"></div><button class="submit-btn" onclick="saveEdit('${dataType}', ${index})">Save</button><button class="submit-btn" onclick="closeOverlay()" style="background:#E0E0E0;color:#424242;margin-top:8px;">Cancel</button></div>`);
}

// Track current overlay context
let currentOverlayContext = null;

// Replace your existing saveEdit and deleteEntry functions with these fixed versions:

function saveEdit(dataType, index) {
  const data = getData();
  const amt = document.getElementById('edit-amount').value;
  const cat = document.getElementById('edit-category').value.trim();
  const dt = document.getElementById('edit-date').value;
  const note = document.getElementById('edit-note').value.trim();
  if (!amt || !cat || !dt) { showToast('Fill all fields', 'error'); return; }
  const oldTs = data[dataType][index].timestamp || Date.now();
  data[dataType][index] = { amount: amt, category: cat, date: dt, note, timestamp: oldTs };
  setData(data);
  
  showToast('Updated!', 'success');
  
  // Refresh the current view without closing overlay
  if (currentTab === 'home') {
    loadHome();
    closeOverlay();
  } else if (currentOverlayContext) {
    // Re-open the same overlay view
    if (currentOverlayContext.type === 'allEntries') {
      showAllEntries(currentOverlayContext.filter);
    } else if (currentOverlayContext.type === 'category') {
      showCategoryDetails(currentOverlayContext.category, currentOverlayContext.filter);
    } else {
      closeOverlay();
    }
  } else {
    closeOverlay();
  }
  
  if (window.navigator.vibrate) window.navigator.vibrate(20);
}

function deleteEntry(dataType, index) {
  if (!confirm('Delete this entry?')) return;
  const data = getData();
  
  // Store category info before deletion (for ledger context)
  const deletedCategory = currentOverlayContext && currentOverlayContext.type === 'category' 
    ? currentOverlayContext.category 
    : null;
  
  data[dataType].splice(index, 1);
  setData(data);
  
  showToast('Deleted', 'success');
  
  // Check if we need to refresh or go back
  if (currentTab === 'home') {
    loadHome();
    closeOverlay();
  } else if (currentOverlayContext) {
    if (currentOverlayContext.type === 'allEntries') {
      // Stay in all entries view
      showAllEntries(currentOverlayContext.filter);
    } else if (currentOverlayContext.type === 'category') {
      // Check if category still has entries
      const remainingInCategory = [
        ...data.income.filter(e => e.category === deletedCategory),
        ...data.expenses.filter(e => e.category === deletedCategory)
      ];
      
      if (remainingInCategory.length > 0) {
        // Still has entries, refresh the category view
        showCategoryDetails(currentOverlayContext.category, currentOverlayContext.filter);
      } else {
        // No more entries in this category, go back to ledger
        showLedger();
      }
    } else {
      closeOverlay();
    }
  } else {
    closeOverlay();
  }
  
  if (window.navigator.vibrate) window.navigator.vibrate(50);
  }

// All Entries
function showAllEntries(filter = 'all') {
  currentOverlayContext = { type: 'allEntries', filter: filter };
  const data = getData();
  let all = [...data.income.map((e, i) => ({...e, type: 'income', dataType: 'income', index: i})), ...data.expenses.map((e, i) => ({...e, type: 'expense', dataType: 'expenses', index: i}))];
  const totalIncome = data.income.reduce((s, i) => s + Number(i.amount), 0);
  const totalExpense = data.expenses.reduce((s, e) => s + Number(e.amount), 0);
  const balance = totalIncome - totalExpense;
  if (filter === 'income') all = all.filter(e => e.type === 'income');
  if (filter === 'expense') all = all.filter(e => e.type === 'expense');
  all.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  openOverlay('All Entries',`<div style="background:#FFF;border-radius:16px;padding:16px;margin-bottom:20px;box-shadow:0 2px 8px rgba(0,0,0,0.06);"><div style="display:flex;flex-direction:column;gap:12px;"><div style="display:flex;align-items:center;gap:12px;"><div style="width:44px;height:44px;border-radius:12px;background:#E8F5E9;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;">↗</div><div style="flex:1;min-width:0;"><div style="font-size:13px;color:#757575;margin-bottom:2px;">Income</div><div style="font-size:16px;font-weight:700;color:#4CAF50;overflow:hidden;text-overflow:ellipsis;">₹${totalIncome.toFixed(2)}</div></div></div><div style="display:flex;align-items:center;gap:12px;"><div style="width:44px;height:44px;border-radius:12px;background:#FFEBEE;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;">↘</div><div style="flex:1;min-width:0;"><div style="font-size:13px;color:#757575;margin-bottom:2px;">Expense</div><div style="font-size:16px;font-weight:700;color:#F44336;overflow:hidden;text-overflow:ellipsis;">₹${totalExpense.toFixed(2)}</div></div></div><div style="display:flex;align-items:center;gap:12px;"><div style="width:44px;height:44px;border-radius:12px;background:#E3F2FD;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;">💰</div><div style="flex:1;min-width:0;"><div style="font-size:13px;color:#757575;margin-bottom:2px;">Balance</div><div style="font-size:16px;font-weight:700;color:#667EEA;overflow:hidden;text-overflow:ellipsis;">₹${balance.toFixed(2)}</div></div></div></div></div><div style="display:flex;background:#F5F5F5;border-radius:12px;padding:4px;margin-bottom:20px;"><button onclick="showAllEntries('all')" style="flex:1;background:${filter==='all'?'#FFF':'transparent'};border:none;padding:10px;border-radius:10px;font-weight:600;color:${filter==='all'?'#1A1A1A':'#757575'};cursor:pointer;">All</button><button onclick="showAllEntries('income')" style="flex:1;background:${filter==='income'?'#FFF':'transparent'};border:none;padding:10px;border-radius:10px;font-weight:600;color:${filter==='income'?'#1A1A1A':'#757575'};cursor:pointer;">Income</button><button onclick="showAllEntries('expense')" style="flex:1;background:${filter==='expense'?'#FFF':'transparent'};border:none;padding:10px;border-radius:10px;font-weight:600;color:${filter==='expense'?'#1A1A1A':'#757575'};cursor:pointer;">Expense</button></div>${!all.length ? '<div class="empty-state"><div class="empty-icon">📋</div><div class="empty-text">No entries</div></div>' : `<div class="transaction-list">${all.map(item => `<div style="background:#FFF;border-radius:14px;padding:16px;box-shadow:0 2px 6px rgba(0,0,0,0.05);margin-bottom:10px;cursor:pointer;transition:transform 0.2s,box-shadow 0.2s;" 
  ontouchstart="handleLongPress('${item.dataType}', ${item.index}, this)" 
  ontouchend="cancelLongPress()" 
  ontouchmove="cancelLongPress()"
  onmousedown="handleLongPress('${item.dataType}', ${item.index}, this)" 
  onmouseup="cancelLongPress()" 
  onmouseleave="cancelLongPress()">
  <div style="display:flex;align-items:center;gap:14px;">
    <div style="width:40px;height:40px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;background:${item.type === 'income' ? '#E8F5E9' : '#FFEBEE'};">${item.type === 'income' ? '↗' : '↘'}</div>
    <div style="flex:1;min-width:0;">
      <div style="font-size:15px;font-weight:600;color:#1A1A1A;margin-bottom:3px;">${item.category}</div>
      <div style="font-size:13px;color:#757575;">${item.date}${item.note ? ' • ' + item.note : ''}</div>
    </div>
    <div style="font-size:18px;font-weight:700;color:${item.type === 'income' ? '#4CAF50' : '#F44336'};white-space:nowrap;">${item.type === 'income' ? '+' : '-'}₹${item.amount}</div>
  </div>
</div>`).join('')}</div>`}`);
}

// Ledger
function showLedger(filter = 'all') {
  currentOverlayContext = { type: 'ledger' };
  const data = getData();
  const cats = Array.from(new Set([...data.income.map(x => x.category), ...data.expenses.map(x => x.category)])).filter(Boolean);
  if (!cats.length) { openOverlay('Ledger', '<div class="empty-state"><div class="empty-icon">📁</div><div class="empty-text">No categories</div></div>'); return; }
  openOverlay('Ledger', `
    <div class="form-group" style="margin-bottom:20px;">
      <input type="text" id="ledger-search" placeholder="Search categories..." style="background:#FFF;border:2px solid #E0E0E0;border-radius:12px;padding:14px 16px;font-size:16px;width:100%;box-sizing:border-box;" oninput="filterLedgerCategories(this.value)">
    </div>
    <div id="ledger-categories" class="insights-menu">${cats.map(cat => {
    const catIncome = data.income.filter(e => e.category === cat).reduce((s, e) => s + Number(e.amount), 0);
    const catExpense = data.expenses.filter(e => e.category === cat).reduce((s, e) => s + Number(e.amount), 0);
    const catCount = data.income.filter(e => e.category === cat).length + data.expenses.filter(e => e.category === cat).length;
    return `<button class="insight-option" data-category="${cat.toLowerCase()}" onclick="showCategoryDetails('${cat}', 'all')"><span class="option-icon">📁</span><div style="flex:1;"><div class="option-text">${cat}</div><div style="font-size:13px;color:#757575;margin-top:2px;">Income: ₹${catIncome.toFixed(2)} | Expense: ₹${catExpense.toFixed(2)} | ${catCount} entries</div></div><span class="option-arrow">→</span></button>`;
  }).join('')}</div>`);
}

function filterLedgerCategories(query) {
  const q = query.toLowerCase();
  const buttons = document.querySelectorAll('#ledger-categories .insight-option');
  buttons.forEach(btn => {
    const cat = btn.getAttribute('data-category');
    btn.style.display = cat.includes(q) ? 'flex' : 'none';
  });
}

function showCategoryDetails(category, filter = 'all') {
  currentOverlayContext = { type: 'category', category: category, filter: filter };
  const data = getData();
  let entries = [...data.income.filter(e => e.category === category).map((e, i) => ({...e, type: 'income', dataType: 'income', index: data.income.indexOf(e)})), ...data.expenses.filter(e => e.category === category).map((e, i) => ({...e, type: 'expense', dataType: 'expenses', index: data.expenses.indexOf(e)}))];
  const catIncome = entries.filter(e => e.type === 'income').reduce((s, e) => s + Number(e.amount), 0);
  const catExpense = entries.filter(e => e.type === 'expense').reduce((s, e) => s + Number(e.amount), 0);
  const catCount = entries.length;
  if (filter === 'income') entries = entries.filter(e => e.type === 'income');
  if (filter === 'expense') entries = entries.filter(e => e.type === 'expense');
  entries.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  openOverlay(category, `<div style="background:#FFF;border-radius:16px;padding:16px;margin-bottom:20px;box-shadow:0 2px 8px rgba(0,0,0,0.06);"><div style="display:flex;flex-direction:column;gap:12px;"><div style="display:flex;align-items:center;gap:12px;"><div style="width:44px;height:44px;border-radius:12px;background:#E8F5E9;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;">↗</div><div style="flex:1;min-width:0;"><div style="font-size:13px;color:#757575;margin-bottom:2px;">Income</div><div style="font-size:16px;font-weight:700;color:#4CAF50;overflow:hidden;text-overflow:ellipsis;">₹${catIncome.toFixed(2)}</div></div></div><div style="display:flex;align-items:center;gap:12px;"><div style="width:44px;height:44px;border-radius:12px;background:#FFEBEE;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;">↘</div><div style="flex:1;min-width:0;"><div style="font-size:13px;color:#757575;margin-bottom:2px;">Expense</div><div style="font-size:16px;font-weight:700;color:#F44336;overflow:hidden;text-overflow:ellipsis;">₹${catExpense.toFixed(2)}</div></div></div><div style="display:flex;align-items:center;gap:12px;"><div style="width:44px;height:44px;border-radius:12px;background:#E3F2FD;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;">📊</div><div style="flex:1;min-width:0;"><div style="font-size:13px;color:#757575;margin-bottom:2px;">Total Transactions</div><div style="font-size:16px;font-weight:700;color:#667EEA;overflow:hidden;text-overflow:ellipsis;">${catCount}</div></div></div></div></div><div style="display:flex;background:#F5F5F5;border-radius:12px;padding:4px;margin-bottom:20px;"><button onclick="showCategoryDetails('${category}', 'all')" style="flex:1;background:${filter==='all'?'#FFF':'transparent'};border:none;padding:10px;border-radius:10px;font-weight:600;color:${filter==='all'?'#1A1A1A':'#757575'};cursor:pointer;">All</button><button onclick="showCategoryDetails('${category}', 'income')" style="flex:1;background:${filter==='income'?'#FFF':'transparent'};border:none;padding:10px;border-radius:10px;font-weight:600;color:${filter==='income'?'#1A1A1A':'#757575'};cursor:pointer;">Income</button><button onclick="showCategoryDetails('${category}', 'expense')" style="flex:1;background:${filter==='expense'?'#FFF':'transparent'};border:none;padding:10px;border-radius:10px;font-weight:600;color:${filter==='expense'?'#1A1A1A':'#757575'};cursor:pointer;">Expense</button></div><div class="transaction-list">${entries.map(item => `<div style="background:#FFF;border-radius:14px;padding:16px;box-shadow:0 2px 6px rgba(0,0,0,0.05);margin-bottom:10px;cursor:pointer;transition:transform 0.2s,box-shadow 0.2s;" 
  ontouchstart="handleLongPress('${item.dataType}', ${item.index}, this)" 
  ontouchend="cancelLongPress()" 
  ontouchmove="cancelLongPress()"
  onmousedown="handleLongPress('${item.dataType}', ${item.index}, this)" 
  onmouseup="cancelLongPress()" 
  onmouseleave="cancelLongPress()">
  <div style="display:flex;align-items:center;gap:14px;">
    <div style="width:40px;height:40px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;background:${item.type === 'income' ? '#E8F5E9' : '#FFEBEE'};">${item.type === 'income' ? '↗' : '↘'}</div>
    <div style="flex:1;min-width:0;">
      <div style="font-size:15px;font-weight:600;color:#1A1A1A;margin-bottom:3px;">${item.category}</div>
      <div style="font-size:13px;color:#757575;">${item.date}${item.note ? ' • ' + item.note : ''}</div>
    </div>
    <div style="font-size:18px;font-weight:700;color:${item.type === 'income' ? '#4CAF50' : '#F44336'};white-space:nowrap;">${item.type === 'income' ? '+' : '-'}₹${item.amount}</div>
  </div>
</div>`).join('')}</div>`);
        }

// Statements
function showStatements() {
  openOverlay('Custom Statement', `<div class="add-form"><div class="form-group"><label>Start Date</label><input type="date" id="stmt-start"></div><div class="form-group"><label>End Date</label><input type="date" id="stmt-end"></div><button class="submit-btn" onclick="generateStatement()">Generate</button><button class="submit-btn" onclick="exportStatementPDF()" style="margin-top:8px;">Export PDF</button></div><div id="statement-result" style="margin-top:24px;"></div>`);
}

function generateStatement() {
  const start = document.getElementById('stmt-start').value;
  const end = document.getElementById('stmt-end').value;
  if (!start || !end) { showToast('Select dates', 'error'); return; }
  const data = getData();
  let all = [...data.income.map(e => ({...e, type: 'income'})), ...data.expenses.map(e => ({...e, type: 'expense'}))].filter(i => i.date >= start && i.date <= end);
  all.sort((a, b) => b.date.localeCompare(a.date));
  document.getElementById('statement-result').innerHTML = !all.length ? '<div class="empty-state"><div class="empty-text">No entries</div></div>' : `<div class="transaction-list">${all.map(item => `<div class="transaction-item"><div class="transaction-icon ${item.type}">${item.type === 'income' ? '↗' : '↘'}</div><div class="transaction-info"><div class="transaction-category">${item.category}</div><div class="transaction-date">${item.date}${item.note ? ' • ' + item.note : ''}</div></div><div class="transaction-amount ${item.type}">${item.type === 'income' ? '+' : '-'}₹${item.amount}</div></div>`).join('')}</div>`;
}

function exportStatementPDF() {
  const start = document.getElementById('stmt-start').value;
  const end = document.getElementById('stmt-end').value;
  if (!start || !end) { showToast('Select dates', 'error'); return; }
  const data = getData();
  let all = [...data.income.map(e => ({...e, type: 'income'})), ...data.expenses.map(e => ({...e, type: 'expense'}))].filter(i => i.date >= start && i.date <= end);
  all.sort((a, b) => b.date.localeCompare(a.date));
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  let y = 20;
  doc.setFontSize(18); doc.text('SpendTrail Statement', 20, y); y += 10;
  doc.setFontSize(11); doc.text(`Period: ${start} to ${end}`, 20, y); y += 15;
  doc.setFontSize(10);
  all.forEach(item => { 
    if (y > 270) { doc.addPage(); y = 20; } 
    const noteText = item.note ? ` | ${item.note}` : '';
    doc.text(`${item.type === 'income' ? '+' : '-'}₹${item.amount} | ${item.category} | ${item.date}${noteText}`, 20, y); 
    y += 7; 
  });
  doc.save(`SpendTrail-Statement-${start}-to-${end}.pdf`);
  showToast('Exported!', 'success');
    }

// Analytics
let currentTimePeriod = 30;
let pieChart = null;
let trendChart = null;

function showAnalytics(days = 30) {
  currentTimePeriod = days;
  const data = getData();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  const cutoffStr = cutoffDate.toISOString().split('T')[0];
  
  // Filter data by time period
  const filteredExpenses = data.expenses.filter(e => e.date >= cutoffStr);
  const filteredIncome = data.income.filter(e => e.date >= cutoffStr);
  
  // Calculate category totals
  const categoryTotals = {};
  filteredExpenses.forEach(e => {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + Number(e.amount);
  });
  
  // Sort categories by amount
  const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
  const totalExpense = sortedCategories.reduce((sum, [_, amt]) => sum + amt, 0);
  
  // Prepare pie chart data (Top 5 + Others)
  const top5 = sortedCategories.slice(0, 5);
  const others = sortedCategories.slice(5);
  const othersTotal = others.reduce((sum, [_, amt]) => sum + amt, 0);
  
  const pieData = [...top5];
  if (othersTotal > 0) pieData.push(['Others', othersTotal]);
  
  const content = `
    <div class="time-filter">
      <button class="time-filter-btn ${days === 7 ? 'active' : ''}" onclick="showAnalytics(7)">Week</button>
      <button class="time-filter-btn ${days === 30 ? 'active' : ''}" onclick="showAnalytics(30)">Month</button>
      <button class="time-filter-btn ${days === 90 ? 'active' : ''}" onclick="showAnalytics(90)">3 Months</button>
    </div>
    
    ${pieData.length === 0 ? '<div class="empty-state"><div class="empty-icon">📊</div><div class="empty-text">No expense data</div><div class="empty-subtext">Add some expenses to see analytics</div></div>' : `
      <div class="chart-container">
        <div class="chart-title">Expense Breakdown</div>
        <canvas id="pieChart" class="chart-canvas"></canvas>
        ${othersTotal > 0 ? `<div style="text-align:center;margin-top:12px;"><button onclick="showOthersBreakdown()" style="background:#F5F5F5;border:none;padding:8px 16px;border-radius:8px;font-size:13px;font-weight:600;color:#667EEA;cursor:pointer;">View "Others" Breakdown</button></div>` : ''}
      </div>
      
      <div class="chart-container">
        <div class="chart-title">All Categories</div>
        <div id="category-bars"></div>
      </div>
      
      <div class="chart-container">
        <div class="chart-title">${days === 7 ? '7-Day' : days === 30 ? '30-Day' : '90-Day'} Trend</div>
        <canvas id="trendChart" class="chart-canvas"></canvas>
      </div>
    `}
  `;
  
  openOverlay('Analytics', content);
  
  // Render charts after overlay is open
  if (pieData.length > 0) {
    setTimeout(() => {
      renderPieChart(pieData, totalExpense);
      renderCategoryBars(sortedCategories, totalExpense);
      renderTrendChart(data, days);
    }, 100);
  }
  
  // Store others data for breakdown
  window.othersData = others;
}

function renderPieChart(pieData, total) {
  const canvas = document.getElementById('pieChart');
  if (!canvas) return;
  
  const colors = ['#667EEA', '#F44336', '#4CAF50', '#FF9800', '#9C27B0', '#BDBDBD'];
  
  if (pieChart) pieChart.destroy();
  
  pieChart = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: pieData.map(([cat, _]) => cat),
      datasets: [{
        data: pieData.map(([_, amt]) => amt),
        backgroundColor: colors,
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 15,
            font: { size: 13, weight: '600' },
            generateLabels: function(chart) {
              const data = chart.data;
              return data.labels.map((label, i) => {
                const value = data.datasets[0].data[i];
                const percent = ((value / total) * 100).toFixed(1);
                return {
                  text: `${label} (${percent}%)`,
                  fillStyle: data.datasets[0].backgroundColor[i],
                  hidden: false,
                  index: i
                };
              });
            }
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const value = context.parsed;
              const percent = ((value / total) * 100).toFixed(1);
              return `₹${value.toFixed(2)} (${percent}%)`;
            }
          }
        }
      }
    }
  });
}

function renderCategoryBars(categories, total) {
  const container = document.getElementById('category-bars');
  if (!container) return;
  
  container.innerHTML = categories.map(([cat, amt]) => {
    const percent = ((amt / total) * 100).toFixed(1);
    return `
      <div class="category-bar">
        <div class="category-bar-label">${cat}</div>
        <div class="category-bar-fill">
          <div class="category-bar-progress" style="width:${percent}%"></div>
        </div>
        <div class="category-bar-amount">₹${amt.toFixed(0)}</div>
      </div>
    `;
  }).join('');
}

function renderTrendChart(data, days) {
  const canvas = document.getElementById('trendChart');
  if (!canvas) return;
  
  // Generate last N days
  const dates = [];
  const incomeByDate = {};
  const expenseByDate = {};
  
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    dates.push(dateStr);
    incomeByDate[dateStr] = 0;
    expenseByDate[dateStr] = 0;
  }
  
  // Sum up amounts by date
  data.income.forEach(e => {
    if (incomeByDate.hasOwnProperty(e.date)) {
      incomeByDate[e.date] += Number(e.amount);
    }
  });
  
  data.expenses.forEach(e => {
    if (expenseByDate.hasOwnProperty(e.date)) {
      expenseByDate[e.date] += Number(e.amount);
    }
  });
  
  const incomeData = dates.map(d => incomeByDate[d]);
  const expenseData = dates.map(d => expenseByDate[d]);
  const labels = dates.map(d => {
    const date = new Date(d);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  });
  
  if (trendChart) trendChart.destroy();
  
  trendChart = new Chart(canvas, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Income',
          data: incomeData,
          borderColor: '#4CAF50',
          backgroundColor: 'rgba(76, 175, 80, 0.1)',
          fill: true,
          tension: 0.4
        },
        {
          label: 'Expense',
          data: expenseData,
          borderColor: '#F44336',
          backgroundColor: 'rgba(244, 67, 54, 0.1)',
          fill: true,
          tension: 0.4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      interaction: {
        intersect: false,
        mode: 'index'
      },
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 15,
            font: { size: 13, weight: '600' }
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `${context.dataset.label}: ₹${context.parsed.y.toFixed(2)}`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return '₹' + value;
            }
          }
        },
        x: {
          ticks: {
            maxRotation: 45,
            minRotation: 45
          }
        }
      }
    }
  });
}

function showOthersBreakdown() {
  if (!window.othersData || window.othersData.length === 0) return;
  
  const content = `
    <div class="chart-container">
      <div class="chart-title">"Others" Breakdown</div>
      ${window.othersData.map(([cat, amt]) => `
        <div class="category-bar">
          <div class="category-bar-label">${cat}</div>
          <div class="category-bar-amount">₹${amt.toFixed(2)}</div>
        </div>
      `).join('')}
    </div>
    <button class="submit-btn" onclick="showAnalytics(${currentTimePeriod})" style="margin-top:16px;">Back to Analytics</button>
  `;
  
  openOverlay('"Others" Categories', content);
}

// Backup & Restore
function backupData() {
  const data = getData();
  const backup = { ...data, backupDate: new Date().toISOString(), version: "2.0" };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `SpendTrail-backup-${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  URL.revokeObjectURL(url);
  showToast('Backup created!', 'success');
}

function encryptedBackup() {
  if (typeof CryptoJS === 'undefined') { showToast('Encryption unavailable', 'error'); return; }
  const password = prompt('Set password (min 8 chars):');
  if (!password) return;
  if (password.length < 8) { showToast('Too short', 'error'); return; }
  const confirm = prompt('Confirm password:');
  if (password !== confirm) { showToast('No match', 'error'); return; }
  const data = getData();
  const backup = { ...data, backupDate: new Date().toISOString(), version: "2.0", encrypted: true };
  const encrypted = CryptoJS.AES.encrypt(JSON.stringify(backup), password).toString();
  const blob = new Blob([encrypted], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `SpendTrail-backup-${new Date().toISOString().split('T')[0]}.encrypted`;
  link.click();
  URL.revokeObjectURL(url);
  showToast('Encrypted backup created!', 'success');
}

function restoreData() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json,.encrypted,.txt';
  input.onchange = function(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(event) {
      try {
        const content = event.target.result;
        let backup;
        if (file.name.includes('.encrypted')) {
          if (typeof CryptoJS === 'undefined') { showToast('Encryption unavailable', 'error'); return; }
          const password = prompt('Enter password:');
          if (!password) return;
          const decrypted = CryptoJS.AES.decrypt(content, password).toString(CryptoJS.enc.Utf8);
          if (!decrypted) { showToast('Wrong password', 'error'); return; }
          backup = JSON.parse(decrypted);
        } else backup = JSON.parse(content);
        if (!backup.income || !backup.expenses) { showToast('Invalid backup', 'error'); return; }
        if (confirm(`Restore ${backup.income.length} income and ${backup.expenses.length} expense entries?`)) {
          setData({ income: backup.income, expenses: backup.expenses });
          loadHome();
          showToast('Restored!', 'success');
        }
      } catch (error) { showToast('Error reading backup', 'error'); }
    };
    reader.readAsText(file);
  };
  input.click();
}

// Export & Delete
function exportPDF() {
  const data = getData();
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  let y = 20;
  const totalIncome = data.income.reduce((s, i) => s + Number(i.amount), 0);
  const totalExpense = data.expenses.reduce((s, e) => s + Number(e.amount), 0);
  doc.setFontSize(18); doc.text('SpendTrail Report', 20, y); y += 10;
  doc.setFontSize(11); doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, y); y += 15;
  doc.setFontSize(10);
  doc.text(`Income: ₹${totalIncome.toFixed(2)} | Expense: ₹${totalExpense.toFixed(2)} | Balance: ₹${(totalIncome - totalExpense).toFixed(2)}`, 20, y); y += 15;
  let all = [...data.income.map(e => ({...e, type: 'Income'})), ...data.expenses.map(e => ({...e, type: 'Expense'}))].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  all.forEach(item => { 
    if (y > 270) { doc.addPage(); y = 20; } 
    const noteText = item.note ? ` | ${item.note}` : '';
    doc.text(`${item.type} | ₹${item.amount} | ${item.category} | ${item.date}${noteText}`, 20, y); 
    y += 7; 
  });
  doc.save('SpendTrail-Report.pdf');
  showToast('PDF exported!', 'success');
}

function deleteAllData() {
  if (confirm('Delete ALL data? Cannot be undone!')) {
    if (confirm('Absolutely sure?')) {
      localStorage.removeItem('SpendTrail-data');
      loadHome();
      showToast('All deleted', 'success');
    }
  }
}

function showPrivacy() {
  const content = `
    <div style="line-height:1.7;color:#424242;">
      <h2 style="color:#667EEA;margin-bottom:24px;font-size:24px;">Privacy Policy</h2>
      
      <div style="margin-bottom:28px;">
        <h3 style="color:#1A1A1A;font-size:18px;margin-bottom:12px;">📱 Data Storage & Privacy</h3>
        <p style="margin-bottom:12px;">SpendTrail is designed with your privacy as the top priority. All your financial data, including income entries, expense records, categories, notes, and transaction history, is stored exclusively on your device using your browser's local storage mechanism.</p>
        <p style="margin-bottom:12px;"><strong>We do not:</strong></p>
        <ul style="margin-left:20px;margin-bottom:12px;">
          <li style="margin-bottom:8px;">Collect any personal information</li>
          <li style="margin-bottom:8px;">Send your data to external servers</li>
          <li style="margin-bottom:8px;">Track your usage or behavior</li>
          <li style="margin-bottom:8px;">Share your information with third parties</li>
          <li style="margin-bottom:8px;">Store cookies for tracking purposes</li>
          <li style="margin-bottom:8px;">Require account registration or login</li>
        </ul>
        <p>Your financial data never leaves your device unless you explicitly export or backup the data yourself.</p>
      </div>

      <div style="margin-bottom:28px;">
        <h3 style="color:#1A1A1A;font-size:18px;margin-bottom:12px;">🔒 Security Measures</h3>
        <p style="margin-bottom:12px;">Your data security is paramount:</p>
        <ul style="margin-left:20px;margin-bottom:12px;">
          <li style="margin-bottom:8px;"><strong>Local Storage:</strong> Data is stored in your browser's secure local storage, isolated from other websites and applications.</li>
          <li style="margin-bottom:8px;"><strong>Encrypted Backups:</strong> When you create encrypted backups, we use industry-standard AES-256 encryption to protect your data with a password of your choice.</li>
          <li style="margin-bottom:8px;"><strong>No Server Transmission:</strong> Since no data is transmitted to servers, there's no risk of data breaches or unauthorized access from external sources.</li>
          <li style="margin-bottom:8px;"><strong>Device-Level Protection:</strong> Your data inherits the security measures of your device (PIN, password, biometrics).</li>
        </ul>
      </div>

      <div style="margin-bottom:28px;">
        <h3 style="color:#1A1A1A;font-size:18px;margin-bottom:12px;">💾 Backup & Export</h3>
        <p style="margin-bottom:12px;">SpendTrail provides two backup options:</p>
        <ul style="margin-left:20px;margin-bottom:12px;">
          <li style="margin-bottom:8px;"><strong>Simple Backup:</strong> Creates a readable JSON file containing all your data. This file is not encrypted and should be kept secure.</li>
          <li style="margin-bottom:8px;"><strong>Encrypted Backup:</strong> Creates a password-protected, AES-256 encrypted file. Only you have the password; if you lose it, the backup cannot be recovered.</li>
        </ul>
        <p style="margin-bottom:12px;">When you export data:</p>
        <ul style="margin-left:20px;">
          <li style="margin-bottom:8px;">The file is generated and saved directly to your device</li>
          <li style="margin-bottom:8px;">No data is uploaded to any server during the export process</li>
          <li style="margin-bottom:8px;">You have full control over where the backup file is stored</li>
          <li style="margin-bottom:8px;">You are responsible for the security of exported backup files</li>
        </ul>
      </div>

      <div style="margin-bottom:28px;">
        <h3 style="color:#1A1A1A;font-size:18px;margin-bottom:12px;">📊 Analytics & Charts</h3>
        <p>The analytics and charts displayed in SpendTrail are generated entirely on your device using your local data. No analytics data is collected about your usage patterns, spending habits, or financial information. The insights you see are for your eyes only.</p>
      </div>

      <div style="margin-bottom:28px;">
        <h3 style="color:#1A1A1A;font-size:18px;margin-bottom:12px;">🗑️ Data Deletion</h3>
        <p style="margin-bottom:12px;">You have complete control over your data:</p>
        <ul style="margin-left:20px;margin-bottom:12px;">
          <li style="margin-bottom:8px;"><strong>Individual Deletion:</strong> Delete specific income or expense entries at any time through the Edit/Delete options.</li>
          <li style="margin-bottom:8px;"><strong>Complete Deletion:</strong> Use the "Delete All Data" option in the More tab to permanently erase all records.</li>
          <li style="margin-bottom:8px;"><strong>Browser Data Clearing:</strong> Clearing your browser's data or cache will permanently delete all SpendTrail data stored locally.</li>
          <li style="margin-bottom:8px;"><strong>App Uninstallation:</strong> Uninstalling the Progressive Web App (PWA) or removing browser data will result in permanent data loss.</li>
        </ul>
        <p><strong>Important:</strong> Deleted data cannot be recovered unless you have a backup file saved separately.</p>
      </div>

      <div style="margin-bottom:28px;">
        <h3 style="color:#1A1A1A;font-size:18px;margin-bottom:12px;">🌐 No External Services</h3>
        <p style="margin-bottom:12px;">SpendTrail operates entirely offline after the initial load. We do use the following external libraries loaded from CDNs for functionality:</p>
        <ul style="margin-left:20px;margin-bottom:12px;">
          <li style="margin-bottom:8px;"><strong>jsPDF:</strong> For generating PDF reports (loaded from cdnjs.cloudflare.com)</li>
          <li style="margin-bottom:8px;"><strong>CryptoJS:</strong> For encrypted backup functionality (loaded from cdnjs.cloudflare.com)</li>
          <li style="margin-bottom:8px;"><strong>Chart.js:</strong> For rendering analytics charts (loaded from cdn.jsdelivr.net)</li>
        </ul>
        <p>These libraries are loaded for functionality purposes only and do not collect or transmit any of your personal data.</p>
      </div>

      <div style="margin-bottom:28px;">
        <h3 style="color:#1A1A1A;font-size:18px;margin-bottom:12px;">📱 Permissions</h3>
        <p style="margin-bottom:12px;">SpendTrail does not request or use:</p>
        <ul style="margin-left:20px;">
          <li style="margin-bottom:8px;">Camera or photo access</li>
          <li style="margin-bottom:8px;">Location services</li>
          <li style="margin-bottom:8px;">Contacts or address book</li>
          <li style="margin-bottom:8px;">Phone or SMS capabilities</li>
          <li style="margin-bottom:8px;">Microphone access</li>
          <li style="margin-bottom:8px;">Background app refresh</li>
          <li style="margin-bottom:8px;">Push notifications (unless you enable them)</li>
        </ul>
      </div>

      <div style="margin-bottom:28px;">
        <h3 style="color:#1A1A1A;font-size:18px;margin-bottom:12px;">🔄 Updates to This Policy</h3>
        <p style="margin-bottom:12px;">We may update this Privacy Policy from time to time to reflect:</p>
        <ul style="margin-left:20px;margin-bottom:12px;">
          <li style="margin-bottom:8px;">Changes in app functionality</li>
          <li style="margin-bottom:8px;">New features or capabilities</li>
          <li style="margin-bottom:8px;">Legal or regulatory requirements</li>
          <li style="margin-bottom:8px;">Improvements to security measures</li>
        </ul>
        <p>The latest version of this policy will always be available within the app under More → Privacy Policy. Continued use of SpendTrail after updates constitutes acceptance of the revised policy.</p>
      </div>

      <div style="margin-bottom:28px;">
        <h3 style="color:#1A1A1A;font-size:18px;margin-bottom:12px;">👤 Your Rights</h3>
        <p style="margin-bottom:12px;">Since all data is stored locally on your device, you have complete control and ownership of your information:</p>
        <ul style="margin-left:20px;">
          <li style="margin-bottom:8px;"><strong>Access:</strong> You can view all your data at any time through the app interface</li>
          <li style="margin-bottom:8px;"><strong>Modify:</strong> Edit any entry using the Edit function</li>
          <li style="margin-bottom:8px;"><strong>Delete:</strong> Remove individual entries or all data at once</li>
          <li style="margin-bottom:8px;"><strong>Export:</strong> Download your complete data set in JSON or PDF format</li>
          <li style="margin-bottom:8px;"><strong>Portability:</strong> Your data can be backed up and restored on any device</li>
        </ul>
      </div>

      <div style="margin-bottom:28px;">
        <h3 style="color:#1A1A1A;font-size:18px;margin-bottom:12px;">⚠️ Important Disclaimers</h3>
        <ul style="margin-left:20px;">
          <li style="margin-bottom:8px;">SpendTrail is provided "as is" without warranties of any kind</li>
          <li style="margin-bottom:8px;">We are not responsible for data loss due to device failure, browser issues, or user error</li>
          <li style="margin-bottom:8px;">Regular backups are strongly recommended to prevent accidental data loss</li>
          <li style="margin-bottom:8px;">If you lose your encrypted backup password, your data cannot be recovered</li>
          <li style="margin-bottom:8px;">While we use secure encryption methods, you are responsible for keeping backup files in secure locations</li>
        </ul>
      </div>

      <div style="margin-bottom:28px;">
        <h3 style="color:#1A1A1A;font-size:18px;margin-bottom:12px;">📧 Contact & Support</h3>
        <p style="margin-bottom:12px;">SpendTrail is an open-source project. If you have:</p>
        <ul style="margin-left:20px;">
          <li style="margin-bottom:8px;">Questions about this Privacy Policy</li>
          <li style="margin-bottom:8px;">Concerns about data privacy or security</li>
          <li style="margin-bottom:8px;">Suggestions for improving privacy features</li>
          <li style="margin-bottom:8px;">Bug reports or technical issues</li>
        </ul>
        <p style="margin-top:12px;">Please note that since SpendTrail operates entirely locally without any backend infrastructure, we cannot access, view, or recover your data remotely.</p>
      </div>

      <div style="background:#E8F5E9;padding:16px;border-radius:12px;border-left:4px solid #4CAF50;">
        <p style="margin:0;font-weight:600;color:#2E7D32;">✓ Privacy Guarantee</p>
        <p style="margin:8px 0 0 0;color:#424242;">Your financial data is yours and yours alone. SpendTrail will never collect, transmit, sell, or share your personal information with anyone, ever.</p>
      </div>

      <p style="margin-top:24px;font-size:13px;color:#757575;text-align:center;">Last Updated: November 2025 | Version 3.3</p>
    </div>
  `;
  openOverlay('Privacy Policy', content);
}

// Toast
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type} show`;
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// Set today's date - Simple approach that worked before
function setTodayDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const dateString = `${year}-${month}-${day}`;
  
  const dateInput = document.getElementById('add-date');
  if (dateInput) {
    dateInput.value = dateString;
  }
}

// Initialize
loadHome();
setTodayDate();
updateCategoryList();

// Update date when switching to add tab or when tab becomes visible
window.addEventListener('focus', setTodayDate);
document.addEventListener('visibilitychange', function() {
  if (!document.hidden) {
    setTodayDate();
  }
});
