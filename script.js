// কনফিগারেশন - Google Sheets API এবং Sheet IDs
const CONFIG = {
    API_KEY: 'AIzaSyCiEgyS_hZLOPYfntM2b5imvAx9iIWBSHY',
    SHEET_IDS: [
        '1ia2pkU2Zx0IKF4XI4Os_pVZfdlFqb815IwkDmc9IBpc',
        '1clRNb9t9_w0ZaqOtRq6uGBV2_NVVG1GpwzShYLBaAho',
        '110mm_LHmzRXTJoBiNfG0oym1JzQv6W3BMDdfSs3loTw',
        '1l8bauZWJn3a1vOqI_LG1rFscaRsGVASSjDzpb7AJsiE',
        '1UsbkB0pvCtX378db8N0q-weHncWKvSN5vhj0mUJpFnU',
        '1jA7HEgX6I0Tw-yYmsMyDa6LtjNo2W23nz7a3GJpf7VM',
        '13ZFdfDjOlw4R4_qu0NhIuYwSw1Bp29eq6-dGtlySVhg'
    ],
    SHEET_NAME: 'Sheet1'
};

// DOM Elements - HTML এলিমেন্ট গুলো
const admitNumberInput = document.getElementById('admitNumber');
const loadingSection = document.getElementById('loadingSection');
const resultSection = document.getElementById('resultSection');
const errorSection = document.getElementById('errorSection');
const resultCard = document.getElementById('resultCard');
const systemNote = document.getElementById('systemNote');
const qrNotice = document.getElementById('qrNotice');
const qrModal = document.getElementById('qrModal');

// Global variables - গ্লোবাল ভেরিয়েবল
let currentResult = null;
let isQRSearch = false; // QR কোড থেকে এসেছে কিনা ট্র্যাক করার জন্য

// Event Listeners - ইভেন্ট লিসেনার সেটআপ
document.addEventListener('DOMContentLoaded', function() {
    // URL থেকে প্যারামিটার চেক করা
    checkURLParameters();
    
    // Enter key সাপোর্ট search input এর জন্য
    admitNumberInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchResult();
        }
    });
    
    // Input validation - শুধুমাত্র alphanumeric অক্ষর গ্রহণ করা
    admitNumberInput.addEventListener('input', function(e) {
        e.target.value = e.target.value.replace(/[^a-zA-Z0-9]/g, '');
    });

    // QR example URL সেট করা
    updateQRExampleUrl();
});

// URL প্যারামিটার চেক করার ফাংশন
function checkURLParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const rollNumber = urlParams.get('roll');
    
    if (rollNumber) {
        // QR কোড থেকে এসেছে
        isQRSearch = true;
        
        // Input ফিল্ডে roll number সেট করা
        admitNumberInput.value = rollNumber;
        
        // অটোমেটিক সার্চ শুরু করা
        setTimeout(() => {
            searchResult();
        }, 1000); // ১ সেকেন্ড পর সার্চ করা যাতে ব্যবহারকারী বুঝতে পারে
    }
}

// QR Notice দেখানোর ফাংশন (অপ্রয়োজনীয় - ব্যবহার করা হবে না)
function showQRNotice() {
    // QR notice দেখানো হবে না
}

// QR Example URL আপডেট করার ফাংশন
function updateQRExampleUrl() {
    const currentDomain = window.location.origin;
    const currentPath = window.location.pathname;
    const exampleUrl = `${currentDomain}${currentPath}?roll=101`;
    
    const qrExampleElement = document.getElementById('qrExampleUrl');
    if (qrExampleElement) {
        qrExampleElement.textContent = exampleUrl;
    }
}

// Example URL কপি করার ফাংশন
function copyExampleUrl() {
    const currentDomain = window.location.origin;
    const currentPath = window.location.pathname;
    const exampleUrl = `${currentDomain}${currentPath}?roll=আপনার_রোল_নম্বার`;
    
    navigator.clipboard.writeText(exampleUrl).then(() => {
        showMessage('উদাহরণ URL কপি হয়েছে!', 'success');
    }).catch(() => {
        showMessage('URL কপি করতে সমস্যা হয়েছে', 'error');
    });
}

// System Generated Note তৈরি করার ফাংশন
function generateSystemNote(rollNumber) {
    return `
        <div class="system-note-footer">
            <p><i class="fas fa-info-circle"></i> This is a system generated certificate no signature required</p>
        </div>
    `;
}

// মূল সার্চ ফাংশন
async function searchResult() {
    const admitNumber = admitNumberInput.value.trim();
    
    // ভ্যালিডেশন
    if (!admitNumber) {
        showError('দয়া করে একটি রোল নাম্বার লিখুন।');
        return;
    }
    
    if (admitNumber.length < 3) {
        showError('রোল নাম্বার কমপক্ষে ৩ অক্ষরের হতে হবে।');
        return;
    }
    
    // লোডিং দেখানো
    showLoading();
    
    try {
        const result = await fetchStudentData(admitNumber);
        if (result) {
            showResult(result);
            
            // QR সার্চ সফল হলে URL ক্লিয়ার করা (ঐচ্ছিক)
            if (isQRSearch) {
                // History API দিয়ে URL থেকে প্যারামিটার সরানো
                const newUrl = window.location.origin + window.location.pathname;
                window.history.replaceState({}, document.title, newUrl);
                isQRSearch = false;
            }
        } else {
            showError();
        }
    } catch (error) {
        console.error('Error searching result:', error);
        showError('ডেটা লোড করতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।');
    }
}

// Google Sheets থেকে ডেটা আনার ফাংশন
async function fetchStudentData(admitNumber) {
    // সব Sheet ID তে সার্চ করা
    for (let i = 0; i < CONFIG.SHEET_IDS.length; i++) {
        const sheetId = CONFIG.SHEET_IDS[i];
        // A-L কলাম পর্যন্ত ডেটা আনা (ইমেজ সহ)
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${CONFIG.SHEET_NAME}!A:L?key=${CONFIG.API_KEY}`;
        
        try {
            const response = await fetch(url);
            const data = await response.json();
            
            if (!data.values || data.values.length < 2) {
                console.log(`Sheet ${i + 1} এ কোনো ডেটা পাওয়া যায়নি`);
                continue; // পরবর্তী sheet এ যাওয়া
            }
            
            const headers = data.values[0];
            const rows = data.values.slice(1);
            
            // এই sheet এ admit number খোঁজা
            for (const row of rows) {
                if (row[0] && row[0].toString().toLowerCase() === admitNumber.toLowerCase()) {
                    // ইমেজ URL প্রসেস করা - বিভিন্ন ধরনের লিংক সাপোর্ট
                    let photoUrl = row[11] || '';
                    
                    if (photoUrl) {
                        // Google Drive লিংক প্রসেসিং
                        if (photoUrl.includes('drive.google.com')) {
                            // বিভিন্ন ধরনের Google Drive লিংক হ্যান্ডল করা
                            let fileIdMatch = photoUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
                            if (!fileIdMatch) {
                                fileIdMatch = photoUrl.match(/id=([a-zA-Z0-9-_]+)/);
                            }
                            if (fileIdMatch) {
                                photoUrl = `https://drive.google.com/uc?export=view&id=${fileIdMatch[1]}`;
                            }
                        }
                        // Google Photos লিংক প্র-u েসিং
                        else if (photoUrl.includes('photos.google.com')) {
                            // Google Photos লিংকে =w500-h600-no যোগ করা ভাল quality এর জন্য
                            if (!photoUrl.includes('=w')) {
                                photoUrl += '=w500-h600-no';
                            }
                        }
                        // অন্যান্য ইমেজ হোস্টিং সাইট
                        else if (photoUrl.includes('imgur.com') && !photoUrl.includes('.jpg') && !photoUrl.includes('.png')) {
                            // Imgur লিংকে .jpg extension যোগ করা
                            photoUrl += '.jpg';
                        }
                    }
                    
                    return {
                        rollNumber: row[0] || 'N/A',
                        studentName: row[1] || 'N/A',
                        fatherName: row[2] || 'N/A',
                        motherName: row[3] || 'N/A',
                        board: row[4] || 'N/A',
                        group: row[5] || 'N/A',
                        result: row[6] || 'N/A',
                        institution: row[7] || 'N/A',
                        session: row[8] || 'N/A',
                        dob: row[9] || 'N/A',
                        gender: row[10] || 'N/A', // K কলাম = Gender
                        studentPhoto: photoUrl, // L কলাম = প্রসেসড ইমেজ URL
                        sheetNumber: i + 1 // কোন sheet থেকে ডেটা এসেছে ট্র্যাক করা
                    };
                }
            }
            
        } catch (error) {
            console.error(`Sheet ${i + 1} থেকে ডেটা আনতে সমস্যা:`, error);
            // এই sheet এ সমস্যা হলেও পরবর্তী sheet এ চেষ্টা চালিয়ে যাওয়া
            continue;
        }
    }
    
    return null; // কোনো sheet এ পাওয়া যায়নি
}

// লোডিং স্টেট দেখানোর ফাংশন
function showLoading() {
    hideAllSections();
    loadingSection.style.display = 'block';
    loadingSection.classList.add('fade-in');
}

// রেজাল্ট দেখানোর ফাংশন
function showResult(result) {
    currentResult = result;
    hideAllSections();
    
    // ছাত্রের ছবি এলিমেন্ট তৈরি করা
    const studentPhotoHTML = result.studentPhoto ? 
        `<div class="student-photo">
            <img src="${result.studentPhoto}" 
                 alt="Student Photo" 
                 id="studentPhotoImg"
                 onerror="handleImageError(this)"
                 onload="handleImageLoad(this)">
            <div class="photo-loading" id="photoLoading">
                <i class="fas fa-spinner fa-spin"></i>
                <span>ছবি লোড হচ্ছে...</span>
            </div>
            <div class="photo-error" id="photoError" style="display: none;">
                <i class="fas fa-user"></i>
                <span>ছবি উপলব্ধ নেই</span>
            </div>
        </div>` : 
        `<div class="student-photo">
            <div class="photo-placeholder">
                <i class="fas fa-user"></i>
                <span>ছবি উপলব্ধ নেই</span>
            </div>
        </div>`;
    
    // রেজাল্ট HTML তৈরি করা - উন্নত টেবিল ফরম্যাট ইমেজ সহ
    const resultHTML = `
        <div class="result-header-info">
            <div class="result-title">
                <h3> SCIENCE & INFORMATION TECHNOLOGY-FOUNDATION</h3>
                <p>WEB BASED RESULT PUBLICATION SYSTEM</p>
                <p>PARAMEDICAL/DMA/LMAF EXAMINATION</p>
            </div>
        </div>
        <div class="result-content-wrapper">
            ${studentPhotoHTML}
            <div class="result-table">
                <table class="result-data-table">
                    <tr>
                        <td class="label">Roll No</td>
                        <td class="value">${result.rollNumber}</td>
                        <td class="label">Gender</td>
                        <td class="value">${result.gender}</td>
                    </tr>
                    <tr>
                        <td class="label">Name of Student</td>
                        <td class="value">${result.studentName}</td>
                        <td class="label">Date of Birth</td>
                        <td class="value">${result.dob}</td>
                    </tr>
                    <tr>
                        <td class="label">Father's Name</td>
                        <td class="value">${result.fatherName}</td>
                        <td class="label">Board</td>
                        <td class="value">${result.board}</td>
                    </tr>
                    <tr>
                        <td class="label">Mother's Name</td>
                        <td class="value">${result.motherName}</td>
                        <td class="label">Coure</td>
                        <td class="value">${result.group}</td>
                    </tr>
                    <tr>
                        <td class="label">Institution</td>
                        <td class="value">${result.institution}</td>
                        <td class="label">Session</td>
                        <td class="value">${result.session}</td>
                    </tr>
                    <tr>
                        <td class="label result-grade" style="background: #e8f5e8;">Result</td>
                        <td class="value result-grade" style="background: #e8f5e8;">${result.result}</td>
                        <td class="label" style="background: #f0f0f0;"></td>
                        <td class="value" style="background: #f0f0f0;"></td>
                    </tr>
                </table>
            </div>
        </div>
    `;
    
    // System Note তৈরি করা
    const systemNoteHTML = generateSystemNote(result.rollNumber);
    
    // Result এবং System Note সেট করা
    resultCard.innerHTML = resultHTML;
    systemNote.innerHTML = systemNoteHTML;
    
    // Result section দেখানো
    resultSection.style.display = 'block';
    resultSection.classList.add('fade-in');
    
    // Scroll to result
    resultSection.scrollIntoView({ behavior: 'smooth' });
}

// Error দেখানোর ফাংশন
function showError(message = 'দয়া করে আপনার রোল নাম্বার পুনরায় চেক করুন এবং আবার চেষ্টা করুন।') {
    hideAllSections();
    document.getElementById('errorMessage').textContent = message;
    errorSection.style.display = 'block';
    errorSection.classList.add('fade-in');
}

// সকল সেকশন লুকানোর ফাংশন
function hideAllSections() {
    [loadingSection, resultSection, errorSection].forEach(section => {
        section.style.display = 'none';
        section.classList.remove('fade-in');
    });
}

// ছবি লোড হলে চালানোর ফাংশন
function handleImageLoad(img) {
    const photoLoading = document.getElementById('photoLoading');
    const photoError = document.getElementById('photoError');
    
    if (photoLoading) photoLoading.style.display = 'none';
    if (photoError) photoError.style.display = 'none';
    img.style.display = 'block';
}

// ছবি লোড error এর ফাংশন
function handleImageError(img) {
    const photoLoading = document.getElementById('photoLoading');
    const photoError = document.getElementById('photoError');
    
    if (photoLoading) photoLoading.style.display = 'none';
    if (photoError) {
        photoError.style.display = 'flex';
        photoError.innerHTML = `
            <i class="fas fa-user"></i>
            <span>ছবি লোড করা যায়নি</span>
            <small>ছবিটি হয়তো সরানো হয়েছে বা লিংক ভুল</small>
        `;
    }
    img.style.display = 'none';
}

// রিসেট সার্চ ফাংশন
function resetSearch() {
    hideAllSections();
    admitNumberInput.value = '';
    admitNumberInput.focus();
    currentResult = null;
    
    // স্ক্রল টপে নিয়ে যাওয়া
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// প্রিন্ট ফাংশন
function printResult() {
    if (!currentResult) return;
    
    // Create a temporary print window
    const printWindow = window.open('', '_blank');
    
    // Student photo HTML for print
    const studentPhotoHTML = currentResult.studentPhoto ? 
        `<div class="student-photo-print">
            <img src="${currentResult.studentPhoto}" alt="Student Photo" />
        </div>` : 
        `<div class="student-photo-print">
            <div class="photo-placeholder-print">Photo Not Available</div>
        </div>`;
    
    const printHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>পরীক্ষার ফলাফল - ${currentResult.rollNumber}</title>
            <style>
                body { font-family: 'Arial', sans-serif; margin: 20px; }
                .print-header { text-align: center; margin-bottom: 30px; background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%) !important; color: white !important; padding: 20px; border-radius: 10px; -webkit-print-color-adjust: exact !important; color-adjust: exact !important; }
                .print-header h1 { color: white !important; margin-bottom: 10px; font-size: 1.5rem; }
                .print-header p { color: rgba(255,255,255,0.9) !important; margin: 5px 0; }
                .print-content { max-width: 800px; margin: 0 auto; }
                .result-content-wrapper { display: flex; gap: 30px; align-items: flex-start; margin-bottom: 30px; }
                .student-photo-print { width: 200px; height: 250px; border: 3px solid #ddd; border-radius: 10px; overflow: hidden; flex-shrink: 0; }
                .student-photo-print img { width: 100%; height: 100%; object-fit: cover; }
                .photo-placeholder-print { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: #f8f9fa !important; color: #666; font-weight: bold; -webkit-print-color-adjust: exact !important; color-adjust: exact !important; }
                .result-table-container { flex: 1; }
                .result-table { width: 100%; border-collapse: collapse; }
                .result-table td { padding: 12px; border: 1px solid #ddd; }
                .label { background: #f5f5f5 !important; font-weight: bold; width: 30%; -webkit-print-color-adjust: exact !important; color-adjust: exact !important; }
                .value { background: white !important; -webkit-print-color-adjust: exact !important; color-adjust: exact !important; }
                .system-note { margin-top: 30px; padding: 15px; background: #f8f9fa !important; border-radius: 8px; text-align: center; border-left: 5px solid #28a745 !important; -webkit-print-color-adjust: exact !important; color-adjust: exact !important; }
                .note-text { color: #495057; font-style: italic; }
                @media print {
                    * { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; }
                    body { margin: 0; }
                    .print-content { max-width: none; }
                    .print-header { background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%) !important; color: white !important; }
                    .print-header h1, .print-header p { color: white !important; }
                }
            </style>
        </head>
        <body>
            <div class="print-content">
                <div class="print-header">
                    <h1> SCIENCE & INFORMATION TECHNOLOGY-FOUNDATION</h1>
                    <p>WEB BASED RESULT PUBLICATION SYSTEM  </p>
                    <p>PARAMEDICAL/DMA/LMAF EXAMINATION</p>
                </div>
                <div class="result-content-wrapper">
                    ${studentPhotoHTML}
                    <div class="result-table-container">
                        <table class="result-table">
                            <tr><td class="label">Roll No</td><td class="value">${currentResult.rollNumber}</td></tr>
                            <tr><td class="label">Name of Student</td><td class="value">${currentResult.studentName}</td></tr>
                            <tr><td class="label">Father's Name</td><td class="value">${currentResult.fatherName}</td></tr>
                            <tr><td class="label">Mother's Name</td><td class="value">${currentResult.motherName}</td></tr>
                            <tr><td class="label">Institution</td><td class="value">${currentResult.institution}</td></tr>
                            <tr><td class="label">Board</td><td class="value">${currentResult.board}</td></tr>
                            <tr><td class="label">Course</td><td class="value">${currentResult.group}</td></tr>
                            <tr><td class="label">Session</td><td class="value">${currentResult.session}</td></tr>
                            <tr><td class="label">Date of Birth</td><td class="value">${currentResult.dob}</td></tr>
                            <tr><td class="label">Gender</td><td class="value">${currentResult.gender}</td></tr>
                            <tr><td class="label">Result</td><td class="value"><strong>${currentResult.result}</strong></td></tr>
                        </table>
                    </div>
                </div>
                <div class="system-note">
                    <div class="note-text">This is a system generated certificate no signature required</div>
                </div>
            </div>
            <script>
                window.onload = function() {
                    window.print();
                    window.onafterprint = function() {
                        window.close();
                    }
                }
            </script>
        </body>
        </html>
    `;
    
    printWindow.document.write(printHTML);
    printWindow.document.close();
}

// QR কোড তৈরি করার ফাংশন
async function generateQR() {
    if (!currentResult) return;
    
    const currentDomain = window.location.origin;
    const currentPath = window.location.pathname;
    const qrUrl = `${currentDomain}${currentPath}?roll=${currentResult.rollNumber}`;
    
    // QR URL input ফিল্ড আপডেট করা
    document.getElementById('qrUrlInput').value = qrUrl;
    
    // QR Code তৈরি করা
    const qrCodeContainer = document.getElementById('qrCodeImage');
    qrCodeContainer.innerHTML = ''; // পুরাতন QR কোড ক্লিয়ার করা
    
    // Loading indicator
    qrCodeContainer.innerHTML = '<div class="qr-loading"><i class="fas fa-spinner fa-spin"></i> QR কোড তৈরি হচ্ছে...</div>';
    
    // Multiple QR code generation methods with fallbacks
    let qrGenerated = false;
    
    // Method 1: QRCode.js library
    if (typeof QRCode !== 'undefined' && !qrGenerated) {
        try {
            const canvas = document.createElement('canvas');
            await QRCode.toCanvas(canvas, qrUrl, {
                width: 256,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
            });
            qrCodeContainer.innerHTML = '';
            qrCodeContainer.appendChild(canvas);
            qrGenerated = true;
            console.log('QR Code generated using QRCode.js');
        } catch (error) {
            console.error('QRCode.js failed:', error);
        }
    }
    
    // Method 2: QRious library
    if (typeof QRious !== 'undefined' && !qrGenerated) {
        try {
            const canvas = document.createElement('canvas');
            const qr = new QRious({
                element: canvas,
                value: qrUrl,
                size: 256,
                background: '#ffffff',
                foreground: '#000000'
            });
            qrCodeContainer.innerHTML = '';
            qrCodeContainer.appendChild(canvas);
            qrGenerated = true;
            console.log('QR Code generated using QRious');
        } catch (error) {
            console.error('QRious failed:', error);
        }
    }
    
    // Method 3: KJUA library
    if (typeof kjua !== 'undefined' && !qrGenerated) {
        try {
            const qrElement = kjua({
                text: qrUrl,
                size: 256,
                fill: '#000000',
                back: '#ffffff',
                mode: 'plain',
                mSize: 10,
                mPosX: 50,
                mPosY: 50,
                fontname: 'sans',
                fontcolor: '#000000'
            });
            qrCodeContainer.innerHTML = '';
            qrCodeContainer.appendChild(qrElement);
            qrGenerated = true;
            console.log('QR Code generated using KJUA');
        } catch (error) {
            console.error('KJUA failed:', error);
        }
    }
    
    // Method 4: Google Charts API (fallback)
    if (!qrGenerated) {
        try {
            const img = document.createElement('img');
            const encodedUrl = encodeURIComponent(qrUrl);
            img.src = `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodedUrl}`;
            img.alt = 'QR Code';
            img.style.border = '2px solid #ddd';
            img.style.borderRadius = '8px';
            
            img.onload = function() {
                qrCodeContainer.innerHTML = '';
                qrCodeContainer.appendChild(img);
                qrGenerated = true;
                console.log('QR Code generated using QR Server API');
            };
            
            img.onerror = function() {
                console.error('QR Server API failed');
                fallbackToGoogleCharts();
            };
            
        } catch (error) {
            console.error('QR Server API error:', error);
            fallbackToGoogleCharts();
        }
    }
    
    // Method 5: Google Charts API (final fallback)
    function fallbackToGoogleCharts() {
        try {
            const img = document.createElement('img');
            const encodedUrl = encodeURIComponent(qrUrl);
            img.src = `https://chart.googleapis.com/chart?chs=256x256&cht=qr&chl=${encodedUrl}`;
            img.alt = 'QR Code';
            img.style.border = '2px solid #ddd';
            img.style.borderRadius = '8px';
            
            img.onload = function() {
                qrCodeContainer.innerHTML = '';
                qrCodeContainer.appendChild(img);
                qrGenerated = true;
                console.log('QR Code generated using Google Charts API');
            };
            
            img.onerror = function() {
                qrCodeContainer.innerHTML = `
                    <div class="qr-error">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>QR কোড তৈরি করতে সমস্যা হয়েছে</p>
                        <small>ইন্টারনেট সংযোগ চেক করুন</small>
                    </div>
                `;
                console.error('All QR generation methods failed');
            };
            
        } catch (error) {
            console.error('Google Charts API error:', error);
            qrCodeContainer.innerHTML = `
                <div class="qr-error">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>QR কোড তৈরি করতে সমস্যা হয়েছে</p>
                    <small>পরে আবার চেষ্টা করুন</small>
                </div>
            `;
        }
    }
    
    // Modal দেখানো
    qrModal.style.display = 'flex';
    qrModal.classList.add('fade-in');
}

// QR Modal বন্ধ করার ফাংশন
function closeQRModal() {
    qrModal.style.display = 'none';
    qrModal.classList.remove('fade-in');
}

// QR URL কপি করার ফাংশন
function copyQRUrl() {
    const qrUrlInput = document.getElementById('qrUrlInput');
    qrUrlInput.select();
    qrUrlInput.setSelectionRange(0, 99999); // মোবাইলের জন্য
    
    navigator.clipboard.writeText(qrUrlInput.value).then(() => {
        showMessage('URL কপি হয়েছে!', 'success');
    }).catch(() => {
        // Fallback for older browsers
        document.execCommand('copy');
        showMessage('URL কপি হয়েছে!', 'success');
    });
}

// Message দেখানোর ফাংশন
function showMessage(message, type = 'info') {
    // Create toast message
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    // Add to body
    document.body.appendChild(toast);
    
    // Show toast
    setTimeout(() => toast.classList.add('show'), 100);
    
    // Hide and remove toast
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
}

// Modal বাইরে ক্লিক করলে বন্ধ করা
qrModal.addEventListener('click', function(e) {
    if (e.target === qrModal) {
        closeQRModal();
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Escape key to close modal
    if (e.key === 'Escape' && qrModal.style.display === 'flex') {
        closeQRModal();
    }
    
    // Ctrl+P to print (if result is shown)
    if (e.ctrlKey && e.key === 'p' && currentResult) {
        e.preventDefault();
        printResult();
    }
});

// Add fade-in animation class when elements are shown
function addFadeInAnimation() {
    const style = document.createElement('style');
    style.textContent = `
        .fade-in {
            animation: fadeIn 0.5s ease-in;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .toast {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #333;
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            display: flex;
            align-items: center;
            gap: 10px;
            z-index: 10000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        }
        
        .toast.show {
            transform: translateX(0);
        }
        
        .toast-success {
            background: #4CAF50;
        }
        
        .toast-error {
            background: #f44336;
        }
    `;
    document.head.appendChild(style);
}

// Initialize fade-in animations
addFadeInAnimation();

