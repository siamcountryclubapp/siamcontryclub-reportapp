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
// ฉีด HTML สร้างหน้าต่าง Crop Modal 
// =========================================================
const cropModalHTML = `
<div id="crop-modal" class="hidden" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 99999; background: rgba(0,0,0,0.95); display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px; box-sizing: border-box; touch-action: none; overscroll-behavior: none;">
    <div style="display: flex; justify-content: space-between; width: 100%; max-width: 500px; margin-bottom: 20px; align-items: center;">
        <h3 style="color: white; margin: 0; font-weight: normal; font-size: 16px;">ใช้นิ้วลากหรือซูมภาพ</h3>
        <button id="btn-crop-close" style="background: #16a34a; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; font-size: 16px; cursor: pointer;">เสร็จสิ้น</button>
    </div>
    
    <!-- กรอบครอปภาพ (ล็อกสัดส่วน) -->
    <div id="crop-modal-frame" style="background-color: #111; overflow: hidden; position: relative; display: flex; justify-content: center; align-items: center; box-shadow: 0 0 0 2px rgba(255,255,255,0.8), 0 10px 30px rgba(0,0,0,0.8); cursor: grab; touch-action: none;">
        <!-- รูปภาพที่ใช้เลื่อน -->
        <img id="crop-modal-img" style="position: absolute; pointer-events: none; transform-origin: center;" draggable="false" />
        
        <!-- เส้นตาราง 9 ช่อง -->
        <div style="position: absolute; top: 33.33%; left: 0; width: 100%; height: 1px; background: rgba(255,255,255,0.4); pointer-events: none;"></div>
        <div style="position: absolute; top: 66.66%; left: 0; width: 100%; height: 1px; background: rgba(255,255,255,0.4); pointer-events: none;"></div>
        <div style="position: absolute; left: 33.33%; top: 0; height: 100%; width: 1px; background: rgba(255,255,255,0.4); pointer-events: none;"></div>
        <div style="position: absolute; left: 66.66%; top: 0; height: 100%; width: 1px; background: rgba(255,255,255,0.4); pointer-events: none;"></div>
    </div>

    <!-- ปุ่มซูม -->
    <div style="display: flex; gap: 20px; margin-top: 30px;">
        <button id="btn-crop-zoom-out" style="background: rgba(255,255,255,0.2); color: white; border: none; padding: 15px 35px; border-radius: 12px; font-size: 20px; cursor: pointer;">➖</button>
        <button id="btn-crop-zoom-in" style="background: rgba(255,255,255,0.2); color: white; border: none; padding: 15px 35px; border-radius: 12px; font-size: 20px; cursor: pointer;">➕</button>
    </div>
</div>
`;
document.body.insertAdjacentHTML('beforeend', cropModalHTML);

// =========================================================
// ระบบ Local Storage (IndexedDB)
// =========================================================
const DB_NAME = "SCCReportDB";
const STORE_NAME = "reports";
let db;
let currentJobId = null; 
let currentJobList = [];

try {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = function(event) {
        db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
        }
    };
    request.onsuccess = function(event) { db = event.target.result; };
} catch (e) {
    console.error("IndexedDB error:", e);
}

function resetJob() {
    currentJobId = null;
    stateBefore = [];
    stateAfter = [];
    if(document.getElementById('input-reporter')) document.getElementById('input-reporter').value = '';
    if(document.getElementById('input-location')) document.getElementById('input-location').value = '';
    if(document.getElementById('save-indicator')) document.getElementById('save-indicator').textContent = '';
    renderBA();
}

// ------------------------------------------------
// ฟังก์ชันคำนวณสัดส่วนรูปภาพ (สมการคณิตศาสตร์)
// ------------------------------------------------
function applyImageTransform(img, frame, item) {
    if (!img.naturalWidth || !frame.offsetWidth) return;
    
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

    const maxPanPctX = ((baseW * item.zoom - frameW) / 2) / baseW * 100;
    const maxPanPctY = ((baseH * item.zoom - frameH) / 2) / baseH * 100;

    item.panX = Math.max(-maxPanPctX, Math.min(maxPanPctX, item.panX));
    item.panY = Math.max(-maxPanPctY, Math.min(maxPanPctY, item.panY));

    img.style.transform = `scale(${item.zoom}) translate(${item.panX}%, ${item.panY}%)`;
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
            upBtn.onclick = () => {
                [stateArray[index - 1], stateArray[index]] = [stateArray[index], stateArray[index - 1]];
                renderCallback();
            };
            actionDiv.appendChild(upBtn);
        }
        if (index < stateArray.length - 1) {
            const downBtn = document.createElement('span');
            downBtn.className = 'move-file-btn';
            downBtn.innerHTML = '▼'; 
            downBtn.onclick = () => {
                [stateArray[index + 1], stateArray[index]] = [stateArray[index], stateArray[index + 1]];
                renderCallback();
            };
            actionDiv.appendChild(downBtn);
        }
        
        const delBtn = document.createElement('span');
        delBtn.className = 'delete-file-btn';
        delBtn.textContent = 'ลบ';
        delBtn.onclick = () => {
            stateArray.splice(index, 1);
            renderCallback();
        };
        
        actionDiv.appendChild(delBtn);
        div.appendChild(nameSpan);
        div.appendChild(actionDiv);
        container.appendChild(div);
    });
}

// ------------------------------------------------
// ระบบสร้างช่องรูปภาพ (คลิกรูปเพื่อครอปได้)
// ------------------------------------------------
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
    div.style.touchAction = 'manipulation';
    
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
// โหมดครอปรูปภาพ (Modal Cropper) - ระบบ Touch Events สำหรับมือถือ
// ------------------------------------------------
let activeCropItem = null;
let activePreviewImg = null;
let activePreviewSlot = null;
const modal = document.getElementById('crop-modal');
const modalFrame = document.getElementById('crop-modal-frame');
const modalImg = document.getElementById('crop-modal-img');

function openCropModal(item, slotElement, previewImg) {
    activeCropItem = item;
    activePreviewSlot = slotElement;
    activePreviewImg = previewImg;
    
    const slotW = slotElement.offsetWidth;
    const slotH = slotElement.offsetHeight;
    if(slotW === 0 || slotH === 0) return;
    
    const slotRatio = slotW / slotH;
    const maxW = window.innerWidth * 0.9;
    const maxH = window.innerHeight * 0.6;
    
    let frameW = maxW;
    let frameH = frameW / slotRatio;
    
    if (frameH > maxH) {
        frameH = maxH;
        frameW = frameH * slotRatio;
    }
    
    modalFrame.style.width = `${frameW}px`;
    modalFrame.style.height = `${frameH}px`;
    
    modalImg.src = item.url;
    
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; 
    
    // คำนวณหลังจากโชว์ modal แล้ว
    setTimeout(() => {
        applyImageTransform(modalImg, modalFrame, activeCropItem);
    }, 10);
}

document.getElementById('btn-crop-close').addEventListener('click', () => {
    modal.classList.add('hidden');
    document.body.style.overflow = ''; 
    activeCropItem = null;
    activePreviewImg = null;
    activePreviewSlot = null;
    autoSaveToLocal(); 
});

// ==========================================
// ฟังก์ชันลากภาพ (เมาส์ + นิ้วสัมผัส)
// ==========================================
let isDragging = false;
let startX, startY;

// ตัวดึงพิกัดนิ้วหรือเมาส์ให้ถูกต้อง
const getEvX = (e) => e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
const getEvY = (e) => e.type.includes('touch') ? e.touches[0].clientY : e.clientY;

const startDrag = (e) => {
    if (!activeCropItem) return;
    isDragging = true;
    startX = getEvX(e);
    startY = getEvY(e);
    modalFrame.style.cursor = 'grabbing';
};

const onDrag = (e) => {
    if (!isDragging || !activeCropItem) return;
    
    // หัวใจสำคัญสำหรับมือถือ: ล็อกไม่ให้หน้าจอเลื่อนเวลาใช้นิ้วลากรูป
    if (e.type.includes('touch')) {
        e.preventDefault(); 
    }

    const currentX = getEvX(e);
    const currentY = getEvY(e);
    
    const diffX = currentX - startX;
    const diffY = currentY - startY;

    const frameW = modalFrame.offsetWidth;
    const frameH = modalFrame.offsetHeight;
    const imgRatio = modalImg.naturalWidth / modalImg.naturalHeight;
    const frameRatio = frameW / frameH;
    
    let baseW, baseH;
    if (imgRatio > frameRatio) {
        baseH = frameH;
        baseW = frameH * imgRatio;
    } else {
        baseW = frameW;
        baseH = frameW / imgRatio;
    }

    activeCropItem.panX += (diffX / (baseW * activeCropItem.zoom)) * 100;
    activeCropItem.panY += (diffY / (baseH * activeCropItem.zoom)) * 100;

    applyImageTransform(modalImg, modalFrame, activeCropItem);
    if (activePreviewImg && activePreviewSlot) {
        applyImageTransform(activePreviewImg, activePreviewSlot, activeCropItem);
    }

    startX = currentX;
    startY = currentY;
};

const stopDrag = () => {
    isDragging = false;
    modalFrame.style.cursor = 'grab';
};

// จับ Events ของคอมพิวเตอร์
modalFrame.addEventListener('mousedown', startDrag);
window.addEventListener('mousemove', onDrag, { passive: false });
window.addEventListener('mouseup', stopDrag);

// จับ Events ของมือถือ (passive: false คือพระเอกที่ทำให้ลากติดนิ้ว)
modalFrame.addEventListener('touchstart', startDrag, { passive: false });
window.addEventListener('touchmove', onDrag, { passive: false });
window.addEventListener('touchend', stopDrag);
window.addEventListener('touchcancel', stopDrag);

// ระบบซูมภาพ
const handleZoom = (direction) => {
    if(!activeCropItem) return;
    const zoomStep = 0.15;
    activeCropItem.zoom += direction * zoomStep;
    activeCropItem.zoom = Math.max(1, Math.min(5, activeCropItem.zoom));
    
    applyImageTransform(modalImg, modalFrame, activeCropItem);
    if (activePreviewImg && activePreviewSlot) {
        applyImageTransform(activePreviewImg, activePreviewSlot, activeCropItem);
    }
};

document.getElementById('btn-crop-zoom-in').addEventListener('click', () => handleZoom(1));
document.getElementById('btn-crop-zoom-out').addEventListener('click', () => handleZoom(-1));

modalFrame.addEventListener('wheel', (e) => {
    e.preventDefault(); 
    handleZoom(Math.sign(e.deltaY) * -1);
}, { passive: false });


// ------------------------------------------------
// ฟังก์ชัน Render หลัก
// ------------------------------------------------
function renderGeneral() {
    const reportContent = document.getElementById('report-content');
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

    if (count === 0) {
        updateFileListUI('file-list-general', stateGeneral, renderGeneral);
        return;
    }
    
    if (count === 1) { 
        reportContent.style.gridTemplateColumns = '1fr'; 
        reportContent.style.gridTemplateRows = '1fr'; 
    } 
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
    else if (count === 3) { 
        reportContent.style.gridTemplateColumns = '1fr 1fr'; 
        reportContent.style.gridTemplateRows = '1fr 1fr'; 
    } 
    else if (count === 5) { 
        reportContent.style.gridTemplateColumns = 'repeat(6, 1fr)'; 
        reportContent.style.gridTemplateRows = '1fr 1fr'; 
    } 
    else if (count === 7) { 
        reportContent.style.gridTemplateColumns = 'repeat(6, 1fr)'; 
        reportContent.style.gridTemplateRows = 'repeat(3, 1fr)'; 
    } 
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
    autoSaveToLocal();
}

// ------------------------------------------------
// โหลดค่า UI และ Events พื้นฐาน
// ------------------------------------------------
window.addEventListener('DOMContentLoaded', () => {
    const dateInput = document.getElementById('input-date');
    if(dateInput) {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        dateInput.value = `${yyyy}-${mm}-${dd}`;
        dateInput.dispatchEvent(new Event('input')); 
    }
});

const tabGeneral = document.getElementById('tab-general');
const tabBA = document.getElementById('tab-ba');
const uploadGeneral = document.getElementById('upload-section-general');
const uploadBA = document.getElementById('upload-section-ba');
const reportContent = document.getElementById('report-content');

if (tabGeneral) tabGeneral.addEventListener('click', () => {
    currentMode = 'general';
    tabGeneral.classList.add('active');
    tabBA.classList.remove('active');
    uploadGeneral.classList.remove('hidden');
    uploadBA.classList.add('hidden');
    renderGeneral(); 
});

if (tabBA) tabBA.addEventListener('click', () => {
    currentMode = 'ba';
    tabBA.classList.add('active');
    tabGeneral.classList.remove('active');
    uploadBA.classList.remove('hidden');
    uploadGeneral.classList.add('hidden');
    buildBeforeAfterLayout();
    renderBA(); 
});

function buildBeforeAfterLayout() {
    reportContent.style.padding = '0'; 
    reportContent.style.display = 'flex';
    reportContent.style.flexDirection = 'column';
    reportContent.style.backgroundColor = 'transparent';
    reportContent.innerHTML = `
        <div class="section-before">
            <div class="badge-ba badge-before">BEFORE</div>
            <div id="grid-before" style="flex: 1; display: grid; gap: 10px;"></div>
        </div>
        <div class="section-after">
            <div class="badge-ba badge-after">AFTER</div>
            <div id="grid-after" style="flex: 1; display: grid; gap: 10px;"></div>
        </div>
    `;
}

function handleFileUpload(files, stateArray, renderCallback) {
    if (files.length === 0) return;
    const fileArr = Array.from(files);
    let filesRead = 0;
    fileArr.forEach(file => {
        const reader = new FileReader();
        reader.onload = e => {
            stateArray.push({
                name: file.name,
                url: e.target.result,
                panX: 0,
                panY: 0,
                zoom: 1
            });
            filesRead++;
            if (filesRead === fileArr.length) renderCallback();
        };
        reader.readAsDataURL(file);
    });
}

const inputGeneral = document.getElementById('input-images-general');
if(inputGeneral) inputGeneral.addEventListener('change', function(e) {
    if (currentMode !== 'general') return;
    handleFileUpload(e.target.files, stateGeneral, renderGeneral);
    e.target.value = ''; 
});

const inputBefore = document.getElementById('input-images-before');
if(inputBefore) inputBefore.addEventListener('change', function(e) {
    if (currentMode !== 'ba') return;
    handleFileUpload(e.target.files, stateBefore, renderBA);
    e.target.value = '';
});

const inputAfter = document.getElementById('input-images-after');
if(inputAfter) inputAfter.addEventListener('change', function(e) {
    if (currentMode !== 'ba') return;
    handleFileUpload(e.target.files, stateAfter, renderBA);
    e.target.value = '';
});

function setupTextBinding(inputId, previewId) {
    const el = document.getElementById(inputId);
    if (el) {
        el.addEventListener('input', function(event) {
            document.getElementById(previewId).textContent = event.target.value || '\u00A0';
        });
    }
}
setupTextBinding('input-date', 'prev-date'); 
setupTextBinding('input-dept', 'prev-dept');
setupTextBinding('input-title', 'prev-title');

const btnAlignLeft = document.getElementById('btn-align-left');
const btnAlignCenter = document.getElementById('btn-align-center');
const prevTitleBox = document.getElementById('prev-title');

if (btnAlignLeft && btnAlignCenter && prevTitleBox) {
    btnAlignLeft.addEventListener('click', () => {
        btnAlignLeft.classList.add('active');
        btnAlignCenter.classList.remove('active');
        prevTitleBox.style.textAlign = 'left';
    });
    btnAlignCenter.addEventListener('click', () => {
        btnAlignCenter.classList.add('active');
        btnAlignLeft.classList.remove('active');
        prevTitleBox.style.textAlign = 'center';
    });
}

document.querySelectorAll('.tpl-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.tpl-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        currentTemplate = this.getAttribute('data-tpl');
        const tplData = templateConfig[currentTemplate];
        document.getElementById('report-canvas').style.backgroundColor = tplData.main;
        document.getElementById('course-logo').src = tplData.logo;
        if (currentMode === 'general') renderGeneral();
        if (currentMode === 'ba') autoSaveToLocal(); 
    });
});

const btnLayoutH = document.getElementById('btn-layout-h');
const btnLayoutV = document.getElementById('btn-layout-v');
if (btnLayoutH && btnLayoutV) {
    btnLayoutH.addEventListener('click', () => {
        layoutTwoImages = 'horizontal';
        btnLayoutH.classList.add('active');
        btnLayoutV.classList.remove('active');
        if (currentMode === 'general') renderGeneral();
    });
    btnLayoutV.addEventListener('click', () => {
        layoutTwoImages = 'vertical';
        btnLayoutV.classList.add('active');
        btnLayoutH.classList.remove('active');
        if (currentMode === 'general') renderGeneral();
    });
}

// =========================================================
// ผูก Event ให้ฟังก์ชันบันทึกลงเบราว์เซอร์อัตโนมัติ
// =========================================================
function autoSaveToLocal() {
    if (currentMode !== 'ba') return; 
    if (stateBefore.length === 0 && stateAfter.length === 0) return; 

    const reporter = document.getElementById('input-reporter') ? document.getElementById('input-reporter').value : '';
    const location = document.getElementById('input-location') ? document.getElementById('input-location').value : '';
    
    const imagesPayload = [];
    stateBefore.forEach(img => imagesPayload.push({ type: 'before', data: img.url, panX: img.panX, panY: img.panY, zoom: img.zoom }));
    stateAfter.forEach(img => imagesPayload.push({ type: 'after', data: img.url, panX: img.panX, panY: img.panY, zoom: img.zoom }));

    const hasAfter = stateAfter.length > 0;
    
    const jobData = {
        course: currentTemplate,
        reporter_name: reporter,
        location: location,
        images: imagesPayload,
        status: hasAfter ? 'completed' : 'pending',
        updated_at: new Date().getTime() 
    };

    if (currentJobId) jobData.id = currentJobId;

    if (db) {
        const transaction = db.transaction([STORE_NAME], "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        const putRequest = currentJobId ? store.put(jobData) : store.add(jobData);

        putRequest.onsuccess = function(event) {
            if (!currentJobId) currentJobId = event.target.result;
            const ind = document.getElementById('save-indicator');
            if (ind) {
                ind.textContent = 'บันทึกลงเครื่องแล้ว 💾';
                ind.style.color = '#16a34a';
                setTimeout(() => { ind.textContent = ''; }, 3000);
            }
        };
    }
}

// ------------------------------------------------
// ดูประวัติงานย้อนหลัง
// ------------------------------------------------
const btnHistory = document.getElementById('btn-history');
if (btnHistory) {
    btnHistory.addEventListener('click', function() {
        document.getElementById('history-modal').classList.remove('hidden');
        document.getElementById('history-badge').textContent = `สนาม ${currentTemplate.toUpperCase()}`;
        const historyList = document.getElementById('history-list');
        historyList.innerHTML = '<div style="text-align:center;">กำลังโหลดข้อมูล...</div>';

        if (!db) {
            historyList.innerHTML = '<div style="text-align:center; color:red;">เบราว์เซอร์ของคุณไม่รองรับ หรือระบบยังไม่พร้อมใช้งาน</div>';
            return;
        }

        const transaction = db.transaction([STORE_NAME], "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        const getRequest = store.getAll();

        getRequest.onsuccess = function() {
            let allJobs = getRequest.result;
            const now = new Date().getTime();
            const sixtyDays = 60 * 24 * 60 * 60 * 1000; 
            let filteredJobs = [];

            allJobs.forEach(job => {
                if (now - job.updated_at > sixtyDays) store.delete(job.id); 
                else if (job.course === currentTemplate) filteredJobs.push(job);
            });

            filteredJobs.sort((a, b) => b.updated_at - a.updated_at);
            currentJobList = filteredJobs;

            if (filteredJobs.length > 0) {
                historyList.innerHTML = '';
                filteredJobs.forEach((job, index) => {
                    const div = document.createElement('div');
                    div.style.padding = '12px';
                    div.style.border = '1px solid #ddd';
                    div.style.borderRadius = '8px';
                    div.style.background = job.status === 'completed' ? '#f0fdf4' : '#fafafa';
                    const statusText = job.status === 'completed' ? '<span style="color:#16a34a">เสร็จสมบูรณ์</span>' : '<span style="color:#d97706">รออัปเดตภาพ AFTER</span>';
                    
                    const dateObj = new Date(job.updated_at);
                    const dateStr = dateObj.toLocaleDateString('th-TH') + ' ' + dateObj.toLocaleTimeString('th-TH').slice(0, 5) + ' น.';

                    div.innerHTML = `
                        <div style="font-weight:bold; font-size:15px;">📍 ${job.location || 'ไม่ได้ระบุ'}</div>
                        <div style="font-size:13px; color:#555;">ผู้แจ้ง: ${job.reporter_name || 'ไม่ได้ระบุ'}</div>
                        <div style="font-size:12px; color:#888;">อัปเดตล่าสุด: ${dateStr}</div>
                        <div style="font-size:13px; font-weight:bold; margin-top:5px;">สถานะ: ${statusText}</div>
                        <button class="save-btn" style="margin-top:10px; width:100%; background:#17325c; border-color:#17325c" onclick="loadJobToEditor(${index})">
                            เปิดงานนี้
                        </button>
                    `;
                    historyList.appendChild(div);
                });
            } else {
                historyList.innerHTML = '<div style="text-align:center; color:#888;">ยังไม่มีประวัติงานสำหรับสนามนี้ (บันทึกในเครื่อง)</div>';
            }
        };
    });
}

window.loadJobToEditor = function(index) {
    const jobData = currentJobList[index];
    currentJobId = jobData.id;
    
    if (document.getElementById('input-reporter')) document.getElementById('input-reporter').value = jobData.reporter_name;
    if (document.getElementById('input-location')) document.getElementById('input-location').value = jobData.location;

    stateBefore = [];
    stateAfter = [];
    
    if(jobData.images) {
        jobData.images.forEach((img, i) => {
            const imgObj = { 
                name: 'image_'+i+'.jpg', 
                url: img.data, 
                panX: img.panX || 0, 
                panY: img.panY || 0, 
                zoom: img.zoom || 1 
            };
            if (img.type === 'before') stateBefore.push(imgObj);
            if (img.type === 'after') stateAfter.push(imgObj);
        });
    }

    document.getElementById('history-modal').classList.add('hidden');
    setTimeout(() => { renderBA(); }, 100);
};

const closeHistoryBtn = document.getElementById('close-history');
if (closeHistoryBtn) {
    closeHistoryBtn.addEventListener('click', function() {
        document.getElementById('history-modal').classList.add('hidden');
    });
}

// ------------------------------------------------
// Export รูปภาพ JPG
// ------------------------------------------------
document.getElementById('btn-export').addEventListener('click', function() {
    const originalCanvas = document.getElementById('report-canvas');
    const originalText = this.textContent;
    this.textContent = "กำลังประมวลผลรูปภาพ...";
    this.disabled = true;

    const clonedElement = originalCanvas.cloneNode(true);
    
    const deleteBtns = clonedElement.querySelectorAll('.delete-slot-btn');
    deleteBtns.forEach(btn => btn.remove());

    const hiddenWrapper = document.createElement('div');
    hiddenWrapper.style.position = 'absolute';
    hiddenWrapper.style.top = '-9999px';
    hiddenWrapper.style.left = '-9999px';
    hiddenWrapper.style.width = '1076px';
    hiddenWrapper.style.height = '1521px';
    
    hiddenWrapper.appendChild(clonedElement);
    document.body.appendChild(hiddenWrapper);

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent); 
    const isLine = navigator.userAgent.includes("Line"); 
    const exportScale = isMobile ? 1.5 : 2; 

    html2canvas(clonedElement, { scale: exportScale, useCORS: true, backgroundColor: "#ffffff", logging: false }).then(canvas => {
        
        if (isLine) {
            const imgData = canvas.toDataURL('image/jpeg', 1.0); 
            document.getElementById('mobile-preview-img').src = imgData;
            document.getElementById('mobile-modal').classList.remove('hidden');
            
            document.body.removeChild(hiddenWrapper);
            this.textContent = originalText;
            this.disabled = false;
            return; 
        }

        canvas.toBlob(async function(blob) {
            const fileName = 'SCC_Report_' + new Date().getTime() + '.jpg';

            if (isIOS && navigator.share && navigator.canShare({ files: [new File([blob], fileName, { type: 'image/jpeg' })] })) {
                try {
                    await navigator.share({
                        files: [new File([blob], fileName, { type: 'image/jpeg' })],
                        title: 'SCC Report',
                    });
                } catch (error) {
                    console.log('ผู้ใช้ยกเลิกการแชร์', error);
                }
            } 
            else {
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.download = fileName;
                link.href = url;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            }
            
            document.body.removeChild(hiddenWrapper);
            const btn = document.getElementById('btn-export');
            btn.textContent = originalText;
            btn.disabled = false;
        }, 'image/jpeg', 1.0);

    }).catch(err => {
        alert("เกิดข้อผิดพลาดในการสร้างรูปภาพ กรุณาลองใหม่ครับ");
        document.body.removeChild(hiddenWrapper);
        const btn = document.getElementById('btn-export');
        btn.textContent = originalText;
        btn.disabled = false;
    });
});

const closeModalBtnPopup = document.getElementById('close-modal');
if (closeModalBtnPopup) {
    closeModalBtnPopup.addEventListener('click', function() {
        document.getElementById('mobile-modal').classList.add('hidden');
        document.getElementById('mobile-preview-img').src = ''; 
    });
}
