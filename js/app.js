/**
 * SPPD Application - Main Logic
 * Handles form interaction, preview, and PDF generation
 */

document.addEventListener('DOMContentLoaded', () => {
    const pdfGenerator = new SPPDPdfGenerator();
    let currentPdfBlobUrl = null;

    // Tab switching logic
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const activeSectionTitle = document.getElementById('active-section-title');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');

            // Hapus kelas active dari semua tombol dan konten tab
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            // Tambahkan kelas active ke tombol yang diklik dan konten yang sesuai
            btn.classList.add('active');
            const targetContent = document.getElementById(targetTab);
            if (targetContent) {
                targetContent.classList.add('active');
            }

            // Perbarui judul utama secara dinamis
            if (activeSectionTitle) {
                if (targetTab === 'tab-settings') {
                    activeSectionTitle.textContent = 'Pengaturan Aplikasi';
                } else if (targetTab === 'tab-pegawai') {
                    activeSectionTitle.textContent = 'Kelola Data Pegawai';
                } else {
                    activeSectionTitle.textContent = 'Buat SPPD';
                }
            }

            // Sembunyikan sidebar di mobile setelah memilih menu
            closeMobileSidebar();
        });
    });

    // Mobile Sidebar Toggle Logic
    const btnToggleSidebar = document.getElementById('btnToggleSidebar');
    const sidebar = document.querySelector('.sidebar');
    const sidebarBackdrop = document.getElementById('sidebarBackdrop');

    function closeMobileSidebar() {
        if (sidebar) sidebar.classList.remove('show');
        if (sidebarBackdrop) sidebarBackdrop.classList.remove('show');
    }

    function openMobileSidebar() {
        if (sidebar) sidebar.classList.add('show');
        if (sidebarBackdrop) sidebarBackdrop.classList.add('show');
    }

    if (btnToggleSidebar) {
        btnToggleSidebar.addEventListener('click', (e) => {
            e.stopPropagation();
            if (sidebar && sidebar.classList.contains('show')) {
                closeMobileSidebar();
            } else {
                openMobileSidebar();
            }
        });
    }

    if (sidebarBackdrop) {
        sidebarBackdrop.addEventListener('click', closeMobileSidebar);
    }

    // Get all form elements
    const form = document.getElementById('sppdForm');
    const btnPreview = document.getElementById('btnPreview');
    const btnGenerate = document.getElementById('btnGenerate');
    const btnDownload = document.getElementById('btnDownload');
    const pdfPreview = document.getElementById('pdfPreview');

    /**
     * Collect all form data
     */
    function getFormData() {
        return {
            // Header
            nomorSPD: document.getElementById('nomorSPD').value,
            lembarKe: document.getElementById('lembarKe').value,
            kodeNo: document.getElementById('kodeNo').value,
            instansi: document.getElementById('instansi').value,
            unitKerja: document.getElementById('unitKerja').value,
            alamat: document.getElementById('alamat').value,

            // Section I
            berangkatDari1: document.getElementById('berangkatDari1').value,
            ke1: document.getElementById('ke1').value,
            tanggal1: document.getElementById('tanggal1').value,

            // Section II
            berangkatDari2: document.getElementById('berangkatDari2').value,
            ke2: document.getElementById('ke2').value,
            tanggal2: document.getElementById('tanggal2').value,

            // Section III
            berangkatDari3: document.getElementById('berangkatDari3').value,
            ke3: document.getElementById('ke3').value,
            tanggal3: document.getElementById('tanggal3').value,

            // Section IV
            berangkatDari4: document.getElementById('berangkatDari4').value,
            ke4: document.getElementById('ke4').value,
            tanggal4: document.getElementById('tanggal4').value,

            // Section V
            berangkatDari5: document.getElementById('berangkatDari5').value,
            ke5: document.getElementById('ke5').value,
            tanggal5: document.getElementById('tanggal5').value,

            // Section VI
            berangkatDari6: document.getElementById('berangkatDari6').value,
            ke6: document.getElementById('ke6').value,
            tanggal6: document.getElementById('tanggal6').value,

            // Pegawai
            namaPegawai: document.getElementById('namaPegawai').value,
            nipPegawai: document.getElementById('nipPegawai').value,
            jabatanPegawai: document.getElementById('jabatanPegawai').value,
            pangkatGolongan: document.getElementById('pangkatGolongan').value,
            tingkatBiaya: document.getElementById('tingkatBiaya').value,

            // Perjalanan
            keperluan: document.getElementById('keperluan').value,
            alatAngkut: document.getElementById('alatAngkut').value,
            tempatBerangkat: document.getElementById('tempatBerangkat').value,
            tempatTujuan: document.getElementById('tempatTujuan').value,

            // Durasi
            lamaPerjalanan: document.getElementById('lamaPerjalanan').value,
            tanggalBerangkat: document.getElementById('tanggalBerangkat').value,
            tanggalKembali: document.getElementById('tanggalKembali').value,

            // Pengikut
            pengikut1: document.getElementById('pengikut1').value,
            pengikut2: document.getElementById('pengikut2').value,
            pengikut3: document.getElementById('pengikut3').value,

            // Anggaran
            instansiAnggaran: document.getElementById('instansiAnggaran').value,
            akunAnggaran: document.getElementById('akunAnggaran').value,

            // Keterangan
            keteranganLain: document.getElementById('keteranganLain').value,

            // Pejabat
            dikeluarkanDi: document.getElementById('dikeluarkanDi').value,
            tanggalDikeluarkan: document.getElementById('tanggalDikeluarkan').value,
            jabatanTtd: document.getElementById('jabatanTtd').value,
            namaTtd: document.getElementById('namaTtd').value,
            nipTtd: document.getElementById('nipTtd').value,


            // Pejabat lain
            namaPejabatLain: document.getElementById('namaPejabatLain').value,
            nipPejabatLain: document.getElementById('nipPejabatLain').value,
            jabatanPejabatLain: document.getElementById('jabatanPejabatLain').value,
        };
    }

    // Modal elements
    const previewModal = document.getElementById('previewModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const modalBackdrop = document.getElementById('modalBackdrop');

    /**
     * Sinkronisasikan field-field tersembunyi dengan data dari field yang diinput user
     */
    function syncHiddenFields() {
        const tempatBerangkatVal = document.getElementById('tempatBerangkat').value;
        const tempatTujuanVal = document.getElementById('tempatTujuan').value;
        const tanggalBerangkatVal = document.getElementById('tanggalBerangkat').value;

        // Set tanggalKembali dan tanggalDikeluarkan sama dengan tanggalBerangkat
        if (tanggalBerangkatVal) {
            const tglKembaliEl = document.getElementById('tanggalKembali');
            const tglKeluarEl = document.getElementById('tanggalDikeluarkan');
            if (tglKembaliEl) tglKembaliEl.value = tanggalBerangkatVal;
            if (tglKeluarEl) tglKeluarEl.value = tanggalBerangkatVal;
        }

        // Set rute visum belakang halaman kanan agar logis
        const ruteBerangkatDari1 = document.getElementById('berangkatDari1');
        const ruteKe1 = document.getElementById('ke1');
        const ruteTanggal1 = document.getElementById('tanggal1');
        const ruteBerangkatDari2 = document.getElementById('berangkatDari2');
        const ruteKe2 = document.getElementById('ke2');
        const ruteTanggal2 = document.getElementById('tanggal2');

        if (ruteBerangkatDari1) ruteBerangkatDari1.value = tempatBerangkatVal;
        if (ruteKe1) ruteKe1.value = tempatTujuanVal;
        if (ruteTanggal1) ruteTanggal1.value = tanggalBerangkatVal;

        if (ruteBerangkatDari2) ruteBerangkatDari2.value = tempatTujuanVal;
        if (ruteKe2) ruteKe2.value = tempatBerangkatVal;
        if (ruteTanggal2) ruteTanggal2.value = tanggalBerangkatVal;
    }

    /**
     * Show PDF preview using iframe inside the modal
     */
    function showPreview() {
        syncHiddenFields();
        const data = getFormData();
        
        // Revoke previous blob URL
        if (currentPdfBlobUrl) {
            URL.revokeObjectURL(currentPdfBlobUrl);
        }

        // Generate new PDF blob URL
        currentPdfBlobUrl = pdfGenerator.getPDFBlobURL(data);

        // Show in iframe
        pdfPreview.innerHTML = `
            <iframe 
                src="${currentPdfBlobUrl}" 
                style="width: 100%; height: 100%; border: none; border-radius: 8px;"
                title="PDF Preview"
            ></iframe>
        `;

        // Enable download button
        btnDownload.disabled = false;

        // Open modal
        previewModal.classList.add('show');
    }

    /**
     * Close preview modal
     */
    function closeModal() {
        previewModal.classList.remove('show');
    }

    /**
     * Generate and download PDF
     */
    function generateAndDownload() {
        syncHiddenFields();
        const data = getFormData();
        
        // Generate filename from nomor SPD
        const filename = `SPPD_${data.nomorSPD.replace(/\//g, '_')}_${data.namaPegawai.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
        
        pdfGenerator.downloadPDF(data, filename);
    }

    /**
     * Download existing preview PDF
     */
    function downloadPreview() {
        syncHiddenFields();
        if (currentPdfBlobUrl) {
            const data = getFormData();
            const filename = `SPPD_${data.nomorSPD.replace(/\//g, '_')}_${data.namaPegawai.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
            
            const link = document.createElement('a');
            link.href = currentPdfBlobUrl;
            link.download = filename;
            link.click();
        }
    }

    /**
     * Reset form
     */
    function resetForm() {
        if (currentPdfBlobUrl) {
            URL.revokeObjectURL(currentPdfBlobUrl);
            currentPdfBlobUrl = null;
        }
        pdfPreview.innerHTML = '<p class="placeholder-text">Memuat dokumen PDF...</p>';
        btnDownload.disabled = true;
    }

    // Event listeners
    if (btnPreview) btnPreview.addEventListener('click', showPreview);
    if (btnGenerate) btnGenerate.addEventListener('click', generateAndDownload);
    if (btnDownload) btnDownload.addEventListener('click', downloadPreview);
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    if (modalBackdrop) modalBackdrop.addEventListener('click', closeModal);
    
    form.addEventListener('reset', () => {
        setTimeout(resetForm, 100);
    });

    // Auto-update preview on form change (debounced)
    let debounceTimer;
    form.addEventListener('input', () => {
        syncHiddenFields();
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            // Hanya update jika modal sedang aktif/terbuka
            if (previewModal.classList.contains('show')) {
                showPreview();
            }
        }, 500);
    });

    // ==========================================
    // EMPLOYEE CRUD & AUTO-FILL INTEGRATION
    // ==========================================
    
    // Seed Data Awal
    const defaultEmployees = [
        { nama: "ECEP SUGIARTO, S.E., M.A.B", nip: "19680406 199703 1 002", jabatan: "Kepala P3D Wilayah Kabupaten Tasikmalaya", pangkat: "Pembina (IV/a)", tingkatBiaya: "Tingkat A", peran: "Keduanya" },
        { nama: "MOHAMAD DENI ZAKARIA, S.STP., M.Si", nip: "19810215 201101 1 001", jabatan: "KASUBAG TATA USAHA", pangkat: "Penata (III/c)", tingkatBiaya: "Tingkat B", peran: "Pelaksana" },
        { nama: "KARPATI WANDA HIDAYAT, S.Sos., M.AP", nip: "19750612 200212 1 003", jabatan: "Pejabat Pengesah", pangkat: "Penata Tk. I (III/d)", tingkatBiaya: "Tingkat B", peran: "Pelaksana" }
    ];

    // Ambil data pegawai dari LocalStorage
    function getSavedEmployees() {
        const data = localStorage.getItem('sppd_employees');
        if (!data) {
            localStorage.setItem('sppd_employees', JSON.stringify(defaultEmployees));
            return defaultEmployees;
        }
        return JSON.parse(data);
    }

    // Helper untuk menangani kompatibilitas peran pegawai lama (string) ke format baru (array)
    function getEmployeeRoles(emp) {
        if (!emp.peran) return [];
        if (Array.isArray(emp.peran)) return emp.peran;
        
        // Pemetaan dari data string lama
        if (emp.peran === 'Keduanya') {
            return ['Pelaksana', 'KPA'];
        }
        if (emp.peran === 'Pelaksana') {
            return ['Pelaksana'];
        }
        if (emp.peran === 'KPA') {
            return ['KPA'];
        }
        // Jika berupa peran kustom string tunggal lama
        return [emp.peran];
    }

    // Simpan ke LocalStorage & Sync dropdown
    function saveEmployees(arr) {
        localStorage.setItem('sppd_employees', JSON.stringify(arr));
        populateQuickSelects(arr);
    }

    // Isi pilihan dropdown pilih cepat di formulir utama & KPA
    function populateQuickSelects(employees) {
        const selectPegawai = document.getElementById('selectPegawai');
        const selectKPA = document.getElementById('selectKPA');

        if (selectPegawai) {
            selectPegawai.innerHTML = '<option value="">-- Pilih Pegawai --</option>';
            employees.forEach((emp, index) => {
                const roles = getEmployeeRoles(emp);
                const hasPelaksana = roles.includes('Pelaksana');
                const hasKPAOnly = roles.length === 1 && roles.includes('KPA');
                // Pegawai bisa dipilih sebagai pelaksana jika memiliki peran Pelaksana
                // atau perannya tidak hanya KPA (misal ada peran kustom lain)
                if (hasPelaksana || (!hasKPAOnly && roles.length > 0)) {
                    const opt = document.createElement('option');
                    opt.value = index;
                    opt.textContent = `${emp.nama} (${emp.nip})`;
                    selectPegawai.appendChild(opt);
                }
            });
        }

        if (selectKPA) {
            selectKPA.innerHTML = '<option value="">-- Pilih Pejabat KPA --</option>';
            employees.forEach((emp, index) => {
                const roles = getEmployeeRoles(emp);
                if (roles.includes('KPA')) {
                    const opt = document.createElement('option');
                    opt.value = index;
                    opt.textContent = `${emp.nama} (${emp.nip})`;
                    selectKPA.appendChild(opt);
                }
            });
        }
    }

    // Render Tabel CRUD Pegawai
    function renderEmployeeTable() {
        const tbody = document.getElementById('employeeTableBody');
        if (!tbody) return;

        const employees = getSavedEmployees();
        tbody.innerHTML = '';

        if (employees.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 20px; color: var(--text-muted); font-style: italic;">Belum ada data pegawai. Silakan tambah baru.</td></tr>`;
            return;
        }

        employees.forEach((emp, index) => {
            const tr = document.createElement('tr');
            
            const roles = getEmployeeRoles(emp);
            let badgesHtml = '<div style="display: flex; flex-wrap: wrap; gap: 6px;">';
            roles.forEach(role => {
                let badgeClass = 'badge-pelaksana';
                let badgeText = role;
                
                if (role === 'Pelaksana') {
                    badgeClass = 'badge-pelaksana';
                    badgeText = 'Pelaksana';
                } else if (role === 'KPA') {
                    badgeClass = 'badge-kpa';
                    badgeText = 'Pejabat KPA';
                } else {
                    badgeClass = 'badge-kustom';
                    badgeText = role;
                }
                
                badgesHtml += `<span class="crud-badge ${badgeClass}" style="font-size: 0.72em; padding: 4px 8px; border-radius: 6px; white-space: nowrap;">${badgeText}</span>`;
            });
            badgesHtml += '</div>';
            
            if (roles.length === 0) {
                badgesHtml = '<span class="crud-badge" style="background-color: #cbd5e1; color: #64748b; font-size: 0.72em; padding: 4px 8px; border-radius: 6px;">Tanpa Peran</span>';
            }

            tr.innerHTML = `
                <td style="padding: 14px 16px; border-bottom: 1px solid var(--border-color); vertical-align: middle;">
                    <strong style="color: var(--text-dark);">${emp.nama}</strong>
                    <div style="font-size: 0.85em; color: var(--text-muted); margin-top: 2px;">NIP. ${emp.nip}</div>
                </td>
                <td style="padding: 14px 16px; border-bottom: 1px solid var(--border-color); vertical-align: middle;">${emp.jabatan}</td>
                <td style="padding: 14px 16px; border-bottom: 1px solid var(--border-color); vertical-align: middle;">
                    <div>${emp.pangkat || '-'}</div>
                    <div style="font-size: 0.85em; color: var(--text-muted);">${emp.tingkatBiaya || '-'}</div>
                </td>
                <td style="padding: 14px 16px; border-bottom: 1px solid var(--border-color); vertical-align: middle;">
                    ${badgesHtml}
                </td>
                <td style="padding: 14px 16px; border-bottom: 1px solid var(--border-color); vertical-align: middle; text-align: center;">
                    <div style="display: flex; gap: 8px; justify-content: center; align-items: center;">
                        <button type="button" class="btn-action btn-action-edit" data-index="${index}">Edit</button>
                        <button type="button" class="btn-action btn-action-delete" data-index="${index}">Hapus</button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Pasang event listener untuk tombol Edit & Hapus
        tbody.querySelectorAll('.btn-action-edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = e.target.getAttribute('data-index');
                editEmployee(idx);
            });
        });

        tbody.querySelectorAll('.btn-action-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = e.target.getAttribute('data-index');
                deleteEmployee(idx);
            });
        });
    }

    // CRUD - Deklarasi Input
    const btnTambahPegawai = document.getElementById('btnTambahPegawai');
    const employeeModal = document.getElementById('employeeModal');
    const employeeModalBackdrop = document.getElementById('employeeModalBackdrop');
    const closeEmployeeModalBtn = document.getElementById('closeEmployeeModalBtn');
    const employeeFormTitle = document.getElementById('employeeFormTitle');
    const employeeIndex = document.getElementById('employeeIndex');
    
    const empNama = document.getElementById('empNama');
    const empNIP = document.getElementById('empNIP');
    const empJabatan = document.getElementById('empJabatan');
    const empPangkat = document.getElementById('empPangkat');
    const empTingkatBiaya = document.getElementById('empTingkatBiaya');
    
    // Checkbox peran pegawai
    const chkEmpPelaksana = document.getElementById('chkEmpPelaksana');
    const chkEmpKPA = document.getElementById('chkEmpKPA');
    const chkEmpKustom = document.getElementById('chkEmpKustom');
    
    const btnSimpanPegawai = document.getElementById('btnSimpanPegawai');
    const btnBatalPegawai = document.getElementById('btnBatalPegawai');

    const empPeranKustomGroup = document.getElementById('empPeranKustomGroup');
    const empPeranKustom = document.getElementById('empPeranKustom');
    
    if (chkEmpKustom) {
        chkEmpKustom.addEventListener('change', () => {
            if (chkEmpKustom.checked) {
                empPeranKustomGroup.style.display = 'block';
                empPeranKustom.focus();
            } else {
                empPeranKustomGroup.style.display = 'none';
                empPeranKustom.value = '';
            }
        });
    }

    function closeEmployeeModal() {
        if (employeeModal) employeeModal.classList.remove('show');
    }

    if (btnTambahPegawai) {
        btnTambahPegawai.addEventListener('click', () => {
            employeeFormTitle.textContent = 'Tambah Pegawai Baru';
            employeeIndex.value = '';
            empNama.value = '';
            empNIP.value = '';
            empJabatan.value = '';
            empPangkat.value = '';
            empTingkatBiaya.value = '';
            
            // Set default peran: Pelaksana dicentang, lainnya tidak
            if (chkEmpPelaksana) chkEmpPelaksana.checked = true;
            if (chkEmpKPA) chkEmpKPA.checked = false;
            if (chkEmpKustom) chkEmpKustom.checked = false;
            
            if (empPeranKustomGroup) empPeranKustomGroup.style.display = 'none';
            if (empPeranKustom) empPeranKustom.value = '';
            
            if (employeeModal) employeeModal.classList.add('show');
            empNama.focus();
        });
    }

    if (btnBatalPegawai) {
        btnBatalPegawai.addEventListener('click', closeEmployeeModal);
    }
    if (closeEmployeeModalBtn) {
        closeEmployeeModalBtn.addEventListener('click', closeEmployeeModal);
    }
    if (employeeModalBackdrop) {
        employeeModalBackdrop.addEventListener('click', closeEmployeeModal);
    }

    // CRUD - Simpan Data Pegawai
    if (btnSimpanPegawai) {
        btnSimpanPegawai.addEventListener('click', () => {
            const namaVal = empNama.value.trim();
            const nipVal = empNIP.value.trim();
            const jabatanVal = empJabatan.value.trim();
            const pangkatVal = empPangkat.value.trim();
            const tingkatVal = empTingkatBiaya.value.trim();
            
            // Kumpulkan semua peran yang dicentang
            const peranRoles = [];
            if (chkEmpPelaksana && chkEmpPelaksana.checked) {
                peranRoles.push('Pelaksana');
            }
            if (chkEmpKPA && chkEmpKPA.checked) {
                peranRoles.push('KPA');
            }
            if (chkEmpKustom && chkEmpKustom.checked) {
                const kustomVal = empPeranKustom.value.trim();
                if (!kustomVal) {
                    alert('Nama Peran Kustom wajib diisi jika Peran Lainnya dicentang!');
                    return;
                }
                peranRoles.push(kustomVal);
            }

            if (peranRoles.length === 0) {
                alert('Pilih minimal satu Peran Pegawai!');
                return;
            }

            if (!namaVal || !nipVal || !jabatanVal) {
                alert('Nama Lengkap, NIP, dan Jabatan wajib diisi!');
                return;
            }

            const employees = getSavedEmployees();
            const idxVal = employeeIndex.value;

            const newEmployee = {
                nama: namaVal,
                nip: nipVal,
                jabatan: jabatanVal,
                pangkat: pangkatVal,
                tingkatBiaya: tingkatVal,
                peran: peranRoles // simpan sebagai array
            };

            if (idxVal === '') {
                employees.push(newEmployee);
            } else {
                employees[parseInt(idxVal)] = newEmployee;
            }

            saveEmployees(employees);
            renderEmployeeTable();
            closeEmployeeModal();
        });
    }

    // CRUD - Edit Data Pegawai
    function editEmployee(index) {
        const employees = getSavedEmployees();
        const emp = employees[index];

        if (!emp) return;

        employeeFormTitle.textContent = 'Edit Data Pegawai';
        employeeIndex.value = index;
        empNama.value = emp.nama;
        empNIP.value = emp.nip;
        empJabatan.value = emp.jabatan;
        empPangkat.value = emp.pangkat || '';
        empTingkatBiaya.value = emp.tingkatBiaya || '';
        
        // Reset checkbox
        if (chkEmpPelaksana) chkEmpPelaksana.checked = false;
        if (chkEmpKPA) chkEmpKPA.checked = false;
        if (chkEmpKustom) chkEmpKustom.checked = false;
        if (empPeranKustom) empPeranKustom.value = '';
        if (empPeranKustomGroup) empPeranKustomGroup.style.display = 'none';

        const roles = getEmployeeRoles(emp);
        if (roles.includes('Pelaksana')) {
            if (chkEmpPelaksana) chkEmpPelaksana.checked = true;
        }
        if (roles.includes('KPA')) {
            if (chkEmpKPA) chkEmpKPA.checked = true;
        }
        
        // Cek peran kustom
        const kustomRoles = roles.filter(r => r !== 'Pelaksana' && r !== 'KPA');
        if (kustomRoles.length > 0) {
            if (chkEmpKustom) chkEmpKustom.checked = true;
            if (empPeranKustomGroup) empPeranKustomGroup.style.display = 'block';
            if (empPeranKustom) empPeranKustom.value = kustomRoles[0]; // ambil peran kustom pertama
        }

        if (employeeModal) employeeModal.classList.add('show');
        empNama.focus();
    }

    // CRUD - Hapus Data Pegawai
    function deleteEmployee(index) {
        const employees = getSavedEmployees();
        const emp = employees[index];

        if (!emp) return;

        if (confirm(`Apakah Anda yakin ingin menghapus data pegawai "${emp.nama}"?`)) {
            employees.splice(index, 1);
            saveEmployees(employees);
            renderEmployeeTable();
        }
    }

    // Auto-Fill Form Perjalanan Dinas (Pelaksana)
    const selectPegawai = document.getElementById('selectPegawai');
    if (selectPegawai) {
        selectPegawai.addEventListener('change', (e) => {
            const index = e.target.value;
            if (index === '') return;

            const employees = getSavedEmployees();
            const emp = employees[parseInt(index)];
            if (!emp) return;

            document.getElementById('namaPegawai').value = emp.nama;
            document.getElementById('nipPegawai').value = emp.nip;
            document.getElementById('jabatanPegawai').value = emp.jabatan;
            document.getElementById('pangkatGolongan').value = emp.pangkat || '';
            document.getElementById('tingkatBiaya').value = emp.tingkatBiaya || '';

            // Update preview secara langsung jika modal sedang aktif
            if (previewModal.classList.contains('show')) {
                showPreview();
            }
        });
    }

    // Auto-Fill Form Pejabat Penandatangan (KPA)
    const selectKPA = document.getElementById('selectKPA');
    if (selectKPA) {
        selectKPA.addEventListener('change', (e) => {
            const index = e.target.value;
            if (index === '') return;

            const employees = getSavedEmployees();
            const emp = employees[parseInt(index)];
            if (!emp) return;

            document.getElementById('namaTtd').value = emp.nama;
            document.getElementById('nipTtd').value = emp.nip;
            document.getElementById('jabatanTtd').value = emp.jabatan;

            // Update preview secara langsung jika modal sedang aktif
            if (previewModal.classList.contains('show')) {
                showPreview();
            }
        });
    }

    // Inisialisasi default Kuasa Pengguna Anggaran (KPA) di form utama berdasarkan data KPA sah
    function initKPALainDefault() {
        const inputKPA = document.getElementById('namaPejabatLain');
        const nipKPA = document.getElementById('nipPejabatLain');
        const jabKPA = document.getElementById('jabatanPejabatLain');
        
        if (inputKPA) {
            const employees = getSavedEmployees();
            // Cari KPA pertama
            const defaultKPA = employees.find(emp => {
                const roles = getEmployeeRoles(emp);
                return roles.includes('KPA');
            });
            
            if (defaultKPA) {
                inputKPA.value = defaultKPA.nama;
                if (nipKPA) nipKPA.value = defaultKPA.nip;
                if (jabKPA) jabKPA.value = defaultKPA.jabatan;
            } else if (employees.length > 0) {
                // Fallback jika tidak ada KPA sama sekali
                inputKPA.value = employees[0].nama;
                if (nipKPA) nipKPA.value = employees[0].nip;
                if (jabKPA) jabKPA.value = employees[0].jabatan;
            }
        }
    }

    // ==========================================
    // LOGIKA PENGATURAN (SETTINGS) PERSISTEN
    // ==========================================
    function loadSettings() {
        const settingsData = localStorage.getItem('sppd_settings');
        if (!settingsData) return;
        
        try {
            const settings = JSON.parse(settingsData);
            
            // Kop & Instansi
            if (settings.instansi) document.getElementById('instansi').value = settings.instansi;
            if (settings.unitKerja) document.getElementById('unitKerja').value = settings.unitKerja;
            if (settings.alamat) document.getElementById('alamat').value = settings.alamat;
            
            // Pembebanan Anggaran
            if (settings.instansiAnggaran) document.getElementById('instansiAnggaran').value = settings.instansiAnggaran;
            if (settings.akunAnggaran) document.getElementById('akunAnggaran').value = settings.akunAnggaran;
            
            // Pejabat Penandatangan
            if (settings.dikeluarkanDi) document.getElementById('dikeluarkanDi').value = settings.dikeluarkanDi;
            if (settings.jabatanTtd) document.getElementById('jabatanTtd').value = settings.jabatanTtd;
            if (settings.namaTtd) document.getElementById('namaTtd').value = settings.namaTtd;
            if (settings.nipTtd) document.getElementById('nipTtd').value = settings.nipTtd;
        } catch (e) {
            console.error('Gagal memuat pengaturan:', e);
        }
    }

    function saveSettings() {
        const settings = {
            instansi: document.getElementById('instansi').value,
            unitKerja: document.getElementById('unitKerja').value,
            alamat: document.getElementById('alamat').value,
            instansiAnggaran: document.getElementById('instansiAnggaran').value,
            akunAnggaran: document.getElementById('akunAnggaran').value,
            dikeluarkanDi: document.getElementById('dikeluarkanDi').value,
            jabatanTtd: document.getElementById('jabatanTtd').value,
            namaTtd: document.getElementById('namaTtd').value,
            nipTtd: document.getElementById('nipTtd').value
        };
        
        localStorage.setItem('sppd_settings', JSON.stringify(settings));
        alert('Pengaturan aplikasi berhasil disimpan secara permanen!');
        
        // Update preview secara langsung jika modal sedang aktif
        if (previewModal && previewModal.classList.contains('show')) {
            showPreview();
        }
    }

    // ==========================================
    // LOGIKA PENYIMPANAN & RENDER SPPD DOCUMENTS
    // ==========================================
    function getSavedSppdDocs() {
        const data = localStorage.getItem('sppd_documents');
        if (!data) return [];
        return JSON.parse(data);
    }

    function saveSppdDocs(arr) {
        localStorage.setItem('sppd_documents', JSON.stringify(arr));
        renderSppdCardGrid();
    }

    function renderSppdCardGrid() {
        const grid = document.getElementById('sppdCardGrid');
        if (!grid) return;

        const docs = getSavedSppdDocs();
        grid.innerHTML = '';

        if (docs.length === 0) {
            grid.innerHTML = `
                <div class="sppd-empty-state">
                    <div class="sppd-empty-title">Belum Ada Dokumen SPPD</div>
                    <div class="sppd-empty-desc">Silakan buat dokumen SPPD pertama Anda dengan menekan tombol di bawah ini.</div>
                    <button type="button" id="btnMulaiBuatSppd" class="btn btn-primary" style="min-width: auto; padding: 10px 20px;">Buat Dokumen Baru</button>
                </div>
            `;
            const btnMulai = document.getElementById('btnMulaiBuatSppd');
            if (btnMulai) {
                btnMulai.addEventListener('click', bukaSppdModalBaru);
            }
            return;
        }

        docs.forEach((doc, index) => {
            const card = document.createElement('div');
            card.className = 'sppd-card';
            
            // Format tanggal yang ramah
            let tglFormatted = doc.formData.tanggalBerangkat;
            try {
                const parts = doc.formData.tanggalBerangkat.split('-');
                if (parts.length === 3) {
                    tglFormatted = `${parts[2]}/${parts[1]}/${parts[0]}`;
                }
            } catch(e){}

            card.innerHTML = `
                <div>
                    <div class="sppd-card-header">
                        <div class="sppd-card-number">No SPD: ${doc.formData.nomorSPD}</div>
                        <div class="sppd-card-date">Dibuat: ${new Date(doc.createdAt).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'})}</div>
                    </div>
                    <div class="sppd-card-body">
                        <div class="sppd-card-pegawai">${doc.formData.namaPegawai}</div>
                        <div class="sppd-card-meta">
                            <div class="sppd-card-meta-item">
                                <span class="sppd-card-meta-icon">📍</span>
                                <span class="sppd-card-meta-text"><strong>Rute:</strong> ${doc.formData.tempatBerangkat} ➔ ${doc.formData.tempatTujuan}</span>
                            </div>
                            <div class="sppd-card-meta-item">
                                <span class="sppd-card-meta-icon">📅</span>
                                <span class="sppd-card-meta-text"><strong>Berangkat:</strong> ${tglFormatted} (${doc.formData.lamaPerjalanan})</span>
                            </div>
                            <div class="sppd-card-meta-item">
                                <span class="sppd-card-meta-icon">📋</span>
                                <span class="sppd-card-meta-text" style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;"><strong>Maksud:</strong> ${doc.formData.keperluan}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="sppd-card-footer">
                    <button type="button" class="sppd-card-btn sppd-card-btn-preview" data-index="${index}">Preview</button>
                    <button type="button" class="sppd-card-btn sppd-card-btn-download" data-index="${index}">Unduh</button>
                    <button type="button" class="sppd-card-btn sppd-card-btn-edit" data-index="${index}">Edit</button>
                    <button type="button" class="sppd-card-btn sppd-card-btn-delete" data-index="${index}">Hapus</button>
                </div>
            `;
            grid.appendChild(card);
        });

        // Binding event listeners
        grid.querySelectorAll('.sppd-card-btn-preview').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = e.target.getAttribute('data-index');
                previewSppdDoc(idx);
            });
        });
        
        grid.querySelectorAll('.sppd-card-btn-download').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = e.target.getAttribute('data-index');
                downloadSppdDoc(idx);
            });
        });

        grid.querySelectorAll('.sppd-card-btn-edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = e.target.getAttribute('data-index');
                editSppdDoc(idx);
            });
        });

        grid.querySelectorAll('.sppd-card-btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = e.target.getAttribute('data-index');
                deleteSppdDoc(idx);
            });
        });
    }

    // DOM Elements modal form SPPD
    const sppdFormModal = document.getElementById('sppdFormModal');
    const btnBukaSppdModal = document.getElementById('btnBukaSppdModal');
    const closeSppdFormModalBtn = document.getElementById('closeSppdFormModalBtn');
    const sppdFormModalBackdrop = document.getElementById('sppdFormModalBackdrop');
    const btnSimpanSppd = document.getElementById('btnSimpanSppd');
    const btnBatalSppd = document.getElementById('btnBatalSppd');
    const sppdFormModalTitle = document.getElementById('sppdFormModalTitle');
    const sppdIndex = document.getElementById('sppdIndex');

    let currentEditingSppdIndex = null;

    function bukaSppdModalBaru() {
        sppdFormModalTitle.textContent = 'Buat SPPD Baru';
        sppdIndex.value = '';
        currentEditingSppdIndex = null;
        
        // Reset form
        form.reset();
        
        // Isi default Kuasa Pengguna Anggaran
        initKPALainDefault();
        
        if (sppdFormModal) sppdFormModal.classList.add('show');
    }

    function closeSppdModal() {
        if (sppdFormModal) sppdFormModal.classList.remove('show');
    }

    if (btnBukaSppdModal) btnBukaSppdModal.addEventListener('click', bukaSppdModalBaru);
    if (closeSppdFormModalBtn) closeSppdFormModalBtn.addEventListener('click', closeSppdModal);
    if (sppdFormModalBackdrop) sppdFormModalBackdrop.addEventListener('click', closeSppdModal);
    if (btnBatalSppd) btnBatalSppd.addEventListener('click', closeSppdModal);

    if (btnSimpanSppd) {
        btnSimpanSppd.addEventListener('click', () => {
            // Validasi input minimal
            if (!document.getElementById('nomorSPD').value || !document.getElementById('namaPegawai').value) {
                alert('Nomor SPD dan Nama Pegawai wajib diisi!');
                return;
            }
            
            syncHiddenFields();
            const formData = getFormData();
            const docs = getSavedSppdDocs();
            const idxVal = sppdIndex.value;

            const newDoc = {
                id: idxVal === '' ? 'SPPD_' + Date.now() : docs[parseInt(idxVal)].id,
                createdAt: idxVal === '' ? new Date().toISOString() : docs[parseInt(idxVal)].createdAt,
                formData: formData
            };

            if (idxVal === '') {
                docs.push(newDoc);
            } else {
                docs[parseInt(idxVal)] = newDoc;
            }

            saveSppdDocs(docs);
            closeSppdModal();
        });
    }

    function editSppdDoc(index) {
        const docs = getSavedSppdDocs();
        const doc = docs[index];
        if (!doc) return;

        sppdFormModalTitle.textContent = 'Edit Dokumen SPPD';
        sppdIndex.value = index;
        currentEditingSppdIndex = index;

        // Isi form dengan data yang tersimpan
        const data = doc.formData;
        
        // Field nomor & dokumen
        document.getElementById('nomorSPD').value = data.nomorSPD || '';
        if (document.getElementById('lembarKe')) document.getElementById('lembarKe').value = data.lembarKe || '';
        if (document.getElementById('kodeNo')) document.getElementById('kodeNo').value = data.kodeNo || '';

        // Kuasa Pengguna Anggaran
        document.getElementById('namaPejabatLain').value = data.namaPejabatLain || '';
        if (document.getElementById('nipPejabatLain')) document.getElementById('nipPejabatLain').value = data.nipPejabatLain || '';
        if (document.getElementById('jabatanPejabatLain')) document.getElementById('jabatanPejabatLain').value = data.jabatanPejabatLain || '';

        // Pegawai
        document.getElementById('namaPegawai').value = data.namaPegawai || '';
        if (document.getElementById('nipPegawai')) document.getElementById('nipPegawai').value = data.nipPegawai || '';
        if (document.getElementById('jabatanPegawai')) document.getElementById('jabatanPegawai').value = data.jabatanPegawai || '';
        if (document.getElementById('pangkatGolongan')) document.getElementById('pangkatGolongan').value = data.pangkatGolongan || '';
        if (document.getElementById('tingkatBiaya')) document.getElementById('tingkatBiaya').value = data.tingkatBiaya || '';

        // Maksud & rute
        document.getElementById('keperluan').value = data.keperluan || '';
        if (document.getElementById('alatAngkut')) document.getElementById('alatAngkut').value = data.alatAngkut || '';
        document.getElementById('tempatBerangkat').value = data.tempatBerangkat || '';
        document.getElementById('tempatTujuan').value = data.tempatTujuan || '';

        // Durasi
        document.getElementById('lamaPerjalanan').value = data.lamaPerjalanan || '';
        document.getElementById('tanggalBerangkat').value = data.tanggalBerangkat || '';
        if (document.getElementById('tanggalKembali')) document.getElementById('tanggalKembali').value = data.tanggalKembali || '';

        // Rute visum
        if (document.getElementById('berangkatDari1')) document.getElementById('berangkatDari1').value = data.berangkatDari1 || '';
        if (document.getElementById('ke1')) document.getElementById('ke1').value = data.ke1 || '';
        if (document.getElementById('tanggal1')) document.getElementById('tanggal1').value = data.tanggal1 || '';
        
        if (document.getElementById('berangkatDari2')) document.getElementById('berangkatDari2').value = data.berangkatDari2 || '';
        if (document.getElementById('ke2')) document.getElementById('ke2').value = data.ke2 || '';
        if (document.getElementById('tanggal2')) document.getElementById('tanggal2').value = data.tanggal2 || '';

        if (document.getElementById('berangkatDari3')) document.getElementById('berangkatDari3').value = data.berangkatDari3 || '';
        if (document.getElementById('ke3')) document.getElementById('ke3').value = data.ke3 || '';
        if (document.getElementById('tanggal3')) document.getElementById('tanggal3').value = data.tanggal3 || '';

        if (document.getElementById('berangkatDari4')) document.getElementById('berangkatDari4').value = data.berangkatDari4 || '';
        if (document.getElementById('ke4')) document.getElementById('ke4').value = data.ke4 || '';
        if (document.getElementById('tanggal4')) document.getElementById('tanggal4').value = data.tanggal4 || '';

        if (document.getElementById('berangkatDari5')) document.getElementById('berangkatDari5').value = data.berangkatDari5 || '';
        if (document.getElementById('ke5')) document.getElementById('ke5').value = data.ke5 || '';
        if (document.getElementById('tanggal5')) document.getElementById('tanggal5').value = data.tanggal5 || '';

        if (document.getElementById('berangkatDari6')) document.getElementById('berangkatDari6').value = data.berangkatDari6 || '';
        if (document.getElementById('ke6')) document.getElementById('ke6').value = data.ke6 || '';
        if (document.getElementById('tanggal6')) document.getElementById('tanggal6').value = data.tanggal6 || '';

        // Dikeluarkan
        if (document.getElementById('tanggalDikeluarkan')) document.getElementById('tanggalDikeluarkan').value = data.tanggalDikeluarkan || '';
        
        // Pengikut
        if (document.getElementById('pengikut1')) document.getElementById('pengikut1').value = data.pengikut1 || '';
        if (document.getElementById('pengikut2')) document.getElementById('pengikut2').value = data.pengikut2 || '';
        if (document.getElementById('pengikut3')) document.getElementById('pengikut3').value = data.pengikut3 || '';

        // Keterangan
        if (document.getElementById('keteranganLain')) document.getElementById('keteranganLain').value = data.keteranganLain || '';

        if (sppdFormModal) sppdFormModal.classList.add('show');
    }

    function deleteSppdDoc(index) {
        const docs = getSavedSppdDocs();
        const doc = docs[index];
        if (!doc) return;

        if (confirm(`Apakah Anda yakin ingin menghapus dokumen SPPD No "${doc.formData.nomorSPD}"?`)) {
            docs.splice(index, 1);
            saveSppdDocs(docs);
        }
    }

    function previewSppdDoc(index) {
        const docs = getSavedSppdDocs();
        const doc = docs[index];
        if (!doc) return;

        const data = doc.formData;
        
        if (currentPdfBlobUrl) {
            URL.revokeObjectURL(currentPdfBlobUrl);
        }
        currentPdfBlobUrl = pdfGenerator.getPDFBlobURL(data);

        pdfPreview.innerHTML = `
            <iframe 
                src="${currentPdfBlobUrl}" 
                style="width: 100%; height: 100%; border: none; border-radius: 8px;"
                title="PDF Preview"
            ></iframe>
        `;

        btnDownload.disabled = false;
        previewModal.classList.add('show');
    }

    function downloadSppdDoc(index) {
        const docs = getSavedSppdDocs();
        const doc = docs[index];
        if (!doc) return;

        const data = doc.formData;
        const filename = `SPPD_${data.nomorSPD.replace(/\//g, '_')}_${data.namaPegawai.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
        pdfGenerator.downloadPDF(data, filename);
    }

    // Inisialisasi awal list dan dropdown
    const initialEmployees = getSavedEmployees();
    populateQuickSelects(initialEmployees);
    renderEmployeeTable();
    initKPALainDefault();
    loadSettings();
    renderSppdCardGrid();

    const btnSimpanPengaturan = document.getElementById('btnSimpanPengaturan');
    if (btnSimpanPengaturan) {
        btnSimpanPengaturan.addEventListener('click', saveSettings);
    }

    // ==========================================
    // SEARCHABLE DROPDOWN KOTA/KABUPATEN JABAR
    // ==========================================
    const jabarCities = [
        "Kabupaten Bandung",
        "Kabupaten Bandung Barat",
        "Kabupaten Bekasi",
        "Kabupaten Bogor",
        "Kabupaten Ciamis",
        "Kabupaten Cianjur",
        "Kabupaten Cirebon",
        "Kabupaten Garut",
        "Kabupaten Indramayu",
        "Kabupaten Karawang",
        "Kabupaten Kuningan",
        "Kabupaten Majalengka",
        "Kabupaten Pangandaran",
        "Kabupaten Purwakarta",
        "Kabupaten Subang",
        "Kabupaten Sukabumi",
        "Kabupaten Sumedang",
        "Kabupaten Tasikmalaya",
        "Kota Bandung",
        "Kota Banjar",
        "Kota Bekasi",
        "Kota Bogor",
        "Kota Cimahi",
        "Kota Cirebon",
        "Kota Depok",
        "Kota Sukabumi",
        "Kota Tasikmalaya"
    ];

    function initSearchableDropdown(inputEl, listEl, containerEl, dataListOrFn) {
        // Dapatkan data list terbaru (apakah array atau fungsi callback)
        function getData() {
            return typeof dataListOrFn === 'function' ? dataListOrFn() : dataListOrFn;
        }

        // Render semua items
        function renderItems(filter = '') {
            listEl.innerHTML = '';
            const data = getData();
            const filtered = data.filter(item => 
                item.toLowerCase().includes(filter.toLowerCase())
            );

            if (filtered.length === 0) {
                const noResult = document.createElement('div');
                noResult.className = 'dropdown-no-results';
                noResult.textContent = 'Tidak ditemukan';
                listEl.appendChild(noResult);
                return;
            }

            filtered.forEach(item => {
                const div = document.createElement('div');
                div.className = 'dropdown-item';
                if (inputEl.value === item) {
                    div.classList.add('selected');
                }
                div.textContent = item;
                div.addEventListener('click', () => {
                    inputEl.value = item;
                    listEl.style.display = 'none';
                    containerEl.classList.remove('open');
                    
                    // Jika ini KPA, sinkronkan NIP & Jabatan secara tersembunyi
                    if (containerEl.id === 'selectKuasaAnggaranContainer') {
                        autoFillHiddenKPAPeople(item);
                    }

                    // Picu input event agar preview otomatis ter-update dan tersinkronisasi
                    inputEl.dispatchEvent(new Event('input', { bubbles: true }));
                });
                listEl.appendChild(div);
            });
        }

        // Tampilkan dropdown saat input fokus atau diklik
        inputEl.addEventListener('focus', () => {
            renderItems(inputEl.value);
            listEl.style.display = 'block';
            containerEl.classList.add('open');
        });

        // Filter items saat mengetik
        inputEl.addEventListener('input', () => {
            renderItems(inputEl.value);
            listEl.style.display = 'block';
            containerEl.classList.add('open');
        });

        // Sembunyikan dropdown jika klik di luar container
        document.addEventListener('click', (e) => {
            if (!containerEl.contains(e.target)) {
                listEl.style.display = 'none';
                containerEl.classList.remove('open');
            }
        });
    }

    // Fungsi otomatis sinkron NIP & Jabatan KPA tersembunyi
    function autoFillHiddenKPAPeople(name) {
        const employees = getSavedEmployees();
        const emp = employees.find(e => e.nama === name);
        if (emp) {
            const nipEl = document.getElementById('nipPejabatLain');
            const jabEl = document.getElementById('jabatanPejabatLain');
            if (nipEl) nipEl.value = emp.nip;
            if (jabEl) jabEl.value = emp.jabatan;
        }
    }

    // Fungsi mengambil daftar nama KPA terbaru dari LocalStorage
    function getKPANames() {
        const employees = getSavedEmployees();
        const kpaList = employees.filter(emp => {
            const roles = getEmployeeRoles(emp);
            return roles.includes('KPA');
        });
        return kpaList.map(emp => emp.nama);
    }

    // Inisialisasi Searchable Dropdown Kota/Kabupaten Jawa Barat
    const inputBerangkat = document.getElementById('tempatBerangkat');
    const inputTujuan = document.getElementById('tempatTujuan');
    const containerBerangkat = document.getElementById('selectBerangkatContainer');
    const containerTujuan = document.getElementById('selectTujuanContainer');
    const listBerangkat = containerBerangkat ? containerBerangkat.querySelector('.select-dropdown-list') : null;
    const listTujuan = containerTujuan ? containerTujuan.querySelector('.select-dropdown-list') : null;

    if (inputBerangkat && listBerangkat && containerBerangkat) {
        initSearchableDropdown(inputBerangkat, listBerangkat, containerBerangkat, jabarCities);
    }
    if (inputTujuan && listTujuan && containerTujuan) {
        initSearchableDropdown(inputTujuan, listTujuan, containerTujuan, jabarCities);
    }

    // Inisialisasi Searchable Dropdown Pejabat KPA (Pengguna Anggaran)
    const inputKPA = document.getElementById('namaPejabatLain');
    const containerKPA = document.getElementById('selectKuasaAnggaranContainer');
    const listKPA = containerKPA ? containerKPA.querySelector('.select-dropdown-list') : null;

    if (inputKPA && listKPA && containerKPA) {
        initSearchableDropdown(inputKPA, listKPA, containerKPA, getKPANames);
    }
});
