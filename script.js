// =========================================================
// บังคับเด้งออกจาก LINE ไป Safari / Chrome พร้อมแสดงหน้าจอโหลด
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

// ------------------------------------------------
// สถานะเก็บรูปภาพแบบสะสม (Array)
// ------------------------------------------------
let stateGeneral = [];
let stateBefore = [];
let stateAfter = [];
let currentTemplate = 'oc'; // เก็บค่า Template ปัจจุบัน
let layoutTwoImages = 'horizontal'; // <--- เพิ่มบรรทัดนี้

// ------------------------------------------------
// ฟังก์ชันอัปเดตรายชื่อไฟล์ และฟีเจอร์จัดเรียงรูปภาพ (เลื่อนขึ้น/ลง)
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
        
        const actionDiv = document.createElement('div');
        actionDiv.style.display = 'flex';
        actionDiv.style.gap = '8px';
        actionDiv.style.alignItems = 'center';

        // ปุ่มเลื่อนขึ้น (ถ้าไม่ใช่รูปแรกสุด)
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

        // ปุ่มเลื่อนลง (ถ้าไม่ใช่รูปสุดท้าย)
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
// ระบบอัปโหลดและเรนเดอร์: โหมดทั่วไป
// ------------------------------------------------
function renderGeneral() {
    const reportContent = document.getElementById('report-content');
    reportContent.innerHTML = '';
    reportContent.style.padding = '16px 32px';
    reportContent.style.display = 'grid';
    reportContent.style.flexDirection = 'unset';
    
    // ดึงสีพื้นหลังจาก Template ปัจจุบัน
    reportContent.style.backgroundColor = templateConfig[currentTemplate].bg;

    const count = stateGeneral.length;

    // แสดง/ซ่อน เมนูเลือกเลย์เอาต์เฉพาะเมื่อมีรูปภาพเป็น "จำนวนคู่" (และมากกว่า 0 รูป)
    const layoutToggle = document.getElementById('layout-toggle-2img');
    if (layoutToggle) {
        if (count > 0 && count % 2 === 0) {
            layoutToggle.classList.remove('hidden');
        } else {
            layoutToggle.classList.add('hidden');
        }
    }

    if (count === 0) {
        updateFileListUI('file-list-general', stateGeneral, renderGeneral);
        return;
    }
    
    // ------------------------------------------------
    // การคำนวณและตั้งค่า Grid รองรับทั้งจำนวนคู่และจำนวนคี่
    // ------------------------------------------------
    if (count === 1) { 
        reportContent.style.gridTemplateColumns = '1fr'; 
        reportContent.style.gridTemplateRows = '1fr'; 
    } 
    // ถ้าเป็นจำนวนคู่ (2, 4, 6, 8, 10 รูป...)
    else if (count % 2 === 0) {
        const half = count / 2;
        if (layoutTwoImages === 'vertical') {
            // โหมดแนวตั้ง (เน้นรูปทรงสูง): จำนวนคอลัมน์น้อยกว่า จำนวนแถวมกกว่า
            reportContent.style.gridTemplateColumns = `repeat(${Math.min(2, half)}, 1fr)`; 
            reportContent.style.gridTemplateRows = `repeat(${Math.max(2, half)}, 1fr)`; 
        } else {
            // โหมดแนวนอน (เน้นรูปทรงกว้าง): จำนวนคอลัมน์มากกว่า จำนวนแถวน้อยกว่า
            reportContent.style.gridTemplateColumns = `repeat(${Math.max(2, half)}, 1fr)`; 
            reportContent.style.gridTemplateRows = `repeat(${Math.min(2, half)}, 1fr)`; 
        }
    } 
    // กรณีเป็นจำนวนคี่พิเศษ (3, 5, 7 รูป)
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
    // จำนวนคี่อื่นๆ
    else {
        const cols = Math.ceil(Math.sqrt(count));
        const rows = Math.ceil(count / cols);
        reportContent.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
        reportContent.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
    }
    
    // วาดรูปตาม State
    stateGeneral.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'img-slot';
        
        // จัดการ Span สัดส่วนสำหรับจำนวนคี่พิเศษ
        if (count === 3 && index === 0) div.style.gridColumn = '1 / span 2';
        else if (count === 5) div.style.gridColumn = index < 2 ? 'span 3' : 'span 2';
        else if (count === 7) div.style.gridColumn = index < 4 ? 'span 3' : 'span 2';

        const bgDiv = document.createElement('div');
        bgDiv.className = 'img-bg';
        bgDiv.style.backgroundImage = `url('${item.url}')`;

        const delBtn = document.createElement('button');
        delBtn.className = 'delete-slot-btn';
        delBtn.innerHTML = '×';
        delBtn.onclick = () => {
            stateGeneral.splice(index, 1);
            renderGeneral();
        };

        div.appendChild(bgDiv);
        div.appendChild(delBtn);
        makeDraggable(div, bgDiv, item);

        reportContent.appendChild(div);
    });

    updateFileListUI('file-list-general', stateGeneral, renderGeneral);
}

// ------------------------------------------------
// ระบบอัปโหลดและเรนเดอร์: โหมด Before/After
// ------------------------------------------------
function renderBA() {
    const gridBefore = document.getElementById('grid-before');
    const gridAfter = document.getElementById('grid-after');
    if (!gridBefore || !gridAfter) return;

    const renderGrid = (grid, stateArray, listId) => {
        grid.innerHTML = '';
        grid.style.gridTemplateColumns = `repeat(${Math.max(1, stateArray.length)}, 1fr)`;
        
        stateArray.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'img-slot';
            
            const bgDiv = document.createElement('div');
            bgDiv.className = 'img-bg';
            bgDiv.style.backgroundImage = `url('${item.url}')`;
            
            const delBtn = document.createElement('button');
            delBtn.className = 'delete-slot-btn';
            delBtn.innerHTML = '×';
            delBtn.onclick = () => {
                stateArray.splice(index, 1);
                renderBA();
            };
            
            div.appendChild(bgDiv);
            div.appendChild(delBtn);
            makeDraggable(div, bgDiv, item);
            grid.appendChild(div);
        });

        updateFileListUI(listId, stateArray, renderBA);
    };

    renderGrid(gridBefore, stateBefore, 'file-list-before');
    renderGrid(gridAfter, stateAfter, 'file-list-after');
}

// ------------------------------------------------
// ฟังก์ชันสำหรับทำให้รูปลาก/เลื่อน, ซูม และลากคลุมครอปได้
// ------------------------------------------------
function makeDraggable(container, bgElement, stateObj) {
    let isDragging = false;
    let isCropping = false;
    let startX, startY;
    
    // ตัวแปรสำหรับกล่อง Crop
    let cropBox = null;
    let rectStartX, rectStartY;

    // กำหนดค่าเริ่มต้นของพิกัดและซูมถ้ายังไม่มี
    if (stateObj.panX === undefined) stateObj.panX = 0;
    if (stateObj.panY === undefined) stateObj.panY = 0;
    if (stateObj.zoom === undefined) stateObj.zoom = 1;

    // ฟังก์ชันสำหรับอัปเดตและจำกัดขอบเขตการเลื่อน
    const updateTransform = () => {
        const rect = container.getBoundingClientRect();
        
        // คำนวณระยะสูงสุดที่สามารถเลื่อนได้ (เพื่อไม่ให้เกิดช่องว่าง/พื้นหลังโผล่)
        const maxPanX = Math.max(0, (rect.width * (stateObj.zoom - 1)) / (2 * stateObj.zoom));
        const maxPanY = Math.max(0, (rect.height * (stateObj.zoom - 1)) / (2 * stateObj.zoom));

        // จำกัดพิกัด X และ Y ให้อยู่ในขอบเขตภาพเท่านั้น (Clamping)
        stateObj.panX = Math.max(-maxPanX, Math.min(maxPanX, stateObj.panX));
        stateObj.panY = Math.max(-maxPanY, Math.min(maxPanY, stateObj.panY));

        bgElement.style.transform = `scale(${stateObj.zoom}) translate(${stateObj.panX}px, ${stateObj.panY}px)`;
    };

    // โหลดตำแหน่งและซูมจาก State เริ่มต้น
    bgElement.style.backgroundPosition = 'center';
    updateTransform();
    bgElement.style.cursor = 'grab';

    const startDrag = (e) => {
        // หากผู้ใช้กดปุ่ม Shift ค้างไว้ จะเข้าสู่โหมด "ลากคลุมครอป"
        if (e.shiftKey && e.type.includes('mouse')) {
            isCropping = true;
            isDragging = false;
            
            const rect = container.getBoundingClientRect();
            rectStartX = e.clientX - rect.left;
            rectStartY = e.clientY - rect.top;

            // สร้างกล่องสี่เหลี่ยม
            if (!cropBox) {
                cropBox = document.createElement('div');
                cropBox.className = 'crop-selection';
                container.appendChild(cropBox);
            }
            cropBox.style.left = `${rectStartX}px`;
            cropBox.style.top = `${rectStartY}px`;
            cropBox.style.width = '0px';
            cropBox.style.height = '0px';
            cropBox.style.display = 'block';
            bgElement.style.cursor = 'crosshair';
            return;
        }

        // โหมดปกติ: ลากเพื่อเลื่อนรูป (Pan)
        isDragging = true;
        isCropping = false;
        startX = e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
        startY = e.type.includes('mouse') ? e.pageY : e.touches[0].clientY;
        bgElement.style.cursor = 'grabbing';
    };

    const onDrag = (e) => {
        if (isCropping) {
            e.preventDefault();
            const rect = container.getBoundingClientRect();
            let currentMouseX = e.clientX - rect.left;
            let currentMouseY = e.clientY - rect.top;

            // ล็อกให้อยู่ในกรอบรูป
            currentMouseX = Math.max(0, Math.min(currentMouseX, rect.width));
            currentMouseY = Math.max(0, Math.min(currentMouseY, rect.height));

            const width = Math.abs(currentMouseX - rectStartX);
            const height = Math.abs(currentMouseY - rectStartY);
            const left = Math.min(currentMouseX, rectStartX);
            const top = Math.min(currentMouseY, rectStartY);

            cropBox.style.width = `${width}px`;
            cropBox.style.height = `${height}px`;
            cropBox.style.left = `${left}px`;
            cropBox.style.top = `${top}px`;
            return;
        }

        if (!isDragging) return;
        e.preventDefault(); 

        const currentX = e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
        const currentY = e.type.includes('mouse') ? e.pageY : e.touches[0].clientY;

        const diffX = currentX - startX;
        const diffY = currentY - startY;

        // หารซูมเพื่อให้ความเร็วสอดคล้องกับนิ้วเมื่อซูมเข้าไป
        stateObj.panX += diffX / stateObj.zoom;
        stateObj.panY += diffY / stateObj.zoom;

        updateTransform();

        startX = currentX;
        startY = currentY;
    };

    const stopDrag = () => {
        if (isCropping && cropBox) {
            isCropping = false;
            cropBox.style.display = 'none';
            bgElement.style.cursor = 'grab';

            const rect = container.getBoundingClientRect();
            const boxWidth = parseFloat(cropBox.style.width);
            const boxHeight = parseFloat(cropBox.style.height);
            const boxLeft = parseFloat(cropBox.style.left);
            const boxTop = parseFloat(cropBox.style.top);

            // หากลากคลุมเล็กเกินไป ให้ยกเลิก (ป้องกันการคลิกพลาด)
            if (boxWidth < 20 || boxHeight < 20) return;

            const scaleX = rect.width / boxWidth;
            const scaleY = rect.height / boxHeight;
            let newZoom = Math.min(scaleX, scaleY); 
            
            const targetZoom = Math.min(5, stateObj.zoom * newZoom);

            // ย้ายพิกัดให้กล่องที่ลากมาอยู่ตรงกลาง
            const centerX = boxLeft + (boxWidth / 2);
            const centerY = boxTop + (boxHeight / 2);
            const originX = rect.width / 2;
            const originY = rect.height / 2;

            stateObj.panX += (originX - centerX) / stateObj.zoom;
            stateObj.panY += (originY - centerY) / stateObj.zoom;
            stateObj.zoom = targetZoom;

            updateTransform();
            return;
        }

        if (isDragging) {
            isDragging = false;
            bgElement.style.cursor = 'grab';
        }
    };

    container.addEventListener('mousedown', startDrag);
    container.addEventListener('touchstart', startDrag, { passive: false });
    window.addEventListener('mousemove', onDrag);
    window.addEventListener('touchmove', onDrag, { passive: false });
    window.addEventListener('mouseup', stopDrag);
    window.addEventListener('touchend', stopDrag);

    // การซูมรูป (Zoom ผ่านลูกกลิ้งเมาส์)
    container.addEventListener('wheel', (e) => {
        e.preventDefault(); 
        const zoomStep = 0.15; // ปรับให้ซูมไวขึ้นเล็กน้อย
        stateObj.zoom -= Math.sign(e.deltaY) * zoomStep; 
        stateObj.zoom = Math.max(1, Math.min(5, stateObj.zoom)); // ลิมิตซูมที่ 1x - 5x
        
        updateTransform();
    }, { passive: false });
}

// ------------------------------------------------
// เซ็ตวันที่ปัจจุบันอัตโนมัติ
// ------------------------------------------------
window.addEventListener('DOMContentLoaded', () => {
    const dateInput = document.getElementById('input-date');
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    
    dateInput.value = `${yyyy}-${mm}-${dd}`;
    dateInput.dispatchEvent(new Event('input')); 
});

// ------------------------------------------------
// สลับโหมด ทั่วไป และ Before / After
// ------------------------------------------------
const tabGeneral = document.getElementById('tab-general');
const tabBA = document.getElementById('tab-ba');
const uploadGeneral = document.getElementById('upload-section-general');
const uploadBA = document.getElementById('upload-section-ba');
const reportContent = document.getElementById('report-content');

tabGeneral.addEventListener('click', () => {
    currentMode = 'general';
    tabGeneral.classList.add('active');
    tabBA.classList.remove('active');
    uploadGeneral.classList.remove('hidden');
    uploadBA.classList.add('hidden');
    
    renderGeneral(); 
});

tabBA.addEventListener('click', () => {
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

// ------------------------------------------------
// ฟังก์ชันกลางสำหรับอ่านไฟล์และบันทึกลง State Array
// ------------------------------------------------
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
            if (filesRead === fileArr.length) {
                renderCallback();
            }
        };
        reader.readAsDataURL(file);
    });
}

// ------------------------------------------------
// ระบบอัปโหลดและเรนเดอร์: โหมดทั่วไป
// ------------------------------------------------
document.getElementById('input-images-general').addEventListener('change', function(event) {
    if (currentMode !== 'general') return;
    handleFileUpload(event.target.files, stateGeneral, renderGeneral);
    event.target.value = ''; 
});

// ------------------------------------------------
// ระบบอัปโหลดและเรนเดอร์: โหมด Before/After
// ------------------------------------------------
document.getElementById('input-images-before').addEventListener('change', function(event) {
    if (currentMode !== 'ba') return;
    handleFileUpload(event.target.files, stateBefore, renderBA);
    event.target.value = '';
});

document.getElementById('input-images-after').addEventListener('change', function(event) {
    if (currentMode !== 'ba') return;
    handleFileUpload(event.target.files, stateAfter, renderBA);
    event.target.value = '';
});

// ------------------------------------------------
// จัดการฟอร์มข้อความและวันที่
// ------------------------------------------------
document.getElementById('input-date').addEventListener('input', function(event) {
    const dateVal = event.target.value;
    if (dateVal) {
        const [year, month, day] = dateVal.split('-');
        document.getElementById('prev-date').textContent = `${day}.${month}.${year}`;
    } else {
        document.getElementById('prev-date').textContent = 'วันที่';
    }
});

function setupTextBinding(inputId, previewId) {
    document.getElementById(inputId).addEventListener('input', function(event) {
        document.getElementById(previewId).textContent = event.target.value || '\u00A0';
    });
}
setupTextBinding('input-dept', 'prev-dept');
setupTextBinding('input-title', 'prev-title');

// ------------------------------------------------
// จัดการตำแหน่งข้อความ (ชิดซ้าย / ตรงกลาง)
// ------------------------------------------------
const btnAlignLeft = document.getElementById('btn-align-left');
const btnAlignCenter = document.getElementById('btn-align-center');
const prevTitleBox = document.getElementById('prev-title');

if (btnAlignLeft && btnAlignCenter && prevTitleBox) {
    btnAlignLeft.addEventListener('click', () => {
        // อัปเดตสถานะปุ่ม
        btnAlignLeft.classList.add('active');
        btnAlignCenter.classList.remove('active');
        // จัดข้อความชิดซ้าย
        prevTitleBox.style.textAlign = 'left';
    });

    btnAlignCenter.addEventListener('click', () => {
        // อัปเดตสถานะปุ่ม
        btnAlignCenter.classList.add('active');
        btnAlignLeft.classList.remove('active');
        // จัดข้อความตรงกลาง
        prevTitleBox.style.textAlign = 'center';
    });
}

// ------------------------------------------------
// Export รูปภาพ JPG (บังคับโหลดตรงบนคอม / แชร์บนมือถือ)
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

    // สร้างตัวแปรเช็กว่าเป็นหน้าจอมือถือ/แท็บเล็ตหรือไม่
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const exportScale = isMobile ? 1.5 : 2; 

    html2canvas(clonedElement, { scale: exportScale, useCORS: true, backgroundColor: "#ffffff", logging: false }).then(canvas => {
        
        canvas.toBlob(async function(blob) {
            const fileName = 'SCC_Report_' + new Date().getTime() + '.jpg';
            const file = new File([blob], fileName, { type: 'image/jpeg' });

            // เงื่อนไข: ถ้าเป็น "มือถือ" เครื่องถึงจะเด้งเมนูแชร์
            if (isMobile && navigator.share && navigator.canShare({ files: [file] })) {
                try {
                    await navigator.share({
                        files: [file],
                        title: 'SCC Report',
                    });
                } catch (error) {
                    console.log('ผู้ใช้ยกเลิกการแชร์ หรือแชร์ไม่สำเร็จ', error);
                }
            } 
            // เงื่อนไข: ถ้าเป็น "คอมพิวเตอร์" (หรือมือถือที่ไม่รองรับ) ให้ดาวน์โหลดลงเครื่องทันที!
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
            
            // คืนค่าหน่วยความจำและปุ่ม
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

// ------------------------------------------------
// ระบบเลือก Template (เปลี่ยนสีและโลโก้)
// ------------------------------------------------
document.querySelectorAll('.tpl-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        // อัปเดตปุ่ม Active
        document.querySelectorAll('.tpl-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');

        // ดึงค่า Template ที่เลือก
        currentTemplate = this.getAttribute('data-tpl');
        const tplData = templateConfig[currentTemplate];

        // เปลี่ยนสีพื้นหลัง Canvas 
        document.getElementById('report-canvas').style.backgroundColor = tplData.main;
        
        // เปลี่ยนโลโก้มุมขวาบน
        document.getElementById('course-logo').src = tplData.logo;
        
        // รีเรนเดอร์เพื่ออัปเดตสีพื้นหลัง (เฉพาะโหมดทั่วไปที่จะเปลี่ยนสีพื้นหลังช่องภาพ)
        if (currentMode === 'general') renderGeneral();
    });
});

// ------------------------------------------------
// ระบบเลือกเลย์เอาต์สำหรับ 2 รูป
// ------------------------------------------------
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
