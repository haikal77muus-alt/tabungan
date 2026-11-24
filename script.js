/**
 * ============================================================================
 * TABUNGANKU - LOGIKA JAVASCRIPT & SISTEM FILTER BULANAN MODERN
 * ============================================================================
 * Fitur:
 * 1. Filter Periode: Dropdown Bulan & Tahun + Tombol Cepat "Bulan Ini" & "Semua".
 * 2. Dual Mode Tema (Hitam/Gelap & Putih/Terang) dengan penyimpanan otomatis.
 * 3. Privasi Saldo (Tombol Sembunyikan/Tampilkan Nominal).
 * 4. Rasio Visual Tabungan (Bar Persentase Pemasukan vs Pengeluaran).
 * 5. Pintasan Cepat Nominal (+10rb, +50rb, dsb) & Tag Kategori 1-Klik.
 * 6. Multi-Device Sync: LocalStorage + Firebase Realtime Database + Kode Transfer.
 * ============================================================================
 */

// ----------------------------------------------------------------------------
// 1. STATE & KONFIGURASI
// ----------------------------------------------------------------------------
const STORAGE_KEY = 'tabungan_bulanan_data';
const CLOUD_CONFIG_KEY = 'tabungan_cloud_config';
const THEME_STORAGE_KEY = 'tabungan_app_theme';
const PRIVACY_STORAGE_KEY = 'tabungan_privacy_hidden';

// ✅ Firebase Realtime Database URL (Permanen / Hardcoded)
// URL ini sudah tertanam di aplikasi — pengguna hanya perlu memasukkan Kode Akses.
const FIREBASE_DB_URL = 'https://tabungan-125-default-rtdb.firebaseio.com';

let transactions = [];
let cloudSyncKey = ''; // Hanya simpan kode akses, URL sudah permanen
let isBalanceHidden = false;

// Filter State: Bulan (01-12 atau kosong "") dan Tahun (YYYY atau kosong "")
let filterState = {
  bulan: getCurrentMonthNumberString(), // Contoh: "11"
  tahun: String(new Date().getFullYear()) // Contoh: "2026"
};

// ----------------------------------------------------------------------------
// 2. REFERENSI ELEMEN DOM
// ----------------------------------------------------------------------------
const elements = {
  // Tema & Privasi
  themeToggleBtn: document.getElementById('themeToggleBtn'),
  themeLabelText: document.getElementById('themeLabelText'),
  btnToggleBalance: document.getElementById('btnToggleBalance'),
  eyeIconShow: document.getElementById('eyeIconShow'),
  eyeIconHide: document.getElementById('eyeIconHide'),

  // Hero Stats & Visual Ratio
  totalSaldo: document.getElementById('totalSaldo'),
  totalPemasukanBulan: document.getElementById('totalPemasukanBulan'),
  totalPenarikanBulan: document.getElementById('totalPenarikanBulan'),
  labelBulanPemasukan: document.getElementById('labelBulanPemasukan'),
  labelBulanPenarikan: document.getElementById('labelBulanPenarikan'),
  ratioBarIncome: document.getElementById('ratioBarIncome'),
  ratioBarExpense: document.getElementById('ratioBarExpense'),
  ratioPercentageText: document.getElementById('ratioPercentageText'),

  // Form Input
  form: document.getElementById('transactionForm'),
  inputTanggal: document.getElementById('tanggal'),
  inputNominal: document.getElementById('nominal'),
  inputKeterangan: document.getElementById('keterangan'),
  nominalLivePreview: document.getElementById('nominalLivePreview'),
  quickChips: document.querySelectorAll('.quick-chip-button'),
  quickTags: document.querySelectorAll('.quick-tag-pill'),

  // Filter Dropdown Bulan, Tahun, dan Tombol Cepat
  filterBulanSelect: document.getElementById('filterBulanSelect'),
  filterTahunSelect: document.getElementById('filterTahunSelect'),
  btnQuickThisMonth: document.getElementById('btnQuickThisMonth'),
  btnQuickAll: document.getElementById('btnQuickAll'),
  searchKeyword: document.getElementById('searchKeyword'),
  historyCounterBadge: document.getElementById('historyCounterBadge'),
  transactionList: document.getElementById('transactionList'),
  emptyState: document.getElementById('emptyState'),
  emptyStateMsg: document.getElementById('emptyStateMsg'),

  // Header & Sync Modal
  btnOpenSyncModal: document.getElementById('btnOpenSyncModal'),
  syncStatusDot: document.getElementById('syncStatusDot'),
  syncStatusText: document.getElementById('syncStatusText'),
  syncModal: document.getElementById('syncModal'),
  btnCloseSyncModal: document.getElementById('btnCloseSyncModal'),
  modalTabBtns: document.querySelectorAll('.modal-tab-btn'),
  modalTabPanes: document.querySelectorAll('.modal-tab-pane'),

  // Cloud Actions
  cloudSyncKey: document.getElementById('cloudSyncKey'),
  btnSaveCloudConfig: document.getElementById('btnSaveCloudConfig'),
  btnDisconnectCloud: document.getElementById('btnDisconnectCloud'),

  // Transfer Actions
  transferCodeArea: document.getElementById('transferCodeArea'),
  btnCopyTransferCode: document.getElementById('btnCopyTransferCode'),
  btnApplyTransferCode: document.getElementById('btnApplyTransferCode'),
  btnExportJson: document.getElementById('btnExportJson'),
  importJsonInput: document.getElementById('importJsonInput'),

  // Toast
  toast: document.getElementById('toastNotification')
};

// ----------------------------------------------------------------------------
// 3. FUNGSI PEMBANTU (HELPERS)
// ----------------------------------------------------------------------------

function formatRupiah(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(amount);
}

function formatTanggalIndo(dateString) {
  if (!dateString) return '-';
  const [year, month, day] = dateString.split('-');
  const dateObj = new Date(year, parseInt(month, 10) - 1, day);

  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(dateObj);
}

const MONTH_NAMES = {
  '01': 'Januari',
  '02': 'Februari',
  '03': 'Maret',
  '04': 'April',
  '05': 'Mei',
  '06': 'Juni',
  '07': 'Juli',
  '08': 'Agustus',
  '09': 'September',
  '10': 'Oktober',
  '11': 'November',
  '12': 'Desember'
};

function getTodayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getCurrentMonthNumberString() {
  const now = new Date();
  return String(now.getMonth() + 1).padStart(2, '0');
}

function showToast(message, type = 'success') {
  elements.toast.textContent = message;
  elements.toast.className = `modern-toast show ${type === 'danger' ? 'toast-danger' : 'toast-success'}`;

  setTimeout(() => {
    elements.toast.className = 'modern-toast';
  }, 2800);
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ----------------------------------------------------------------------------
// 4. LOGIKA GANTI TEMA (DARK / LIGHT MODE)
// ----------------------------------------------------------------------------

function initTheme() {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) || 'dark';
  applyTheme(savedTheme);
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(THEME_STORAGE_KEY, theme);

  if (theme === 'dark') {
    elements.themeLabelText.textContent = 'Tema Gelap';
  } else {
    elements.themeLabelText.textContent = 'Tema Terang';
  }
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  applyTheme(newTheme);
  showToast(`Beralih ke ${newTheme === 'dark' ? 'Mode Gelap 🌙' : 'Mode Terang ☀️'}`);
}

// ----------------------------------------------------------------------------
// 5. PRIVASI SALDO (SEMBUNYIKAN / TAMPILKAN)
// ----------------------------------------------------------------------------

function initPrivacyState() {
  isBalanceHidden = localStorage.getItem(PRIVACY_STORAGE_KEY) === 'true';
  updatePrivacyUI();
}

function toggleBalancePrivacy() {
  isBalanceHidden = !isBalanceHidden;
  localStorage.setItem(PRIVACY_STORAGE_KEY, isBalanceHidden);
  updatePrivacyUI();
  updateSummary();
}

function updatePrivacyUI() {
  if (isBalanceHidden) {
    elements.eyeIconShow.style.display = 'none';
    elements.eyeIconHide.style.display = 'block';
  } else {
    elements.eyeIconShow.style.display = 'block';
    elements.eyeIconHide.style.display = 'none';
  }
}

// ----------------------------------------------------------------------------
// 6. SISTEM FILTER BULAN & TAHUN BARU
// ----------------------------------------------------------------------------

/**
 * Mengisi dropdown tahun berdasarkan data transaksi + tahun saat ini.
 */
function populateYearDropdown() {
  const currentYear = new Date().getFullYear();
  const yearsSet = new Set([currentYear]);

  // Kumpulkan tahun yang ada di data transaksi
  transactions.forEach(t => {
    if (t.tanggal) {
      const y = parseInt(t.tanggal.substring(0, 4), 10);
      if (!isNaN(y)) yearsSet.add(y);
    }
  });

  // Tambahkan tahun sebelumnya & berikutnya untuk kelonggaran
  yearsSet.add(currentYear - 1);
  yearsSet.add(currentYear + 1);

  const sortedYears = Array.from(yearsSet).sort((a, b) => b - a);

  const selectedYear = filterState.tahun || '';
  elements.filterTahunSelect.innerHTML = '<option value="">Semua Tahun</option>';

  sortedYears.forEach(year => {
    const opt = document.createElement('option');
    opt.value = String(year);
    opt.textContent = String(year);
    if (String(year) === selectedYear) opt.selected = true;
    elements.filterTahunSelect.appendChild(opt);
  });
}

/**
 * Memperbarui status tombol cepat "Bulan Ini" dan "Semua Riwayat".
 */
function updateQuickFilterButtonsUI() {
  const currentYear = String(new Date().getFullYear());
  const currentMonth = getCurrentMonthNumberString();

  const isCurrentMonthActive = filterState.bulan === currentMonth && filterState.tahun === currentYear;
  const isAllActive = filterState.bulan === '' && filterState.tahun === '';

  if (isCurrentMonthActive) {
    elements.btnQuickThisMonth.classList.add('active');
    elements.btnQuickAll.classList.remove('active');
  } else if (isAllActive) {
    elements.btnQuickThisMonth.classList.remove('active');
    elements.btnQuickAll.classList.add('active');
  } else {
    elements.btnQuickThisMonth.classList.remove('active');
    elements.btnQuickAll.classList.remove('active');
  }
}

/**
 * Menghasilkan teks deskripsi periode aktif untuk label kartu.
 */
function getActivePeriodLabel() {
  const { bulan, tahun } = filterState;

  if (bulan && tahun) {
    return `${MONTH_NAMES[bulan]} ${tahun}`;
  } else if (bulan && !tahun) {
    return `Bulan ${MONTH_NAMES[bulan]} (Semua Tahun)`;
  } else if (!bulan && tahun) {
    return `Tahun ${tahun}`;
  } else {
    return 'Semua Riwayat';
  }
}

// ----------------------------------------------------------------------------
// 7. PERHITUNGAN DASHBOARD SALDO & RASIO VISUAL
// ----------------------------------------------------------------------------

function updateSummary() {
  // Hitung total akumulasi keseluruhan
  let totalSaldo = 0;
  transactions.forEach(t => {
    if (t.jenis === 'nabung') totalSaldo += t.nominal;
    else if (t.jenis === 'tarik') totalSaldo -= t.nominal;
  });

  // Hitung pemasukan & penarikan untuk periode filter aktif
  let pemasukanPeriode = 0;
  let penarikanPeriode = 0;

  transactions.forEach(t => {
    if (isTransactionInFilter(t)) {
      if (t.jenis === 'nabung') pemasukanPeriode += t.nominal;
      else if (t.jenis === 'tarik') penarikanPeriode += t.nominal;
    }
  });

  // Render teks angka (dengan opsi sensor privasi)
  if (isBalanceHidden) {
    elements.totalSaldo.textContent = 'Rp ••••••••';
    elements.totalPemasukanBulan.textContent = 'Rp ••••••••';
    elements.totalPenarikanBulan.textContent = 'Rp ••••••••';
  } else {
    elements.totalSaldo.textContent = formatRupiah(totalSaldo);
    elements.totalPemasukanBulan.textContent = formatRupiah(pemasukanPeriode);
    elements.totalPenarikanBulan.textContent = formatRupiah(penarikanPeriode);
  }

  const periodLabel = getActivePeriodLabel();
  elements.labelBulanPemasukan.textContent = `Pemasukan (${periodLabel})`;
  elements.labelBulanPenarikan.textContent = `Penarikan (${periodLabel})`;

  // Update Visual Ratio Bar (Pemasukan vs Penarikan)
  const totalArus = pemasukanPeriode + penarikanPeriode;
  if (totalArus > 0) {
    const incomePercent = Math.round((pemasukanPeriode / totalArus) * 100);
    const expensePercent = 100 - incomePercent;

    elements.ratioBarIncome.style.width = `${incomePercent}%`;
    elements.ratioBarExpense.style.width = `${expensePercent}%`;

    if (incomePercent >= 70) {
      elements.ratioPercentageText.textContent = `🔥 Sangat Sehat (${incomePercent}% Tabungan)`;
    } else if (incomePercent >= 50) {
      elements.ratioPercentageText.textContent = `⚖️ Seimbang (${incomePercent}% Tabungan)`;
    } else {
      elements.ratioPercentageText.textContent = `⚠️ Boros (${expensePercent}% Penarikan)`;
    }
  } else {
    elements.ratioBarIncome.style.width = '100%';
    elements.ratioBarExpense.style.width = '0%';
    elements.ratioPercentageText.textContent = 'Belum Ada Transaksi';
  }
}

/**
 * Cek apakah sebuah transaksi masuk ke dalam filter aktif (Bulan & Tahun).
 */
function isTransactionInFilter(t) {
  if (!t.tanggal) return false;

  const trxYear = t.tanggal.substring(0, 4);
  const trxMonth = t.tanggal.substring(5, 7);

  const matchYear = filterState.tahun ? trxYear === filterState.tahun : true;
  const matchMonth = filterState.bulan ? trxMonth === filterState.bulan : true;

  return matchYear && matchMonth;
}

// ----------------------------------------------------------------------------
// 8. RENDER DAFTAR RIWAYAT DENGAN FILTER & SEARCH
// ----------------------------------------------------------------------------

function renderTransactions() {
  const searchQuery = elements.searchKeyword.value.trim().toLowerCase();

  let filtered = transactions.filter(t => {
    const matchesPeriod = isTransactionInFilter(t);
    const matchesQuery = searchQuery ? t.keterangan.toLowerCase().includes(searchQuery) : true;
    return matchesPeriod && matchesQuery;
  });

  // Urutkan tanggal terbaru
  filtered.sort((a, b) => {
    if (b.tanggal !== a.tanggal) return b.tanggal.localeCompare(a.tanggal);
    return b.createdAt - a.createdAt;
  });

  elements.historyCounterBadge.textContent = `${filtered.length} catatan ditemukan`;
  elements.transactionList.innerHTML = '';

  if (filtered.length === 0) {
    elements.emptyState.style.display = 'block';
    if (searchQuery) {
      elements.emptyStateMsg.textContent = `Tidak ditemukan catatan dengan kata kunci "${searchQuery}".`;
    } else {
      elements.emptyStateMsg.textContent = `Belum ada catatan transaksi pada periode ${getActivePeriodLabel()}.`;
    }
    return;
  }

  elements.emptyState.style.display = 'none';

  filtered.forEach(item => {
    const isNabung = item.jenis === 'nabung';
    const nominalTeks = isBalanceHidden 
      ? 'Rp ••••••' 
      : `${isNabung ? '+ ' : '- '}${formatRupiah(item.nominal)}`;
    const avatarClass = isNabung ? 'avatar-income' : 'avatar-expense';
    const amountClass = isNabung ? 'amount-income' : 'amount-expense';
    const iconSvg = isNabung
      ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m7 17 10-10M17 17V7H7"/></svg>`
      : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m7 7 10 10M17 7v10H7"/></svg>`;

    const card = document.createElement('div');
    card.className = 'feed-item-card';
    card.innerHTML = `
      <div class="feed-left">
        <div class="feed-icon-avatar ${avatarClass}" title="${isNabung ? 'Pemasukan Tabungan' : 'Penarikan'}">
          ${iconSvg}
        </div>
        <div class="feed-info">
          <span class="feed-note">${escapeHtml(item.keterangan)}</span>
          <div class="feed-meta">
            <span>${formatTanggalIndo(item.tanggal)}</span>
            <span class="feed-type-pill">${isNabung ? 'Nabung' : 'Tarik'}</span>
          </div>
        </div>
      </div>
      <div class="feed-right">
        <span class="feed-amount ${amountClass}">${nominalTeks}</span>
        <button 
          type="button" 
          class="btn-feed-delete" 
          title="Hapus Transaksi"
          aria-label="Hapus transaksi"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
        </button>
      </div>
    `;

    card.querySelector('.btn-feed-delete').addEventListener('click', () => handleDelete(item.id));
    elements.transactionList.appendChild(card);
  });
}

// ----------------------------------------------------------------------------
// 9. FORM SUBMIT & PINTASAN ERGONOMIS
// ----------------------------------------------------------------------------

async function handleFormSubmit(e) {
  e.preventDefault();

  const tanggal = elements.inputTanggal.value;
  const jenis = elements.form.querySelector('input[name="jenisTransaksi"]:checked').value;
  const nominal = parseFloat(elements.inputNominal.value);
  const keterangan = elements.inputKeterangan.value.trim();

  if (!tanggal) {
    alert('Silakan tentukan tanggal transaksi.');
    elements.inputTanggal.focus();
    return;
  }

  if (isNaN(nominal) || nominal <= 0) {
    alert('Nominal harus berupa angka lebih dari 0.');
    elements.inputNominal.focus();
    return;
  }

  if (!keterangan) {
    alert('Silakan tulis keterangan / catatan keperluan.');
    elements.inputKeterangan.focus();
    return;
  }

  const newTrx = {
    id: 'trx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    tanggal: tanggal,
    jenis: jenis,
    nominal: Math.round(nominal),
    keterangan: keterangan,
    createdAt: Date.now()
  };

  transactions.push(newTrx);
  await persistTransactions();

  // Sinkronkan dropdown ke bulan transaksi baru jika sedang aktif
  const trxYear = tanggal.substring(0, 4);
  const trxMonth = tanggal.substring(5, 7);

  populateYearDropdown();

  // Jika filter bulan aktif, arahkan ke periode transaksi yang baru
  if (filterState.bulan !== '' && (filterState.bulan !== trxMonth || filterState.tahun !== trxYear)) {
    filterState.bulan = trxMonth;
    filterState.tahun = trxYear;
    elements.filterBulanSelect.value = trxMonth;
    elements.filterTahunSelect.value = trxYear;
    updateQuickFilterButtonsUI();
  }

  updateSummary();
  renderTransactions();

  elements.inputNominal.value = '';
  elements.inputKeterangan.value = '';
  elements.nominalLivePreview.textContent = 'Rp 0';
  elements.form.querySelector('input[name="jenisTransaksi"][value="nabung"]').checked = true;

  showToast(
    jenis === 'nabung'
      ? `Tabungan tersimpan (+${formatRupiah(nominal)})`
      : `Penarikan dicatat (-${formatRupiah(nominal)})`,
    'success'
  );
}

async function handleDelete(id) {
  const target = transactions.find(t => t.id === id);
  if (!target) return;

  if (!confirm(`Hapus transaksi "${target.keterangan}" (${formatRupiah(target.nominal)})?`)) return;

  transactions = transactions.filter(t => t.id !== id);
  await persistTransactions();
  populateYearDropdown();
  updateSummary();
  renderTransactions();
  showToast('Transaksi telah dihapus.', 'danger');
}

function handleNominalInput() {
  const val = parseFloat(elements.inputNominal.value);
  if (!isNaN(val) && val > 0) {
    elements.nominalLivePreview.textContent = formatRupiah(val);
  } else {
    elements.nominalLivePreview.textContent = 'Rp 0';
  }
}

// ----------------------------------------------------------------------------
// 10. LOCALSTORAGE & CLOUD SYNC
// ----------------------------------------------------------------------------

function loadLocalTransactions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

/**
 * Memuat kode akses cloud dari localStorage.
 * URL Firebase sudah permanen (hardcoded), hanya syncKey yang disimpan.
 */
function loadCloudSyncKey() {
  try {
    const raw = localStorage.getItem(CLOUD_CONFIG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Mendukung format lama { dbUrl, syncKey } dan format baru (string langsung)
      return typeof parsed === 'string' ? parsed : (parsed.syncKey || '');
    }
    return '';
  } catch (e) {
    return '';
  }
}

function isCloudActive() {
  return Boolean(cloudSyncKey);
}

function getFirebaseEndpoint() {
  return `${FIREBASE_DB_URL}/tabungan/${encodeURIComponent(cloudSyncKey)}.json`;
}

async function persistTransactions() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  } catch (e) {
    console.warn('Gagal menyimpan ke localStorage:', e);
  }

  if (isCloudActive()) {
    await pushToCloud();
  }
}

async function pushToCloud() {
  if (!isCloudActive()) return;

  try {
    const response = await fetch(getFirebaseEndpoint(), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transactions)
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
  } catch (err) {
    console.warn('Gagal sinkronisasi cloud:', err);
    showToast('Peringatan: Gagal mengirim ke Cloud.', 'danger');
  }
}

async function pullFromCloud(quiet = false) {
  if (!isCloudActive()) return false;

  try {
    const res = await fetch(getFirebaseEndpoint());
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const cloudData = await res.json();
    if (Array.isArray(cloudData)) {
      transactions = cloudData;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
      populateYearDropdown();
      updateSummary();
      renderTransactions();
      if (!quiet) showToast('Data sukses disinkronkan dari Cloud! ☁️', 'success');
      return true;
    } else if (cloudData === null) {
      await pushToCloud();
      return true;
    }
  } catch (err) {
    console.warn('Cloud pull error:', err);
    if (!quiet) showToast('Gagal terhubung ke Cloud.', 'danger');
    return false;
  }
}

function updateSyncStatusUI() {
  if (isCloudActive()) {
    elements.syncStatusDot.className = 'status-indicator-dot active-cloud';
    elements.syncStatusText.textContent = `Cloud: ${cloudSyncKey}`;
    elements.btnOpenSyncModal.title = `Terhubung ke Cloud (${cloudSyncKey}). Klik untuk opsi.`;
  } else {
    elements.syncStatusDot.className = 'status-indicator-dot';
    elements.syncStatusText.textContent = 'Mode Lokal';
    elements.btnOpenSyncModal.title = 'Data disimpan di browser ini. Klik untuk mengaktifkan sinkronisasi.';
  }
}

// ----------------------------------------------------------------------------
// 11. MODAL & KODE TRANSFER
// ----------------------------------------------------------------------------

function openSyncModal() {
  elements.cloudSyncKey.value = cloudSyncKey || '';
  elements.syncModal.style.display = 'flex';
}

function closeSyncModal() {
  elements.syncModal.style.display = 'none';
}

async function handleSaveCloudConfig() {
  const syncKey = elements.cloudSyncKey.value.trim();

  if (!syncKey) {
    alert('Harap masukkan Kode Akses / ID Tabungan.');
    elements.cloudSyncKey.focus();
    return;
  }

  cloudSyncKey = syncKey;
  localStorage.setItem(CLOUD_CONFIG_KEY, JSON.stringify(syncKey));
  updateSyncStatusUI();

  showToast('Menghubungkan ke Cloud... ☁️', 'success');
  const success = await pullFromCloud(false);
  if (success) closeSyncModal();
}

function handleDisconnectCloud() {
  if (!confirm('Putuskan Cloud? Data lokal Anda tidak akan dihapus.')) return;

  cloudSyncKey = '';
  localStorage.removeItem(CLOUD_CONFIG_KEY);
  elements.cloudSyncKey.value = '';
  updateSyncStatusUI();
  showToast('Kembali ke mode penyimpanan lokal.', 'danger');
}

function handleCopyTransferCode() {
  if (transactions.length === 0) {
    alert('Belum ada transaksi untuk disalin.');
    return;
  }

  try {
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(transactions))));
    elements.transferCodeArea.value = encoded;

    navigator.clipboard.writeText(encoded).then(() => {
      showToast('Kode data berhasil disalin! Kirim ke HP Anda via WA.', 'success');
    }).catch(() => {
      elements.transferCodeArea.select();
      showToast('Kode data siap disalin dari kotak teks.', 'success');
    });
  } catch (e) {
    alert('Gagal membuat kode transfer.');
  }
}

async function handleApplyTransferCode() {
  const code = elements.transferCodeArea.value.trim();
  if (!code) {
    alert('Tempelkan kode transfer terlebih dahulu.');
    elements.transferCodeArea.focus();
    return;
  }

  try {
    const jsonStr = decodeURIComponent(escape(atob(code)));
    const imported = JSON.parse(jsonStr);

    if (!Array.isArray(imported)) throw new Error('Data bukan array transaksi.');

    if (!confirm(`Terapkan ${imported.length} transaksi ke perangkat ini?`)) return;

    transactions = imported;
    await persistTransactions();
    populateYearDropdown();
    updateSummary();
    renderTransactions();
    closeSyncModal();
    showToast('Data berhasil diterapkan di perangkat ini!', 'success');
  } catch (e) {
    alert('Kode data tidak valid atau rusak.');
  }
}

function handleExportJson() {
  const dataUri = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(transactions, null, 2));
  const link = document.createElement('a');
  link.setAttribute('href', dataUri);
  link.setAttribute('download', `tabunganku-backup-${getTodayString()}.json`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  showToast('File cadangan JSON berhasil diunduh.', 'success');
}

function handleImportJson(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async function (evt) {
    try {
      const data = JSON.parse(evt.target.result);
      if (!Array.isArray(data)) throw new Error('Format bukan array transaksi.');

      if (confirm(`Pulihkan ${data.length} transaksi dari file "${file.name}"?`)) {
        transactions = data;
        await persistTransactions();
        populateYearDropdown();
        updateSummary();
        renderTransactions();
        closeSyncModal();
        showToast('Data berhasil dipulihkan dari file JSON!', 'success');
      }
    } catch (err) {
      alert('Gagal membaca file JSON cadangan.');
    }
  };
  reader.readAsText(file);
  e.target.value = '';
}

// ----------------------------------------------------------------------------
// 12. INISIALISASI UTAMA
// ----------------------------------------------------------------------------

async function initApp() {
  // 1. Inisialisasi Tema & Privasi
  initTheme();
  initPrivacyState();

  // 2. Muat Data
  cloudSyncKey = loadCloudSyncKey();
  transactions = loadLocalTransactions();
  updateSyncStatusUI();

  elements.inputTanggal.value = getTodayString();

  // 3. Setup Dropdown Bulan & Tahun
  elements.filterBulanSelect.value = filterState.bulan;
  populateYearDropdown();
  updateQuickFilterButtonsUI();

  // 4. Daftarkan Event Listeners
  elements.themeToggleBtn.addEventListener('click', toggleTheme);
  elements.btnToggleBalance.addEventListener('click', toggleBalancePrivacy);

  elements.form.addEventListener('submit', handleFormSubmit);
  elements.inputNominal.addEventListener('input', handleNominalInput);

  // Pintasan Tambah Nominal
  elements.quickChips.forEach(btn => {
    btn.addEventListener('click', () => {
      const addValue = parseInt(btn.getAttribute('data-add'), 10);
      const currentVal = parseInt(elements.inputNominal.value, 10) || 0;
      elements.inputNominal.value = currentVal + addValue;
      handleNominalInput();
    });
  });

  // Tag Kategori Cepat
  elements.quickTags.forEach(btn => {
    btn.addEventListener('click', () => {
      elements.inputKeterangan.value = btn.getAttribute('data-tag');
      elements.inputKeterangan.focus();
    });
  });

  // Event Listener Dropdown Bulan & Tahun
  elements.filterBulanSelect.addEventListener('change', (e) => {
    filterState.bulan = e.target.value;
    updateQuickFilterButtonsUI();
    updateSummary();
    renderTransactions();
  });

  elements.filterTahunSelect.addEventListener('change', (e) => {
    filterState.tahun = e.target.value;
    updateQuickFilterButtonsUI();
    updateSummary();
    renderTransactions();
  });

  // Tombol Cepat "Bulan Ini"
  elements.btnQuickThisMonth.addEventListener('click', () => {
    const currentYear = String(new Date().getFullYear());
    const currentMonth = getCurrentMonthNumberString();

    filterState.bulan = currentMonth;
    filterState.tahun = currentYear;
    elements.filterBulanSelect.value = currentMonth;
    elements.filterTahunSelect.value = currentYear;

    updateQuickFilterButtonsUI();
    updateSummary();
    renderTransactions();
    showToast(`Menampilkan transaksi ${MONTH_NAMES[currentMonth]} ${currentYear}`);
  });

  // Tombol Cepat "Semua Riwayat"
  elements.btnQuickAll.addEventListener('click', () => {
    filterState.bulan = '';
    filterState.tahun = '';
    elements.filterBulanSelect.value = '';
    elements.filterTahunSelect.value = '';

    updateQuickFilterButtonsUI();
    updateSummary();
    renderTransactions();
    showToast('Menampilkan semua transaksi');
  });

  // Pencarian Teks
  elements.searchKeyword.addEventListener('input', renderTransactions);

  // Modal Sinkronisasi
  elements.btnOpenSyncModal.addEventListener('click', openSyncModal);
  elements.btnCloseSyncModal.addEventListener('click', closeSyncModal);
  elements.syncModal.addEventListener('click', (e) => {
    if (e.target === elements.syncModal) closeSyncModal();
  });

  elements.modalTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      elements.modalTabBtns.forEach(b => b.classList.remove('active'));
      elements.modalTabPanes.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const pane = document.getElementById(btn.getAttribute('data-tab'));
      if (pane) pane.classList.add('active');
    });
  });

  elements.btnSaveCloudConfig.addEventListener('click', handleSaveCloudConfig);
  elements.btnDisconnectCloud.addEventListener('click', handleDisconnectCloud);
  elements.btnCopyTransferCode.addEventListener('click', handleCopyTransferCode);
  elements.btnApplyTransferCode.addEventListener('click', handleApplyTransferCode);
  elements.btnExportJson.addEventListener('click', handleExportJson);
  elements.importJsonInput.addEventListener('change', handleImportJson);

  // 5. Render Awal
  updateSummary();
  renderTransactions();

  // 6. Cloud Auto-Pull saat startup
  if (isCloudActive()) {
    await pullFromCloud(true);
  }
}

document.addEventListener('DOMContentLoaded', initApp);
