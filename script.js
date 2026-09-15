// =========================================================
// บังคับเด้งออกจาก LINE ไป Safari / Chrome อัตโนมัติทันที
// =========================================================
if (navigator.userAgent.includes("Line") && !window.location.search.includes("openExternalBrowser=1")) {
    const currentUrl = window.location.href;
    const separator = currentUrl.includes("?") ? "&" : "?";
    window.location.href = currentUrl + separator + "openExternalBrowser=1";
}

let currentMode = 'general';

const templateConfig = {
    'oc': { main: '#035c36', bg: '#d1dfd7', logo: 'img/OC03.png' },
    'ws': { main: '#17325c', bg: '#d1d7e0', logo: 'img/WS03.png' }, 
    'pl': { main: '#562821', bg: '#e0d6d1', logo: 'img/PL03.png' }, 
    'rh': { main: '#3b1c4a', bg: '#dcd1e0', logo: 'img/RH03.png' }  
};

let stateGeneral = [];
let stateBefore = [];
let stateAfter = [];
let currentTemplate = 'oc'; 
let layoutTwoImages = 'horizontal'; 

// =========================================================
// ฉีด HTML สร้างหน้าต่าง Crop Modal แบบปลอดภัย
// =========================================================
if (!document.getElementById('scc-crop-modal')) {
    const cropModalHTML = `
    <div id="scc-crop-modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 99999; background: #000; flex-direction: column; align-items: center; justify-content: center; padding: 15px; box-sizing: border-box; touch-action: none;">
        
        <div style="display: flex; justify-content: space-between; width: 100%; max-width: 500px; margin-bottom: 20px; align-items: center;">
            <h3 style="color: white; margin: 0; font-size: 16px; font-weight: normal;">ใช้นิ้วลากเพื่อจัดตำแหน่งภาพ</h3>
            <button id="scc-crop-close" style="background: #16a34a; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; font-size: 16px; cursor: pointer;">เสร็จสิ้น</button>
        </div>
        
        <div id="scc-crop-frame" style="background-color: #111; overflow: hidden; position: relative; display: flex; justify-content: center; align-items: center; box-shadow: 0 0 0 2px rgba(255,255,255,1); touch-action: none; cursor: grab;">
            <img id="scc-crop-img" style="position: absolute; pointer-events: none; transform-origin: center;" draggable="false" />
            <div style="position: absolute; top: 33.33%; left: 0; width: 100%; height: 1px; background: rgba(255,255,255,0.4); pointer-events: none;"></div>
            <div style="position: absolute; top: 66.66%; left: 0; width: 100%; height: 1px; background: rgba(255,255,255,0.4); pointer-events: none;"></div>
            <div style="position: absolute; left: 33.33%; top: 0; height: 100%; width: 1px; background: rgba(255,255,255,0.4); pointer-events: none;"></div>
            <div style="position: absolute; left: 66.66%; top: 0; height: 100%; width: 1px; background: rgba(255,255,255,0.4); pointer-events: none;"></div>
        </div>

        <div style="display: flex; gap: 20px; margin-top: 30px; width: 100%; max-width: 500px; justify-content: center;">
            <button id="scc-zoom-out" style="background: #333; color: white; border: none; padding: 15px 40px; border-radius: 12px; font-size: 24px; cursor: pointer;">➖</button>
            <button id="scc-zoom-in" style="background: #333; color: white; border: none; padding: 15px 40px; border-radius: 12px; font-size: 24px; cursor: pointer;">➕</button>
        </div>
    </div>
    `;
    document.body.insertAdjacentHTML('beforeend', cropModalHTML);
}

// =========================================================
// สมการคำนวณตำแหน่งภาพ
// =========================================================
function applyImageTransform(img, frame, item) {
    if (!img || !img.naturalWidth || !frame || !frame.offsetWidth) return;
    
    const frameW = frame.offsetWidth;
    const frameH = frame.offsetHeight;
    const imgRatio = img.naturalWidth / img.naturalHeight;
    const frameRatio = frameW / frameH;

    let baseW, baseH;
    if (imgRatio > frameRatio) {
        baseH = frameH;
        baseW = frameH * imgRatio;
    } else {
        baseW = frameW;
        baseH = frameW / imgRatio;
    }

    img.style.width = baseW + 'px';
    img.style.height = baseH + 'px';

    const maxPanPctX = Math.max(0, 50 * (1 - frameW / (baseW * item.zoom)));
    const maxPanPctY = Math.max(0, 50 * (1 - frameH / (baseH * item.zoom)));

    item.panX = Math.max(-maxPanPctX, Math.min(maxPanPctX, item.panX));
    item.panY = Math.max(-maxPanPctY, Math.min(maxPanPctY, item.panY));

    img.style.transform = `scale(${item.zoom}) translate(${item.panX}%, ${item.panY}%)`;
}

// =========================================================
// ระบบสร้างช่องรูปภาพ (คลิกเพื่อครอป)
// =========================================================
function createImgSlot(item, index, stateArray, renderCallback, isGeneral = false, count = 0) {
    const div = document.createElement('div');
    div.className = 'img-slot';
    div.style.cursor = 'pointer'; 
    div.style.position = 'relative';
    div.style.overflow = 'hidden';
    div.style.display = 'flex';
    div.style.justifyContent = 'center';
    div.style.alignItems = 'center';
    div.style.backgroundColor = '#ddd';
    div.style.touchAction = 'none'; 
    
    if (isGeneral) {
        if (count === 3 && index === 0) div.style.gridColumn = '1 / span 2';
        else if (count === 5) div.style.gridColumn = index < 2 ? 'span 3' : 'span 2';
        else if (count === 7) div.style.gridColumn = index < 4 ? 'span 3' : 'span 2';
    }

    if (item.panX === undefined) { item.panX = 0; item.panY = 0; item.zoom = 1; }

    const img = document.createElement('img');
    img.src = item.url;
    img.style.position = 'absolute';
    img.style.pointerEvents = 'none'; 
    
    img.onload = () => applyImageTransform(img, div, item);
    setTimeout(() => applyImageTransform(img, div, item), 50);

    div.addEventListener('click', () => openCropModal(item, div, img));

    const delBtn = document.createElement('button');
    delBtn.className = 'delete-slot-btn';
    delBtn.innerHTML = '×';
    delBtn.style.zIndex = '10';
    delBtn.onclick = (e) => {
        e.stopPropagation(); 
        stateArray.splice(index, 1);
        renderCallback();
    };

    div.appendChild(img);
    div.appendChild(delBtn);
    return div;
}

// ------------------------------------------------
// ฟังก์ชันอัปเดตรายชื่อไฟล์
// ------------------------------------------------
function updateFileListUI(containerId, stateArray, renderCallback) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    
    stateArray.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'file-item';
        
        const nameSpan = document.createElement('span');
        nameSpan.className = 'file-name';
        nameSpan.textContent = `${index + 1}. ${item.name}`;
        nameSpan.style.cursor = 'pointer';
        nameSpan.style.textDecoration = 'underline';
        nameSpan.style.color = '#035c36';
        
        nameSpan.addEventListener('click', () => {
            let gridSlots;
            if (stateArray === stateGeneral) gridSlots = document.querySelectorAll('#report-content .img-slot');
            else if (stateArray === stateBefore) gridSlots = document.querySelectorAll('#grid-before .img-slot');
            else if (stateArray === stateAfter) gridSlots = document.querySelectorAll('#grid-after .img-slot');
            
            const targetSlot = gridSlots[index];
            if (targetSlot) openCropModal(item, targetSlot, targetSlot.querySelector('img'));
        });
        
        const actionDiv = document.createElement('div');
        actionDiv.style.display = 'flex';
        actionDiv.style.gap = '8px';
        actionDiv.style.alignItems = 'center';

        if (index > 0) {
            const upBtn = document.createElement('span');
            upBtn.className = 'move-file-btn';
            upBtn.innerHTML = '▲'; 
            upBtn.onclick = () => { [stateArray[index - 1], stateArray[index]] = [stateArray[index], stateArray[index - 1]]; renderCallback(); };
            actionDiv.appendChild(upBtn);
        }
        if (index < stateArray.length - 1) {
            const downBtn = document.createElement('span');
            downBtn.className = 'move-file-btn';
            downBtn.innerHTML = '▼'; 
            downBtn.onclick = () => { [stateArray[index + 1], stateArray[index]] = [stateArray[index], stateArray[index + 1]]; renderCallback(); };
            actionDiv.appendChild(downBtn);
        }
        
        const delBtn = document.createElement('span');
        delBtn.className = 'delete-file-btn';
        delBtn.textContent = 'ลบ';
        delBtn.onclick = () => { stateArray.splice(index, 1); renderCallback(); };
        
        actionDiv.appendChild(delBtn);
        div.appendChild(nameSpan);
        div.appendChild(actionDiv);
        container.appendChild(div);
    });
}

// =========================================================
// ระบบลากภาพบน Modal (รองรับมือถือแบบ 100%)
// =========================================================
let activeCropItem = null, activePreviewImg = null, activePreviewSlot = null;
let modal, modalFrame, modalImg;
let dragData = { isDragging: false, startX: 0, startY: 0, initialPanX: 0, initialPanY: 0 };

function openCropModal(item, slotElement, previewImg) {
    modal = document.getElementById('scc-crop-modal');
    modalFrame = document.getElementById('scc-crop-frame');
    modalImg = document.getElementById('scc-crop-img');

    activeCropItem = item;
    activePreviewSlot = slotElement;
    activePreviewImg = previewImg;
    
    let slotW = slotElement.offsetWidth || 300;
    let slotH = slotElement.offsetHeight || 200;
    const slotRatio = slotW / slotH;
    const maxW = window.innerWidth * 0.9;
    const maxH = window.innerHeight * 0.6;
    
    let frameW = maxW, frameH = frameW / slotRatio;
    if (frameH > maxH) { frameH = maxH; frameW = frameH * slotRatio; }
    
    modalFrame.style.width = `${frameW}px`;
    modalFrame.style.height = `${frameH}px`;
    modalImg.src = item.url;
    
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden'; 
    document.body.style.touchAction = 'none'; 
    
    if (modalImg.complete) applyImageTransform(modalImg, modalFrame, activeCropItem);
    else modalImg.onload = () => applyImageTransform(modalImg, modalFrame, activeCropItem);
}

function startDrag(x, y) {
    if (!activeCropItem) return;
    dragData.isDragging = true;
    dragData.startX = x;
    dragData.startY = y;
    dragData.initialPanX = activeCropItem.panX;
    dragData.initialPanY = activeCropItem.panY;
}

function onDrag(x, y) {
    if (!dragData.isDragging || !activeCropItem) return;
    const diffX = x - dragData.startX;
    const diffY = y - dragData.startY;

    const frameW = modalFrame.offsetWidth, frameH = modalFrame.offsetHeight;
    const imgRatio = modalImg.naturalWidth / modalImg.naturalHeight;
    const frameRatio = frameW / frameH;
    
    let baseW = frameW, baseH = frameH;
    if (imgRatio > frameRatio) baseW = frameH * imgRatio;
    else baseH = frameW / imgRatio;

    activeCropItem.panX = dragData.initialPanX + ((diffX / (baseW * activeCropItem.zoom)) * 100);
    activeCropItem.panY = dragData.initialPanY + ((diffY / (baseH * activeCropItem.zoom)) * 100);

    applyImageTransform(modalImg, modalFrame, activeCropItem);
    if (activePreviewImg && activePreviewSlot) applyImageTransform(activePreviewImg, activePreviewSlot, activeCropItem);
}

function stopDrag() { dragData.isDragging = false; }
function handleZoom(direction) {
    if(!activeCropItem) return;
    activeCropItem.zoom = Math.max(1, Math.min(5, activeCropItem.zoom + (direction * 0.15)));
    applyImageTransform(modalImg, modalFrame, activeCropItem);
    if (activePreviewImg && activePreviewSlot) applyImageTransform(activePreviewImg, activePreviewSlot, activeCropItem);
}

// ------------------------------------------------
// ฟังก์ชัน Render หลัก
// ------------------------------------------------
function renderGeneral() {
    const reportContent = document.getElementById('report-content');
    if(!reportContent) return;
    reportContent.innerHTML = '';
    reportContent.style.padding = '16px 32px';
    reportContent.style.display = 'grid';
    reportContent.style.flexDirection = 'unset';
    reportContent.style.backgroundColor = templateConfig[currentTemplate].bg;

    const count = stateGeneral.length;
    const layoutToggle = document.getElementById('layout-toggle-2img');
    if (layoutToggle) {
        if (count > 0 && count % 2 === 0) layoutToggle.classList.remove('hidden');
        else layoutToggle.classList.add('hidden');
    }

    if (count === 0) { updateFileListUI('file-list-general', stateGeneral, renderGeneral); return; }
    
    if (count === 1) { reportContent.style.gridTemplateColumns = '1fr'; reportContent.style.gridTemplateRows = '1fr'; } 
    else if (count % 2 === 0) {
        const half = count / 2;
        if (layoutTwoImages === 'vertical') {
            reportContent.style.gridTemplateColumns = `repeat(${Math.min(2, half)}, 1fr)`; 
            reportContent.style.gridTemplateRows = `repeat(${Math.max(2, half)}, 1fr)`; 
        } else {
            reportContent.style.gridTemplateColumns = `repeat(${Math.max(2, half)}, 1fr)`; 
            reportContent.style.gridTemplateRows = `repeat(${Math.min(2, half)}, 1fr)`; 
        }
    } 
    else if (count === 3) { reportContent.style.gridTemplateColumns = '1fr 1fr'; reportContent.style.gridTemplateRows = '1fr 1fr'; } 
    else if (count === 5) { reportContent.style.gridTemplateColumns = 'repeat(6, 1fr)'; reportContent.style.gridTemplateRows = '1fr 1fr'; } 
    else if (count === 7) { reportContent.style.gridTemplateColumns = 'repeat(6, 1fr)'; reportContent.style.gridTemplateRows = 'repeat(3, 1fr)'; } 
    else {
        const cols = Math.ceil(Math.sqrt(count));
        const rows = Math.ceil(count / cols);
        reportContent.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
        reportContent.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
    }
    
    stateGeneral.forEach((item, index) => {
        reportContent.appendChild(createImgSlot(item, index, stateGeneral, renderGeneral, true, count));
    });

    updateFileListUI('file-list-general', stateGeneral, renderGeneral);
}

function renderBA() {
    const gridBefore = document.getElementById('grid-before');
    const gridAfter = document.getElementById('grid-after');
    if (!gridBefore || !gridAfter) return;

    const renderGrid = (grid, stateArray, listId) => {
        grid.innerHTML = '';
        grid.style.gridTemplateColumns = `repeat(${Math.max(1, stateArray.length)}, 1fr)`;
        stateArray.forEach((item, index) => {
            grid.appendChild(createImgSlot(item, index, stateArray, renderBA));
        });
        updateFileListUI(listId, stateArray, renderBA);
    };

    renderGrid(gridBefore, stateBefore, 'file-list-before');
    renderGrid(gridAfter, stateAfter, 'file-list-after');
}

// =========================================================
// 5. ระบบบีบอัดรูปภาพให้เหลือไม่เกิน ~500KB (Image Compression)
// =========================================================
function compressImageAsync(file, maxSizeKB = 500) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // ลดขนาดพิกเซลลงให้เหมาะกับเป้าหมาย 500KB
                const MAX_DIMENSION = 1200; // ปรับลดขนาดความละเอียดลงเพื่อช่วยลดขนาดไฟล์
                if (width > height && width > MAX_DIMENSION) {
                    height *= MAX_DIMENSION / width;
                    width = MAX_DIMENSION;
                } else if (height > MAX_DIMENSION) {
                    width *= MAX_DIMENSION / height;
                    height = MAX_DIMENSION;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // เริ่มต้นคุณภาพที่ 0.8
                let quality = 0.8; 
                let dataUrl = canvas.toDataURL('image/jpeg', quality);

                // ลด quality ลงเรื่อยๆ จนกว่าจะได้ขนาดที่ต้องการ
                while (Math.round((dataUrl.length * 0.75) / 1024) > maxSizeKB && quality > 0.2) { // ปรับ quality ต่ำสุดเป็น 0.2
                    quality -= 0.1;
                    dataUrl = canvas.toDataURL('image/jpeg', quality);
                }
                
                resolve(dataUrl);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

// โหลดไฟล์และรอให้บีบอัดเสร็จทีละรูป
async function handleFileUpload(files, stateArray, renderCallback) {
    if (files.length === 0) return;
    
    // เปลี่ยนข้อความเพื่อบอกผู้ใช้ว่ากำลังประมวลผล
    const originalText = document.getElementById('btn-export').textContent;
    document.getElementById('btn-export').textContent = "กำลังโหลดและบีบอัดรูปภาพ...";
    document.getElementById('btn-export').disabled = true;

    for (let file of Array.from(files)) {
        const compressedDataUrl = await compressImageAsync(file, 500); // เรียกใช้งานพร้อมระบุเป้าหมาย 500KB
        stateArray.push({
            name: file.name,
            url: compressedDataUrl,
            panX: 0,
            panY: 0,
            zoom: 1
        });
    }
    
    renderCallback();
    
    // คืนค่าปุ่ม
    document.getElementById('btn-export').textContent = originalText;
    document.getElementById('btn-export').disabled = false;
}

// =========================================================
// 6. ผูก Event ต่างๆ หลังจากหน้าเว็บโหลดเสร็จ
// =========================================================
window.addEventListener('DOMContentLoaded', () => {
    
    modal = document.getElementById('scc-crop-modal');
    modalFrame = document.getElementById('scc-crop-frame');
    modalImg = document.getElementById('scc-crop-img');

    // ผูก Event หน้าต่างครอป
    document.getElementById('scc-crop-close').addEventListener('click', () => {
        modal.style.display = 'none';
        document.body.style.overflow = ''; 
        document.body.style.touchAction = ''; 
        activeCropItem = null;
        activePreviewImg = null;
        activePreviewSlot = null;
    });

    document.getElementById('scc-zoom-in').addEventListener('click', () => handleZoom(1));
    document.getElementById('scc-zoom-out').addEventListener('click', () => handleZoom(-1));

    if (modalFrame) {
        modalFrame.addEventListener('touchstart', (e) => { e.preventDefault(); startDrag(e.touches[0].clientX, e.touches[0].clientY); }, { passive: false });
        modalFrame.addEventListener('touchmove', (e) => { e.preventDefault(); onDrag(e.touches[0].clientX, e.touches[0].clientY); }, { passive: false });
        modalFrame.addEventListener('touchend', stopDrag);
        modalFrame.addEventListener('touchcancel', stopDrag);

        modalFrame.addEventListener('mousedown', (e) => { e.preventDefault(); startDrag(e.clientX, e.clientY); });
        window.addEventListener('mousemove', (e) => { if (dragData.isDragging) onDrag(e.clientX, e.clientY); });
        window.addEventListener('mouseup', stopDrag);
        modalFrame.addEventListener('wheel', (e) => { e.preventDefault(); handleZoom(Math.sign(e.deltaY) * -1); }, { passive: false });
    }

    // โหลดวันที่
    const dateInput = document.getElementById('input-date');
    if(dateInput) {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        dateInput.value = `${yyyy}-${mm}-${dd}`;
        dateInput.dispatchEvent(new Event('input')); 
    }

    // ระบบเมนูและอัปโหลดรูปภาพ
    const tabGeneral = document.getElementById('tab-general'), tabBA = document.getElementById('tab-ba');
    const uploadGeneral = document.getElementById('upload-section-general'), uploadBA = document.getElementById('upload-section-ba');
    const reportContent = document.getElementById('report-content');

    if (tabGeneral) tabGeneral.addEventListener('click', () => {
        currentMode = 'general';
        tabGeneral.classList.add('active'); tabBA.classList.remove('active');
        uploadGeneral.classList.remove('hidden'); uploadBA.classList.add('hidden');
        renderGeneral(); 
    });

    if (tabBA) tabBA.addEventListener('click', () => {
        currentMode = 'ba';
        tabBA.classList.add('active'); tabGeneral.classList.remove('active');
        uploadBA.classList.remove('hidden'); uploadGeneral.classList.add('hidden');
        if(reportContent) {
            reportContent.style.padding = '0'; reportContent.style.display = 'flex';
            reportContent.style.flexDirection = 'column'; reportContent.style.backgroundColor = 'transparent';
            reportContent.innerHTML = `<div class="section-before"><div class="badge-ba badge-before">BEFORE</div><div id="grid-before" style="flex: 1; display: grid; gap: 10px;"></div></div><div class="section-after"><div class="badge-ba badge-after">AFTER</div><div id="grid-after" style="flex: 1; display: grid; gap: 10px;"></div></div>`;
        }
        renderBA(); 
    });

    const inputGen = document.getElementById('input-images-general');
    if(inputGen) inputGen.addEventListener('change', function(e) { handleFileUpload(e.target.files, stateGeneral, renderGeneral); e.target.value = ''; });

    const inputBf = document.getElementById('input-images-before');
    if(inputBf) inputBf.addEventListener('change', function(e) { handleFileUpload(e.target.files, stateBefore, renderBA); e.target.value = ''; });

    const inputAf = document.getElementById('input-images-after');
    if(inputAf) inputAf.addEventListener('change', function(e) { handleFileUpload(e.target.files, stateAfter, renderBA); e.target.value = ''; });

    // ระบบข้อความ
    function setupTextBinding(inputId, previewId) {
        const el = document.getElementById(inputId);
        if (el) el.addEventListener('input', (event) => {
            const prev = document.getElementById(previewId);
            if(prev) prev.textContent = event.target.value || '\u00A0';
        });
    }
    setupTextBinding('input-date', 'prev-date'); 
    setupTextBinding('input-dept', 'prev-dept');
    setupTextBinding('input-title', 'prev-title');

    const btnAlignLeft = document.getElementById('btn-align-left'), btnAlignCenter = document.getElementById('btn-align-center'), prevTitleBox = document.getElementById('prev-title');
    if (btnAlignLeft && btnAlignCenter && prevTitleBox) {
        btnAlignLeft.addEventListener('click', () => { btnAlignLeft.classList.add('active'); btnAlignCenter.classList.remove('active'); prevTitleBox.style.textAlign = 'left'; });
        btnAlignCenter.addEventListener('click', () => { btnAlignCenter.classList.add('active'); btnAlignLeft.classList.remove('active'); prevTitleBox.style.textAlign = 'center'; });
    }

    document.querySelectorAll('.tpl-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.tpl-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentTemplate = this.getAttribute('data-tpl');
            const tplData = templateConfig[currentTemplate];
            const canvas = document.getElementById('report-canvas');
            const logo = document.getElementById('course-logo');
            if(canvas) canvas.style.backgroundColor = tplData.main;
            if(logo) logo.src = tplData.logo;
            if (currentMode === 'general') renderGeneral();
        });
    });

    const btnLayoutH = document.getElementById('btn-layout-h'), btnLayoutV = document.getElementById('btn-layout-v');
    if (btnLayoutH && btnLayoutV) {
        btnLayoutH.addEventListener('click', () => { layoutTwoImages = 'horizontal'; btnLayoutH.classList.add('active'); btnLayoutV.classList.remove('active'); if (currentMode === 'general') renderGeneral(); });
        btnLayoutV.addEventListener('click', () => { layoutTwoImages = 'vertical'; btnLayoutV.classList.add('active'); btnLayoutH.classList.remove('active'); if (currentMode === 'general') renderGeneral(); });
    }

    // =========================================================
    // 7. ระบบ Export รูปภาพ (แก้ไขปัญหา Android)
    // =========================================================
    const btnExport = document.getElementById('btn-export');
    if (btnExport) {
        btnExport.addEventListener('click', function() {
            const originalCanvas = document.getElementById('report-canvas');
            if(!originalCanvas) return;
            const originalText = this.textContent;
            this.textContent = "กำลังประมวลผลรูปภาพ...";
            this.disabled = true;

            const clonedElement = originalCanvas.cloneNode(true);
            clonedElement.querySelectorAll('.delete-slot-btn').forEach(btn => btn.remove());

            const hiddenWrapper = document.createElement('div');
            hiddenWrapper.style.cssText = 'position: absolute; top: -9999px; left: -9999px; width: 1076px; height: 1521px;';
            hiddenWrapper.appendChild(clonedElement);
            document.body.appendChild(hiddenWrapper);

            // เช็กว่าเป็นมือถือ (รวม Android และ iOS) เพื่อใช้เมนูแชร์ของระบบ
            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
            const isLine = navigator.userAgent.includes("Line"); 
            const exportScale = isMobile ? 1.5 : 2; 

            html2canvas(clonedElement, { scale: exportScale, useCORS: true, backgroundColor: "#ffffff", logging: false }).then(canvas => {
                if (isLine) {
                    document.getElementById('mobile-preview-img').src = canvas.toDataURL('image/jpeg', 1.0);
                    document.getElementById('mobile-modal').classList.remove('hidden');
                    document.body.removeChild(hiddenWrapper);
                    this.textContent = originalText; this.disabled = false; return; 
                }

                // แปลง Canvas เป็นไฟล์ JPG
                canvas.toBlob(async function(blob) {
                    const fileName = 'SCC_Report_' + new Date().getTime() + '.jpg';
                    const url = window.URL.createObjectURL(blob);

                    // ถ้าเป็นมือถือ (Android/iOS) ให้พยายามใช้ระบบแชร์ (Web Share API)
                    if (isMobile && navigator.share) {
                        const file = new File([blob], fileName, { type: 'image/jpeg' });
                        if (navigator.canShare && navigator.canShare({ files: [file] })) {
                            try {
                                await navigator.share({
                                    files: [file],
                                    title: 'SCC Report'
                                });
                            } catch (e) {
                                console.log('ผู้ใช้ยกเลิกการแชร์ หรือระบบขัดข้อง จะทำการดาวน์โหลดปกติแทน', e);
                                // แผนสำรอง: ถ้าแชร์ล้มเหลว ให้ดาวน์โหลดตรงๆ
                                fallbackDownload(url, fileName);
                            }
                        } else {
                            fallbackDownload(url, fileName);
                        }
                    } else {
                        // ถ้าเป็นคอมพิวเตอร์ หรือ มือถือที่ไม่รองรับแชร์ ให้ดาวน์โหลดตรงๆ ทันที
                        fallbackDownload(url, fileName);
                    }
                    
                    document.body.removeChild(hiddenWrapper);
                    btnExport.textContent = originalText; 
                    btnExport.disabled = false;
                }, 'image/jpeg', 0.8); // ลด Quality ของไฟล์ผลลัพธ์สุดท้ายที่ส่งออกเป็น 0.8
            }).catch(err => {
                alert("เกิดข้อผิดพลาดในการสร้างรูปภาพ กรุณาลองใหม่ครับ");
                document.body.removeChild(hiddenWrapper);
                btnExport.textContent = originalText; 
                btnExport.disabled = false;
            });
        });
    }
    
    // ฟังก์ชันเสริมสำหรับดาวน์โหลดตรงๆ (เมื่อไม่ใช่การแชร์)
    function fallbackDownload(url, fileName) {
        const link = document.createElement('a');
        link.download = fileName;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        // หน่วงเวลาเคลียร์ Memory ป้องกัน Android บางรุ่นโหลดไม่ทัน
        setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    }

    const closeModalBtnPopup = document.getElementById('close-modal');
    if (closeModalBtnPopup) {
        closeModalBtnPopup.addEventListener('click', function() {
            document.getElementById('mobile-modal').classList.add('hidden');
            document.getElementById('mobile-preview-img').src = ''; 
        });
    }
});
