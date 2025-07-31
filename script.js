// Global Variables
let currentMood = null;
let isRecording = false;
let mediaRecorder = null;
let audioChunks = [];
let moodEntries = JSON.parse(localStorage.getItem('moodEntries')) || [];

// Mood Data
const moodData = {
    happy: {
        name: 'سعيد',
        color: '#10b981',
        animation: 'https://assets3.lottiefiles.com/packages/lf20_h9rxdqfb.json'
    },
    normal: {
        name: 'عادي',
        color: '#6b7280',
        animation: 'https://assets9.lottiefiles.com/packages/lf20_x62chJ.json'
    },
    sad: {
        name: 'حزين',
        color: '#3b82f6',
        animation: 'https://assets4.lottiefiles.com/packages/lf20_qh5z2fdq.json'
    },
    angry: {
        name: 'غاضب',
        color: '#ef4444',
        animation: 'https://assets1.lottiefiles.com/packages/lf20_wqypkwrb.json'
    },
    depressed: {
        name: 'مكتئب',
        color: '#8b5cf6',
        animation: 'https://assets2.lottiefiles.com/packages/lf20_jcikwtux.json'
    },
    relaxed: {
        name: 'مرتاح',
        color: '#06b6d4',
        animation: 'https://assets6.lottiefiles.com/packages/lf20_mjlh3hcy.json'
    }
};

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
    updateCurrentDate();
    loadHistory();
    loadStats();
    initializeSettings();
    setupImageUpload();
    
    // Check for stored dark mode preference
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
        document.getElementById('darkModeToggle').checked = true;
    }
    
    // Check for lock setting
    if (localStorage.getItem('lockEnabled') === 'true') {
        document.getElementById('lockToggle').checked = true;
    }
});

// Update Current Date
function updateCurrentDate() {
    const now = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        calendar: 'islamic'
    };
    document.getElementById('currentDate').textContent = now.toLocaleDateString('ar-EG', options);
}

// Page Navigation
function showPage(pageId) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Remove active class from all nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected page
    document.getElementById(pageId + 'Page').classList.add('active');
    
    // Add active class to corresponding nav button
    event.target.classList.add('active');
    
    // Load page-specific content
    if (pageId === 'history') {
        loadHistory();
    } else if (pageId === 'stats') {
        loadStats();
    }
}

// Mood Selection
function selectMood(mood) {
    currentMood = mood;
    const moodInfo = moodData[mood];
    
    // Add bounce animation to clicked card
    event.currentTarget.classList.add('bounce');
    
    setTimeout(() => {
        // Show entry page
        document.getElementById('homePage').classList.remove('active');
        document.getElementById('entryPage').classList.add('active');
        
        // Update selected mood display
        document.getElementById('selectedMoodName').textContent = moodInfo.name;
        
        // Add mood animation
        const animationContainer = document.getElementById('selectedMoodAnimation');
        animationContainer.innerHTML = `
            <lottie-player 
                src="${moodInfo.animation}" 
                background="transparent" 
                speed="1" 
                style="width: 100px; height: 100px;" 
                loop 
                autoplay>
            </lottie-player>
        `;
        
        // Clear previous form data
        document.getElementById('moodNote').value = '';
        document.getElementById('imagePreview').innerHTML = '';
        document.getElementById('audioPreview').innerHTML = '';
        
        // Remove bounce animation
        event.currentTarget.classList.remove('bounce');
    }, 300);
}

// Image Upload Setup
function setupImageUpload() {
    document.getElementById('imageUpload').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                document.getElementById('imagePreview').innerHTML = 
                    `<img src="${e.target.result}" alt="Preview" style="max-width: 100%; max-height: 200px; border-radius: 8px; margin-top: 10px;">`;
            };
            reader.readAsDataURL(file);
        }
    });
}

// Audio Recording
async function toggleRecording() {
    const recordBtn = document.querySelector('[onclick="toggleRecording()"]');
    const recordText = document.getElementById('recordText');
    
    if (!isRecording) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];
            
            mediaRecorder.ondataavailable = (event) => {
                audioChunks.push(event.data);
            };
            
            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                const audioUrl = URL.createObjectURL(audioBlob);
                document.getElementById('audioPreview').innerHTML = 
                    `<audio controls style="width: 100%; margin-top: 10px;">
                        <source src="${audioUrl}" type="audio/wav">
                    </audio>`;
                
                // Store audio data for saving
                recordBtn.audioData = audioUrl;
            };
            
            mediaRecorder.start();
            isRecording = true;
            recordBtn.classList.add('recording');
            recordText.textContent = 'إيقاف التسجيل';
            
        } catch (error) {
            alert('لا يمكن الوصول للميكروفون. تأكد من إعطاء الصلاحية.');
        }
    } else {
        mediaRecorder.stop();
        isRecording = false;
        recordBtn.classList.remove('recording');
        recordText.textContent = 'تسجيل صوت';
        
        // Stop all audio tracks
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
}

// Save Entry
function saveEntry() {
    if (!currentMood) {
        alert('يرجى اختيار المزاج أولاً');
        return;
    }
    
    const note = document.getElementById('moodNote').value;
    const imageElement = document.querySelector('#imagePreview img');
    const audioElement = document.querySelector('#audioPreview audio');
    
    const entry = {
        id: Date.now(),
        date: new Date().toISOString(),
        mood: currentMood,
        note: note,
        image: imageElement ? imageElement.src : null,
        audio: audioElement ? audioElement.src : null
    };
    
    moodEntries.unshift(entry);
    localStorage.setItem('moodEntries', JSON.stringify(moodEntries));
    
    // Show success message
    showNotification('تم حفظ مزاجك بنجاح! 🎉');
    
    // Return to home page
    setTimeout(() => {
        showPage('home');
        currentMood = null;
    }, 1500);
}

// Load History
function loadHistory() {
    const historyList = document.getElementById('historyList');
    
    if (moodEntries.length === 0) {
        historyList.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--text-muted);">
                <p>لا توجد إدخالات مزاجية بعد</p>
                <p>ابدأ بتسجيل مزاجك اليوم! 😊</p>
            </div>
        `;
        return;
    }
    
    historyList.innerHTML = moodEntries.map(entry => {
        const date = new Date(entry.date);
        const moodInfo = moodData[entry.mood];
        
        return `
            <div class="history-item">
                <div class="history-date">
                    ${date.toLocaleDateString('ar-EG', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                    })}
                </div>
                <div class="history-mood">
                    <div style="width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; background: ${moodInfo.color}20; border-radius: 50%; color: ${moodInfo.color}; font-weight: bold;">
                        ${moodInfo.name.charAt(0)}
                    </div>
                    <span style="font-weight: 600; color: ${moodInfo.color};">${moodInfo.name}</span>
                </div>
                ${entry.note ? `<div class="history-note">${entry.note}</div>` : ''}
                <div class="history-media">
                    ${entry.image ? `<img src="${entry.image}" alt="صورة المزاج" onclick="showImageModal('${entry.image}')">` : ''}
                    ${entry.audio ? `<audio controls><source src="${entry.audio}" type="audio/wav"></audio>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// Load Statistics
function loadStats() {
    const canvas = document.getElementById('moodChart');
    const ctx = canvas.getContext('2d');
    const statsContainer = document.getElementById('moodStats');
    
    // Count moods
    const moodCounts = {};
    Object.keys(moodData).forEach(mood => {
        moodCounts[mood] = moodEntries.filter(entry => entry.mood === mood).length;
    });
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (moodEntries.length === 0) {
        ctx.fillStyle = 'var(--text-muted)';
        ctx.font = '16px Cairo';
        ctx.textAlign = 'center';
        ctx.fillText('لا توجد بيانات للعرض', canvas.width / 2, canvas.height / 2);
        
        statsContainer.innerHTML = `
            <div style="text-align: center; padding: 20px; color: var(--text-muted);">
                ابدأ بتسجيل مزاجك لرؤية الإحصائيات
            </div>
        `;
        return;
    }
    
    // Draw simple bar chart
    const maxCount = Math.max(...Object.values(moodCounts));
    const barWidth = canvas.width / Object.keys(moodData).length;
    const colors = Object.values(moodData).map(mood => mood.color);
    
    Object.keys(moodData).forEach((mood, index) => {
        const count = moodCounts[mood];
        const barHeight = (count / maxCount) * (canvas.height - 60);
        const x = index * barWidth + 20;
        const y = canvas.height - barHeight - 30;
        
        // Draw bar
        ctx.fillStyle = colors[index];
        ctx.fillRect(x, y, barWidth - 40, barHeight);
        
        // Draw count
        ctx.fillStyle = '#333';
        ctx.font = '14px Cairo';
        ctx.textAlign = 'center';
        ctx.fillText(count.toString(), x + (barWidth - 40) / 2, y - 10);
        
        // Draw mood name
        ctx.save();
        ctx.translate(x + (barWidth - 40) / 2, canvas.height - 10);
        ctx.rotate(-Math.PI / 4);
        ctx.fillText(moodData[mood].name, 0, 0);
        ctx.restore();
    });
    
    // Update stats display
    statsContainer.innerHTML = Object.keys(moodData).map(mood => {
        const count = moodCounts[mood];
        const percentage = moodEntries.length > 0 ? Math.round((count / moodEntries.length) * 100) : 0;
        
        return `
            <div class="stat-item">
                <span class="stat-number">${count}</span>
                <div class="stat-label">${moodData[mood].name}</div>
                <div style="font-size: 0.8rem; color: var(--text-muted);">${percentage}%</div>
            </div>
        `;
    }).join('');
}

// Settings Functions
function initializeSettings() {
    // Load saved settings
    const darkMode = localStorage.getItem('darkMode') === 'true';
    const lockEnabled = localStorage.getItem('lockEnabled') === 'true';
    
    document.getElementById('darkModeToggle').checked = darkMode;
    document.getElementById('lockToggle').checked = lockEnabled;
    
    if (darkMode) {
        document.body.classList.add('dark-mode');
    }
}

function toggleDarkMode() {
    const isDarkMode = document.getElementById('darkModeToggle').checked;
    
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
    
    localStorage.setItem('darkMode', isDarkMode);
}

function toggleLock() {
    const isLockEnabled = document.getElementById('lockToggle').checked;
    localStorage.setItem('lockEnabled', isLockEnabled);
    
    if (isLockEnabled) {
        showNotification('تم تفعيل قفل التطبيق');
    } else {
        showNotification('تم إلغاء قفل التطبيق');
    }
}

function clearAllData() {
    if (confirm('هل أنت متأكد من حذف جميع البيانات؟ لا يمكن التراجع عن هذا الإجراء.')) {
        localStorage.removeItem('moodEntries');
        moodEntries = [];
        loadHistory();
        loadStats();
        showNotification('تم حذف جميع البيانات');
    }
}

// Utility Functions
function showNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--primary-color);
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: var(--shadow-lg);
        z-index: 1000;
        font-family: Cairo, sans-serif;
        font-weight: 600;
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Animate out and remove
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

function showImageModal(imageSrc) {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        cursor: pointer;
    `;
    
    const img = document.createElement('img');
    img.src = imageSrc;
    img.style.cssText = `
        max-width: 90%;
        max-height: 90%;
        border-radius: 8px;
        box-shadow: var(--shadow-lg);
    `;
    
    modal.appendChild(img);
    document.body.appendChild(modal);
    
    modal.addEventListener('click', () => {
        document.body.removeChild(modal);
    });
}

// Export/Import Functions (for future use)
function exportData() {
    const dataStr = JSON.stringify(moodEntries, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `moodyme-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
}

function importData(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const importedData = JSON.parse(e.target.result);
                if (Array.isArray(importedData)) {
                    moodEntries = importedData;
                    localStorage.setItem('moodEntries', JSON.stringify(moodEntries));
                    loadHistory();
                    loadStats();
                    showNotification('تم استيراد البيانات بنجاح');
                }
            } catch (error) {
                alert('خطأ في قراءة الملف');
            }
        };
        reader.readAsText(file);
    }
}

// Service Worker Registration (for offline support)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js')
            .then(function(registration) {
                console.log('ServiceWorker registration successful');
            })
            .catch(function(err) {
                console.log('ServiceWorker registration failed: ', err);
            });
    });
}

// PWA Install Prompt
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    // Show custom install button if needed
    const installBtn = document.createElement('button');
    installBtn.textContent = 'تثبيت التطبيق';
    installBtn.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 20px;
        background: var(--primary-color);
        color: white;
        border: none;
        padding: 10px 15px;
        border-radius: 8px;
        font-family: Cairo, sans-serif;
        cursor: pointer;
        z-index: 1000;
    `;
    
    installBtn.addEventListener('click', () => {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('User accepted the install prompt');
            }
            deferredPrompt = null;
            document.body.removeChild(installBtn);
        });
    });
    
    document.body.appendChild(installBtn);
    
    // Auto-hide after 10 seconds
    setTimeout(() => {
        if (document.body.contains(installBtn)) {
            document.body.removeChild(installBtn);
        }
    }, 10000);
});

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Alt + 1-4 for quick navigation
    if (e.altKey) {
        switch(e.key) {
            case '1':
                showPage('home');
                break;
            case '2':
                showPage('history');
                break;
            case '3':
                showPage('stats');
                break;
            case '4':
                showPage('settings');
                break;
        }
    }
    
    // Escape to go back
    if (e.key === 'Escape') {
        showPage('home');
    }
});

// Touch gestures for mobile
let touchStartX = 0;
let touchEndX = 0;

document.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
});

document.addEventListener('touchend', e => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
});

function handleSwipe() {
    const swipeThreshold = 50;
    const diff = touchStartX - touchEndX;
    
    if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0) {
            // Swipe left - next page
            // Implement page navigation logic
        } else {
            // Swipe right - previous page
            // Implement page navigation logic
        }
    }
}