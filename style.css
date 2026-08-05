:root {
    --primary-green: #035c36;
    --light-green: #0b7044;
    --bg-gray: #e6e6e6;
    --text-dark: #333;
}

body {
    font-family: 'Noto Sans Thai', 'Roboto', sans-serif;
    margin: 0;
    padding: 0;
    background-color: var(--bg-gray);
    height: 100vh;
    display: flex;
    flex-direction: column;
    overflow: hidden; 
}

/* --- Navbar --- */
.navbar {
    background-color: white;
    color: black;
    padding: 15px 30px;
    display: flex;
    align-items: center;
    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    z-index: 20;
}
.navbar .badge {
    background: white;
    color: black;
    box-shadow: 0 2px 5px #efbf04;
    font-weight: bold;
    padding: 5px 12px;
    border-radius: 4px;
    margin-right: 15px;
    font-size: 14px;
}
.navbar .title {
    font-weight: 600;
    font-size: 16px;
}

/* --- Main Layout --- */
.main-container {
    display: flex;
    flex-grow: 1;
    overflow: hidden;
}

/* --- Editor Panel (Left) --- */
.editor-panel {
    width: 350px;
    background: #ffffff;
    padding: 25px;
    box-sizing: border-box;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 20px;
    z-index: 10;
    box-shadow: 2px 0 10px rgba(0,0,0,0.05);
    flex-shrink: 0;
}
.editor-panel h2 {
    margin: 0;
    font-size: 18px;
    color: var(--text-dark);
}

.form-section {
    display: flex;
    flex-direction: column;
    gap: 10px;
}
.form-section label {
    font-size: 14px;
    font-weight: bold;
    color: #555;
}

/* Tabs */
.tabs {
    display: flex;
    gap: 10px;
}
.tab-btn {
    flex: 1;
    padding: 8px;
    border: 1px solid #ccc;
    background: white;
    color: #777;
    border-radius: 5px;
    cursor: pointer;
    font-size: 14px;
    font-family: 'Noto Sans Thai', 'Roboto', sans-serif;
}
.tab-btn.active {
    background: black;
    color: white;
    border-color: var(--primary-black);
    font-weight: bold;
    font-family: 'Noto Sans Thai', 'Roboto', sans-serif;
}

/* Inputs */
.input-row {
    display: flex;
    gap: 10px;
}
.input-row input {
    flex: 1;
    width: 100%;
}

input[type="text"], input[type="date"] {
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 5px;
    font-size: 14px;
    box-sizing: border-box;
    font-family: inherit;
}
textarea {
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 5px;
    font-size: 14px;
    font-family: 'Noto Sans Thai', 'Roboto', sans-serif;
    resize: none;
    height: 90px;
    line-height: 1.4;
    -webkit-tap-highlight-color: transparent;
}

/* Upload Area */
.upload-area {
    border: 2px dashed #ccc;
    border-radius: 8px;
    padding: 30px;
    text-align: center;
    cursor: pointer;
    background: #fafafa;
    color: #999;
    transition: all 0.2s;
    position: relative;
}
.upload-area:hover {
    border-color: var(--primary-green);
    background: #f0f7f3;
    color: var(--primary-green);
}
.upload-area input[type="file"] {
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    opacity: 0;
    cursor: pointer;
}
.upload-icon {
    font-size: 32px;
    margin-bottom: 5px;
}

/* ----------------------------------
   CSS รายชื่อไฟล์และปุ่มลบ 
   ---------------------------------- */
.file-list {
    display: flex;
    flex-direction: column;
    gap: 5px;
    margin-top: 5px;
}
.file-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #f5f5f5;
    padding: 6px 10px;
    border-radius: 5px;
    font-size: 12px;
    color: #333;
    border: 1px solid #ddd;
}
.file-name {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 80%;
}
.delete-file-btn {
    color: #ff4d4f;
    cursor: pointer;
    font-weight: bold;
    font-size: 14px;
}
.delete-file-btn:hover {
    color: #d9363e;
}

/* ปุ่มลบที่โชว์บนรูป Canvas */
.delete-slot-btn {
    position: absolute;
    top: 10px;
    right: 10px;
    background: rgba(0, 0, 0, 0.75);
    color: white;
    border: none;
    border-radius: 30%;
    width: 64px;
    height: 64px;
    font-size: 48px;
    cursor: pointer;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 5px rgba(0,0,0,0.3);
}
.delete-slot-btn:hover {
    background: rgba(255, 0, 0, 1);
}

/* ----------------------------------
   เพิ่มใหม่: กล่อง Selection ตอนลากครอป
   ---------------------------------- */
.crop-selection {
    position: absolute;
    border: 2px dashed #00ff00;
    background: rgba(0, 255, 0, 0.2);
    pointer-events: none; /* ห้ามให้เมาส์ไปโดนกล่องนี้ตอนลาก */
    z-index: 5;
    display: none;
}

/* Save Button */
.save-btn-container {
    display: flex;
    justify-content: flex-end;
    margin-top: 10px;
}
.save-btn {
    background-color: black;
    color: white;
    padding: 8px 20px;
    border: 2px solid black;
    border-radius: 20px;
    font-size: 12px;
    font-weight: bold;
    cursor: pointer;
    transition: 0.3s;
}
.save-btn:hover { background-color: white; color: black; }
.save-btn:disabled { background-color: #999; cursor: not-allowed; }

/* Utility Class */
.hidden { display: none !important; }

/* --- Preview Panel (Right) --- */
.preview-panel {
    flex-grow: 1;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    overflow: auto;
    padding: 40px;
    box-sizing: border-box;
}
.scale-container {
    transform: scale(0.5);
    transform-origin: top center;
}

/* --- Canvas Report (w1076 x h1521) --- */
#report-wrapper {
    display: flex;
    justify-content: center;
    transform-origin: top center;
}
#report-canvas {
    width: 1076px;
    height: 1521px;
    background-color: var(--primary-green);
    display: flex;
    flex-direction: column;
    box-shadow: 0 5px 20px rgba(0,0,0,0.15);
    flex-shrink: 0;
    box-sizing: border-box;
    text-rendering: geometricPrecision;
    font-variant-ligatures: none; 
}

/* Header Canvas */
.report-header {
    height: 128px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 32px;
    box-sizing: border-box;
    color: white;
    flex-shrink: 0;
}
.logo-text {
    font-family: 'Times New Roman', Times, serif;
    font-size: 32px;
    line-height: 1.1;
    letter-spacing: 1px;
}

/* Content Canvas (Dynamic Grid) */
.report-content {
    background-color: #d1dfd7; 
    flex-grow: 1;
    display: grid;
    gap: 10px;
    padding: 16px 32px;
    overflow: hidden; 
}

/* ----------------------------------
   โครงสร้างรูปภาพรองรับซูม / ครอป
   ---------------------------------- */
.img-slot {
    width: 100%;
    height: 100%;
    background-color: #fff;
    display: block;
    position: relative;
    overflow: hidden;
}
.img-bg {
    width: 100%;
    height: 100%;
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    transform-origin: center;
}

/* โซน Before / After CSS */
.section-before {
    background-color: #fce4e4; 
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 16px 32px;
}
.section-after {
    background-color: #ccffcc; 
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 16px 32px;
}
.badge-ba {
    padding: 8px 16px;
    border-radius: 12px;
    font-size: 20px;
    font-weight: bold;
    width: fit-content;
    margin-bottom: 10px;
}
.badge-before {
    background-color: #ff0000; 
    color: #ffffff;            
}
.badge-after {
    background-color: #00ff00; 
    color: #0369A1;            
}

/* Footer Canvas */
.report-footer {
    min-height: 200px;
    height: 250px;
    padding: 16px 32px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: flex-start;
    flex-shrink: 0; 
    gap: 15px; 
}
.title-box {
    background: white;
    padding: 10px 16px;
    border-radius: 8px; 
    font-size: 32px; 
    font-weight: bold;
    color: #111;
    min-height: 25px;
    line-height: 1.4; 
    white-space: pre-wrap;
    word-wrap: break-word;
    width: 100%; 
    max-width: 100%; 
    box-sizing: border-box;
}
.footer-meta {
    align-self: flex-end; 
    color: white;
    font-size: 30px;
    font-weight: bold;
}

/* --- Responsive สำหรับมือถือ --- */
@media (max-width: 768px) {
    body { overflow: auto; }
    .scale-container {
        width: 322.8px;
        height: 456.7px;
    }
    .main-container {
        flex-direction: column;
        overflow: visible;
    }
    .editor-panel {
        width: 100%;
        box-shadow: none;
        border-bottom: 1px solid #ddd;
    }
    .preview-panel {
        padding: 20px;
        overflow: visible;
    }
    #report-wrapper {
        transform: scale(0.55); 
        margin-bottom: -350px; 
    }
}

/* --- Template Buttons --- */
.template-tabs {
    display: flex;
    gap: 10px;
}
.tpl-btn {
    flex: 1;
    padding: 8px 0;
    color: white;
    border: 2px solid transparent;
    border-radius: 8px;
    font-size: 16px;
    font-weight: bold;
    cursor: pointer;
    opacity: 0.4;
    transition: all 0.2s;
}
.tpl-btn.active {
    opacity: 1;
    border-color: #333;
    transform: scale(1.05);
    box-shadow: 0 2px 5px rgba(0,0,0,0.3);
}

/* --- ปุ่มจัดเรียงรูปภาพ --- */
.move-file-btn {
    color: #888;
    cursor: pointer;
    font-size: 14px;
    padding: 2px 6px;
    background: #e9e9e9;
    border-radius: 4px;
    transition: 0.2s;
}
.move-file-btn:hover {
    color: white;
    background: var(--primary-green);
}

/* --- Modal สำหรับมือถือ --- */
.modal-overlay {
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0,0,0,0.9); z-index: 9999;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    padding: 20px; box-sizing: border-box;
}
.modal-text {
    color: white; font-size: 18px; font-weight: bold; margin-bottom: 15px; text-align: center;
}
.modal-img {
    max-width: 100%; max-height: 70vh; border: 2px solid white; border-radius: 8px; object-fit: contain;
}
.modal-btn {
    margin-top: 20px; padding: 12px 30px; background: white; color: var(--primary-green);
    border: none; border-radius: 20px; font-size: 16px; font-weight: bold; cursor: pointer;
}
