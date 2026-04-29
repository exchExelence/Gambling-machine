const balanceEl = document.getElementById("balance");
const cashEl = document.getElementById("cash-value");
const adminBtn = document.getElementById("admin-btn");
const adminMenu = document.getElementById("admin-dropdown");
const adminPasswordInput = document.getElementById("admin-password");
const versionLabel = document.getElementById("version-label");
const adminSave = document.getElementById("admin-save");
const adminClose = document.getElementById("admin-close");
const adminAmount = document.getElementById("admin-amount");

function updateUI() {
  balanceEl.textContent = getCurrentBalance().toString();
  if (cashEl) {
    cashEl.textContent = formatCash(getCurrentBalance());
  }
  if (versionLabel) {
    versionLabel.textContent = `v15`;
  }
}

function openAdmin() {
  if (!adminMenu) return;
  const isOpen = !adminMenu.classList.contains("hidden");
  if (isOpen) {
    closeAdmin();
    return;
  }
  adminMenu.classList.remove("hidden");
  adminAmount.value = "50";
  adminPasswordInput.value = "";
}

function closeAdmin() {
  if (!adminMenu) return;
  adminMenu.classList.add("hidden");
}

function isAdminPasswordValid() {
  if (!adminPasswordInput) return false;
  const password = String(adminPasswordInput.value || "");
  if (password !== ADMIN_PASSWORD) {
    return false;
  }
  return true;
}

function addAdminCoins() {
  if (!isAdminPasswordValid()) {
    alert("Incorrect admin password.");
    return;
  }
  const amount = Number(adminAmount.value || 0);
  if (amount <= 0) {
    alert("Enter a positive token amount.");
    return;
  }
  setCurrentBalance(getCurrentBalance() + amount);
  alert(`Added ${amount} tokens.`);
  updateUI();
  closeAdmin();
}

function removeAdminCoins() {
  if (!isAdminPasswordValid()) {
    alert("Incorrect admin password.");
    return;
  }
  const amount = Number(adminAmount.value || 0);
  if (amount <= 0) {
    alert("Enter a positive token amount.");
    return;
  }
  setCurrentBalance(getCurrentBalance() - amount);
  alert(`Removed ${amount} tokens.`);
  updateUI();
  closeAdmin();
}

// Event listeners
adminBtn.addEventListener("click", openAdmin);
adminClose?.addEventListener("click", closeAdmin);
adminSave?.addEventListener("click", addAdminCoins);
const adminWithdraw = document.getElementById("admin-withdraw");
adminWithdraw?.addEventListener("click", removeAdminCoins);

document.addEventListener("click", (event) => {
  if (!adminMenu || adminMenu.classList.contains("hidden")) return;
  const target = event.target;
  if (target === adminBtn || adminMenu.contains(target)) return;
  closeAdmin();
});

// Initialize
loadState();
updateUI();
