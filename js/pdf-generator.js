/**
 * SPPD PDF Generator - v15
 * Matches official Indonesian Government SPPD format
 * Paper: F4 (215x330mm) Landscape, two-column layout
 * Left: Front Page (Surat Perjalanan Dinas - 10 Items, enclosed in border)
 * Right: Back Page (Visum & Arrival/Departure Logs, enclosed in border)
 */

class SPPDPdfGenerator {
    constructor() {
        this.jsPDF = window.jspdf.jsPDF;
    }

    formatDate(dateStr) {
        if (!dateStr) return '-';
        const months = [
            'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
            'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
        ];
        const date = new Date(dateStr);
        return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
    }

    generatePDF(data) {
        // F4 paper: 215x330mm, landscape = 330w x 215h
        const doc = new this.jsPDF({
            orientation: 'l',
            unit: 'mm',
            format: [215, 330] // [width, height] in portrait, jsPDF swaps for landscape
        });
        
        const pw = 330; // landscape width
        const ph = 215; // landscape height
        const ml = 10;  // margin left
        const mr = 10;
        const mt = 8;
        const usable = pw - ml - mr; // 310mm
        
        // Split layout into 2 symmetric columns of 150mm width with a 10mm gap
        const leftW = 150;
        const gap = 10;
        const rightW = 150;
        const leftX = ml;
        const rightX = ml + leftW + gap;

        // Helpers
        const rect = (x, yPos, w, h) => {
            doc.setLineWidth(0.3);
            doc.setDrawColor(0);
            doc.rect(x, yPos, w, h);
        };

        const rectThick = (x, yPos, w, h) => {
            doc.setLineWidth(0.7);
            doc.setDrawColor(0);
            doc.rect(x, yPos, w, h);
        };

        const txt = (text, x, yPos, options = {}) => {
            const { size = 8, style = 'normal', align = 'left', maxWidth } = options;
            doc.setFont('times', style);
            doc.setFontSize(size);
            if (align === 'center') {
                doc.text(text || '', x, yPos, { align: 'center', maxWidth });
            } else if (align === 'right') {
                doc.text(text || '', x, yPos, { align: 'right', maxWidth });
            } else {
                doc.text(text || '', x, yPos, { maxWidth });
            }
        };

        // Vertically centered cell text drawing with dynamic font auto-shrink to prevent overflow
        const drawCellText = (text, x, yPos, w, options = {}) => {
            const { size = 8, style = 'normal', align = 'left', lineSpacing = 3.5, cellHeight, paddingTop } = options;
            
            let currentSize = size;
            let currentLineSpacing = lineSpacing;
            doc.setFont('times', style);
            doc.setFontSize(currentSize);
            
            let lines = doc.splitTextToSize(text || '', w - 3);
            let fontHeight = currentSize * 0.3528; // 1pt = 0.3528mm
            let totalTextHeight = (lines.length - 1) * currentLineSpacing + fontHeight;

            // Loop to scale down font size and line spacing if total text height exceeds the cell height
            if (cellHeight) {
                const maxAllowedHeight = cellHeight - 1.5; // Leave small padding (1.5mm)
                while (totalTextHeight > maxAllowedHeight && currentSize > 4) {
                    currentSize -= 0.5;
                    // Shrink line spacing proportionally
                    currentLineSpacing = currentSize * (lineSpacing / size);
                    doc.setFontSize(currentSize);
                    lines = doc.splitTextToSize(text || '', w - 3);
                    fontHeight = currentSize * 0.3528;
                    totalTextHeight = (lines.length - 1) * currentLineSpacing + fontHeight;
                }
            }

            let tx = x + 1.5;
            let textAl = 'left';
            if (align === 'center') { tx = x + w / 2; textAl = 'center'; }
            else if (align === 'right') { tx = x + w - 1.5; textAl = 'right'; }
            
            // Calculate vertical position (baseline)
            let ty;
            if (paddingTop !== undefined) {
                ty = yPos + paddingTop + fontHeight * 0.75;
            } else if (cellHeight) {
                const dynamicPaddingTop = (cellHeight - totalTextHeight) / 2;
                ty = yPos + dynamicPaddingTop + fontHeight * 0.75; // 0.75 baseline offset factor
            } else {
                ty = yPos + 2.5 + currentSize / 4; 
            }
            doc.text(lines, tx, ty, { align: textAl, lineSpacing: currentLineSpacing });
        };

        // ============================================================
        // LEFT COLUMN: FRONT PAGE (SPD DOCUMENT WITH BORDER)
        // ============================================================
        
        // Outer box border for Left Page (Front Page)
        const frameY = 8;
        const frameH = 199;
        rectThick(leftX, frameY, leftW, frameH);

        // Inner Content padding/margins inside the left frame
        const innerPad = 4;
        const innerX = leftX + innerPad; // 14mm
        const innerW = leftW - (innerPad * 2); // 142mm

        // 1. Kop Surat (Header) with Logo
        const imgEl = document.getElementById('logoJabar');
        if (imgEl) {
            try {
                // Draw logo Jabar inside frame
                doc.addImage(imgEl, 'PNG', innerX, mt + 1, 16, 18);
            } catch (e) {
                console.error("Failed to add logo image to PDF:", e);
            }
        }

        // Header text (offset to the right of the logo, centered in the remaining space)
        const headerCenterX = innerX + 18 + (innerW - 18) / 2;
        txt('PEMERINTAH DAERAH PROVINSI JAWA BARAT', headerCenterX, mt + 4, { align: 'center', style: 'bold', size: 9.5 });
        txt(data.instansi || 'BADAN PENDAPATAN DAERAH', headerCenterX, mt + 8, { align: 'center', style: 'bold', size: 9.5 });
        txt(data.unitKerja || 'PUSAT PENGELOLAAN PENDAPATAN DAERAH', headerCenterX, mt + 11.5, { align: 'center', style: 'bold', size: 8 });
        txt('WILAYAH KABUPATEN TASIKMALAYA', headerCenterX, mt + 15, { align: 'center', style: 'bold', size: 8 });
        txt(data.alamat || 'Kabupaten Tasikmalaya - 46183', headerCenterX, mt + 18.5, { align: 'center', size: 7 });

        // Double line under Kop Surat (touches the frame boundaries)
        doc.setLineWidth(0.8);
        doc.line(leftX, 29.5, leftX + leftW, 29.5);
        doc.setLineWidth(0.3);
        doc.line(leftX, 30.5, leftX + leftW, 30.5);

        // 2. Small Table (Lembar Ke, Kode No, Nomor) on the top right - Invisible border, underline style
        const smallTableY = 32;
        const lineStartX = innerX + innerW - 26; // Start right after the colon ":"
        const lineEndX = leftX + leftW;          // End at the outer right frame border (160)
        
        // Underline lines for each field
        doc.setLineWidth(0.3);
        doc.line(lineStartX, smallTableY + 3.2, lineEndX, smallTableY + 3.2); // Underline for Lembar Ke
        doc.line(lineStartX, smallTableY + 6.8, lineEndX, smallTableY + 6.8); // Underline for Kode No
        doc.line(lineStartX, smallTableY + 10.4, lineEndX, smallTableY + 10.4); // Underline for Nomor
        
        txt("Lembar Ke", innerX + innerW - 53, smallTableY + 2.3, { size: 7 });
        txt(":", innerX + innerW - 28, smallTableY + 2.3, { size: 7 });
        txt(data.lembarKe || "", innerX + innerW - 25, smallTableY + 2.3, { size: 7 });
        
        txt("Kode No", innerX + innerW - 53, smallTableY + 5.9, { size: 7 });
        txt(":", innerX + innerW - 28, smallTableY + 5.9, { size: 7 });
        txt(data.kodeNo || "", innerX + innerW - 25, smallTableY + 5.9, { size: 7 });
        
        txt("Nomor", innerX + innerW - 53, smallTableY + 9.5, { size: 7 });
        txt(":", innerX + innerW - 28, smallTableY + 9.5, { size: 7 });
        txt(data.nomorSPD || "", innerX + innerW - 25, smallTableY + 9.5, { size: 7.5, style: "bold" });

        // 3. Title: SURAT PERJALANAN DINAS (SPD)
        const titleY = 48;
        txt("SURAT PERJALANAN DINAS (SPD)", leftX + leftW/2, titleY, { align: "center", style: "bold", size: 10 });
        doc.setLineWidth(0.3);
        doc.line(leftX + 45, titleY + 1, leftX + leftW - 45, titleY + 1);

        // 4. Main Table (10 Rows) inside Left Page
        const tblY = 53;
        const tblH = 110; // Adjusted from 106 to 110 to accommodate label heights
        rect(innerX, tblY, innerW, tblH);

        // Columns vertical dividers
        // Col 1: 6mm, Col 2: 44mm, Col 3: 92mm (Total = 142mm)
        const c1 = 6;
        const c2 = 44; // Increased from 40 to 44 to prevent text overflow in labels
        const c3 = 92; // Decreased from 96 to 92
        doc.line(innerX + c1, tblY, innerX + c1, tblY + tblH);
        doc.line(innerX + c1 + c2, tblY, innerX + c1 + c2, tblY + tblH);

        // Horizontal Row heights
        // Adjusted row 4 (16), row 7 (16), row 9 (12) to match text rows and prevent overlapping borders
        const rowHeights = [8, 8, 12, 16, 6, 8, 16, 16, 12, 8];

        // Draw horizontal row dividers
        let tempY = tblY;
        for (let i = 0; i < rowHeights.length - 1; i++) {
            tempY += rowHeights[i];
            doc.line(innerX, tempY, innerX + innerW, tempY);
        }

        // Draw Row Content with Proportional Vertical Centering
        let curY = tblY;

        // -- Row 1 --
        txt("1.", innerX + 3, curY + (rowHeights[0] / 2) + 0.9, { align: "center", size: 8 });
        drawCellText("Pengguna Anggaran / Kuasa\nPengguna Anggaran", innerX + c1, curY, c2, { cellHeight: rowHeights[0] });
        drawCellText(data.namaPejabatLain || "", innerX + c1 + c2, curY, c3, { style: "bold", cellHeight: rowHeights[0] });
        curY += rowHeights[0];

        // -- Row 2 --
        txt("2.", innerX + 3, curY + (rowHeights[1] / 2) + 0.9, { align: "center", size: 8 });
        drawCellText("Nama / NIP Pegawai yang\nmelaksanakan perjalanan", innerX + c1, curY, c2, { cellHeight: rowHeights[1] });
        
        // Render Value Row 2: Nama (bold) and NIP (normal) centered vertically and safely away from top border
        const row2_y = curY + 3.1;
        txt(data.namaPegawai || '', innerX + c1 + c2 + 1.5, row2_y, { size: 8, style: 'bold' });
        txt(`NIP. ${data.nipPegawai || ''}`, innerX + c1 + c2 + 1.5, row2_y + 3.5, { size: 8, style: 'normal' });
        curY += rowHeights[1];

        // -- Row 3 --
        txt("3.", innerX + 3, curY + (rowHeights[2] / 2) + 0.9, { align: "center", size: 8 });
        drawCellText("a. Pangkat dan Golongan\nb. Jabatan\nc. Tingkat Biaya Perjalanan Dinas", innerX + c1, curY, c2, { cellHeight: rowHeights[2] });
        drawCellText(`a. ${data.pangkatGolongan || ''}\nb. ${data.jabatanPegawai || ''}\nc. ${data.tingkatBiaya || ''}`, innerX + c1 + c2, curY, c3, { cellHeight: rowHeights[2] });
        curY += rowHeights[2];

        // -- Row 4 --
        txt("4.", innerX + 3, curY + (rowHeights[3] / 2) + 0.9, { align: "center", size: 8 });
        drawCellText("Maksud Perjalanan Dinas", innerX + c1, curY, c2, { cellHeight: rowHeights[3] });
        drawCellText(data.keperluan || "", innerX + c1 + c2, curY, c3, { lineSpacing: 3.0, cellHeight: rowHeights[3] });
        curY += rowHeights[3];

        // -- Row 5 --
        txt("5.", innerX + 3, curY + (rowHeights[4] / 2) + 0.9, { align: "center", size: 8 });
        drawCellText("Alat Angkut yang dipergunakan", innerX + c1, curY, c2, { cellHeight: rowHeights[4] });
        drawCellText(data.alatAngkut || "", innerX + c1 + c2, curY, c3, { cellHeight: rowHeights[4] });
        curY += rowHeights[4];

        // -- Row 6 --
        txt("6.", innerX + 3, curY + (rowHeights[5] / 2) + 0.9, { align: "center", size: 8 });
        drawCellText("a. Tempat berangkat\nb. Tempat tujuan", innerX + c1, curY, c2, { cellHeight: rowHeights[5] });
        drawCellText(`a. ${data.tempatBerangkat || ''}\nb. ${data.tempatTujuan || ''}`, innerX + c1 + c2, curY, c3, { cellHeight: rowHeights[5] });
        curY += rowHeights[5];

        // -- Row 7 --
        txt("7.", innerX + 3, curY + (rowHeights[6] / 2) + 0.9, { align: "center", size: 8 });
        drawCellText("a. Lamanya Perjalanan Dinas\nb. Tanggal berangkat\nc. Tanggal harus kembali / \n   tiba di tempat baru *)", innerX + c1, curY, c2, { cellHeight: rowHeights[6], paddingTop: 1.5 });
        
        // Accurate strike-through positioning for the 4th line
        const spaceW = doc.getTextWidth("   ");
        const w_strike = doc.getTextWidth("tiba di tempat baru");
        const strikeX = innerX + c1 + 1.5 + spaceW;
        const strikeY = curY + 1.5 + (8 * 0.3528) * 0.75 + (3 * 3.5) - 0.8; // paddingTop + baselineOffset + (3 * lineSpacing) - visualCenterOffset
        doc.setLineWidth(0.3);
        doc.line(strikeX, strikeY, strikeX + w_strike, strikeY);

        drawCellText(`a. ${data.lamaPerjalanan || ''}\nb. ${this.formatDate(data.tanggalBerangkat)}\nc. ${this.formatDate(data.tanggalKembali)}`, innerX + c1 + c2, curY, c3, { cellHeight: rowHeights[6] });
        curY += rowHeights[6];

        // -- Row 8 --
        txt("8.", innerX + 3, curY + (rowHeights[7] / 2) + 0.9, { align: "center", size: 8 });
        
        // Column 2 labels: Header and list numbers
        txt("Pengikut : Nama", innerX + c1 + 1.5, curY + 3.0, { size: 7.5 });
        txt("1.", innerX + c1 + 3.5, curY + 7.0, { size: 7.5 });
        txt("2.", innerX + c1 + 3.5, curY + 11.0, { size: 7.5 });
        txt("3.", innerX + c1 + 3.5, curY + 15.0, { size: 7.5 });
        
        // Inner Table vertical lines inside Column 3 (No horizontal lines inside)
        const col3X = innerX + c1 + c2;
        // Width distribution: 44mm (Nama), 24mm (Tanggal Lahir), 24mm (Keterangan)
        doc.line(col3X + 44, curY, col3X + 44, curY + rowHeights[7]);
        doc.line(col3X + 44 + 24, curY, col3X + 44 + 24, curY + rowHeights[7]);
        
        // Inner Table Text & Values
        txt("Tanggal Lahir", col3X + 44 + 12, curY + 3.0, { align: "center", size: 7.5 });
        txt("Keterangan", col3X + 44 + 24 + 12, curY + 3.0, { align: "center", size: 7.5 });
        
        // Render follower names in the first sub-column of Column 3
        txt(data.pengikut1 || '', col3X + 1.5, curY + 7.0, { size: 7.5 });
        txt(data.pengikut2 || '', col3X + 1.5, curY + 11.0, { size: 7.5 });
        txt(data.pengikut3 || '', col3X + 1.5, curY + 15.0, { size: 7.5 });
        curY += rowHeights[7];

        // -- Row 9 --
        txt("9.", innerX + 3, curY + (rowHeights[8] / 2) + 0.9, { align: "center", size: 8 });
        drawCellText("Pembebanan Anggaran\na. Instansi\nb. Akun", innerX + c1, curY, c2, { cellHeight: rowHeights[8] });
        drawCellText(`\na. ${data.instansiAnggaran || ''}\nb. ${data.akunAnggaran || ''}`, innerX + c1 + c2, curY, c3, { cellHeight: rowHeights[8] });
        curY += rowHeights[8];

        // -- Row 10 --
        txt("10.", innerX + 3, curY + (rowHeights[9] / 2) + 0.9, { align: "center", size: 8 });
        drawCellText("Keterangan Lain-lain", innerX + c1, curY, c2, { cellHeight: rowHeights[9] });
        drawCellText(data.keteranganLain || "", innerX + c1 + c2, curY, c3, { cellHeight: rowHeights[9] });
        curY += rowHeights[9];

        // 5. Footer Note
        txt('*) coret tidak perlu', innerX, 165.5, { size: 7, style: 'italic' });

        // 6. Signatures Halaman Depan
        const sigY = 169;
        const sigX = innerX + innerW - 60;
        txt(`Dikeluarkan di :  ${data.dikeluarkanDi || ''}`, sigX, sigY, { size: 8 });
        txt(`Tanggal          :  ${this.formatDate(data.tanggalDikeluarkan)}`, sigX, sigY + 4, { size: 8 });
        txt(data.jabatanTtd || 'KUASA PENGGUNA ANGGARAN,', sigX, sigY + 9, { size: 8, style: 'bold' });
        
        // Name with bold & underline
        txt(data.namaTtd || '', sigX, sigY + 28, { size: 8, style: 'bold' });
        const frontNameW = doc.getTextWidth(data.namaTtd || '');
        doc.setLineWidth(0.3);
        doc.line(sigX, sigY + 28.8, sigX + frontNameW, sigY + 28.8); // Underline name
        
        txt(`NIP. ${data.nipTtd || ''}`, sigX, sigY + 32, { size: 8 });


        // ============================================================
        // RIGHT COLUMN: BACK PAGE (VISUM & ARRIVAL/DEPARTURE LOGS)
        // ============================================================
        
        // Outer box border
        const visumY = 8;
        const visumH = 199;
        rectThick(rightX, visumY, rightW, visumH);

        // Section horizontal borders
        doc.line(rightX, 36, rightX + rightW, 36);
        doc.line(rightX, 72, rightX + rightW, 72);
        doc.line(rightX, 100, rightX + rightW, 100);
        doc.line(rightX, 128, rightX + rightW, 128);
        doc.line(rightX, 176, rightX + rightW, 176);

        // Middle vertical divider (Only goes down to Section IV, leaving Section V full width)
        const midX = rightX + rightW / 2;
        doc.line(midX, visumY, midX, 128);

        // --- SECTION I ---
        txt("I.", rightX + 2, visumY + 4, { style: "bold", size: 8 });
        txt("Berangkat dari", midX + 2, visumY + 4, { size: 7.5 });
        txt(":", midX + 22, visumY + 4, { size: 7.5 });
        txt(data.berangkatDari1 || '', midX + 24, visumY + 4, { size: 7.5 });
        txt("(Tempat Kedudukan)", midX + 2, visumY + 7.5, { size: 6.5, style: "italic" });
        
        txt("Ke", midX + 2, visumY + 12, { size: 7.5 });
        txt(":", midX + 22, visumY + 12, { size: 7.5 });
        txt(data.ke1 || '', midX + 24, visumY + 12, { size: 7.5 });
        
        txt("Pada tanggal", midX + 2, visumY + 16, { size: 7.5 });
        txt(":", midX + 22, visumY + 16, { size: 7.5 });
        txt(this.formatDate(data.tanggal1), midX + 24, visumY + 16, { size: 7.5 });

        // --- SECTION II ---
        // Left - Arrival Stamp
        txt("II. Tiba di", rightX + 2, 40, { size: 7.5, style: "bold" });
        txt(":", rightX + 22, 40, { size: 7.5 });
        txt(data.ke1 || '', rightX + 24, 40, { size: 7.5 });
        
        txt("    Pada tanggal", rightX + 2, 44, { size: 7.5 });
        txt(":", rightX + 22, 44, { size: 7.5 });
        txt(this.formatDate(data.tanggal1), rightX + 24, 44, { size: 7.5 });

        // Right - Departure Stamp
        txt("Berangkat dari", midX + 2, 40, { size: 7.5 });
        txt(":", midX + 22, 40, { size: 7.5 });
        txt(data.berangkatDari2 || '', midX + 24, 40, { size: 7.5 });
        
        txt("Ke", midX + 2, 44, { size: 7.5 });
        txt(":", midX + 22, 44, { size: 7.5 });
        txt(data.ke2 || '', midX + 24, 44, { size: 7.5 });
        
        txt("Pada tanggal", midX + 2, 48, { size: 7.5 });
        txt(":", midX + 22, 48, { size: 7.5 });
        txt(this.formatDate(data.tanggal2), midX + 24, 48, { size: 7.5 });

        // --- SECTION III ---
        // Left
        txt("III. Tiba di", rightX + 2, 76, { size: 7.5 });
        txt(":", rightX + 22, 76, { size: 7.5 });
        txt(data.ke3 || '............................', rightX + 24, 76, { size: 7.5 });
        
        txt("    Pada tanggal", rightX + 2, 80, { size: 7.5 });
        txt(":", rightX + 22, 80, { size: 7.5 });
        txt(data.tanggal3 ? this.formatDate(data.tanggal3) : '............................', rightX + 24, 80, { size: 7.5 });
        
        // Right
        txt("Berangkat dari", midX + 2, 76, { size: 7.5 });
        txt(":", midX + 22, 76, { size: 7.5 });
        txt(data.berangkatDari3 || '............................', midX + 24, 76, { size: 7.5 });
        
        txt("Ke", midX + 2, 80, { size: 7.5 });
        txt(":", midX + 22, 80, { size: 7.5 });
        txt(data.ke3 || '............................', midX + 24, 80, { size: 7.5 });
        
        txt("Pada tanggal", midX + 2, 84, { size: 7.5 });
        txt(":", midX + 22, 84, { size: 7.5 });
        txt(data.tanggal3 ? this.formatDate(data.tanggal3) : '............................', midX + 24, 84, { size: 7.5 });

        // --- SECTION IV ---
        // Left
        txt("IV. Tiba di", rightX + 2, 104, { size: 7.5 });
        txt(":", rightX + 22, 104, { size: 7.5 });
        txt(data.ke4 || '............................', rightX + 24, 104, { size: 7.5 });
        
        txt("    Pada tanggal", rightX + 2, 108, { size: 7.5 });
        txt(":", rightX + 22, 108, { size: 7.5 });
        txt(data.tanggal4 ? this.formatDate(data.tanggal4) : '............................', rightX + 24, 108, { size: 7.5 });
        
        // Right
        txt("Berangkat dari", midX + 2, 104, { size: 7.5 });
        txt(":", midX + 22, 104, { size: 7.5 });
        txt(data.berangkatDari4 || '............................', midX + 24, 104, { size: 7.5 });
        
        txt("Ke", midX + 2, 108, { size: 7.5 });
        txt(":", midX + 22, 108, { size: 7.5 });
        txt(data.ke4 || '............................', midX + 24, 108, { size: 7.5 });
        
        txt("Pada tanggal", midX + 2, 112, { size: 7.5 });
        txt(":", midX + 22, 112, { size: 7.5 });
        txt(data.tanggal4 ? this.formatDate(data.tanggal4) : '............................', midX + 24, 112, { size: 7.5 });

        // --- SECTION V (Tiba Kembali / Verification Box - Full Width, Centered Signature) ---
        txt("V. Tiba kembali di", rightX + 2, 132, { size: 7, style: "bold" });
        txt(":", rightX + 26, 132, { size: 7 });
        txt(data.berangkatDari1 || 'Kabupaten Tasikmalaya', rightX + 28, 132, { size: 7 });
        
        txt("    Pada tanggal", rightX + 2, 136, { size: 7 });
        txt(":", rightX + 26, 136, { size: 7 });
        txt(this.formatDate(data.tanggalKembali), rightX + 28, 136, { size: 7 });
        
        const linesV = doc.splitTextToSize("Telah diperiksa dengan keterangan bahwa perjalanan tersebut atas perintahnya dan semata-mata untuk kepentingan jabatan dalam waktu yang sesingkat-singkatnya", 146);
        doc.text(linesV, rightX + 2, 142, { lineSpacing: 2.8 });

        // Centered Signature horizontal position (midX = rightX + rightW/2)
        txt(data.jabatanTtd || 'KUASA PENGGUNA ANGGARAN,', midX, 152, { align: "center", size: 7.5, style: "bold" });
        
        // Ecep name with bold & underline centered
        txt(data.namaTtd || '', midX, 169, { align: "center", size: 7.5, style: "bold" });
        const name5_r = doc.getTextWidth(data.namaTtd || '');
        doc.line(midX - name5_r/2, 169.8, midX + name5_r/2, 169.8);
        
        txt(`NIP. ${data.nipTtd || ''}`, midX, 173, { align: "center", size: 7.5 });

        // --- SECTION VI (Perhatian) ---
        txt("VI. PERHATIAN", rightX + 2, 181, { style: "bold", size: 8 });
        const linesVI = doc.splitTextToSize("PA/KPA yang menerbitkan SPD, pegawai yang melakukan perjalanan dinas, para pejabat yang mengesahkan tanggal berangkat/tiba, serta bendahara pengeluaran bertanggung jawab berdasarkan peraturan-peraturan Keuangan Negara apabila Negara menderita rugi akibat kesalahan, kelalaian, dan kealpaannya.", 146);
        doc.text(linesVI, rightX + 2, 185, { lineSpacing: 2.8 });

        return doc;
    }

    downloadPDF(data, filename = 'SPPD.pdf') {
        const doc = this.generatePDF(data);
        doc.save(filename);
    }

    getPDFBlobURL(data) {
        const doc = this.generatePDF(data);
        const blob = doc.output('blob');
        return URL.createObjectURL(blob);
    }

    getPDFDataURL(data) {
        const doc = this.generatePDF(data);
        return doc.output('dataurlstring');
    }
}

window.SPPDPdfGenerator = SPPDPdfGenerator;
