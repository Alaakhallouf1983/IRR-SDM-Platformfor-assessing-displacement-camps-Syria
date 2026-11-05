// ===================================
// IRR-SDM Platform - JavaScript
// Enhanced Version with Excel Integration
// ===================================

let map;
let markers = [];
let campsData = [];
let allCampsFromExcel = [];
let selectedCamp = null;
let analyticsChart = null;

// ===================================
// تهيئة المنصة عند تحميل الصفحة
// ===================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 بدء تحميل منصة IRR-SDM...');
    
    // تهيئة الخريطة
    initializeMap();
    
    // تحميل قائمة المخيمات من الخادم
    loadCampsList();
    
    // تحميل الإحصائيات
    loadStatistics();
    
    // تحميل المخيمات المحسوبة
    loadCalculatedCamps();
    
    console.log('✅ تم تحميل المنصة بنجاح');
});

// ===================================
// تهيئة خريطة Leaflet
// ===================================
function initializeMap() {
    // إنشاء الخريطة مع التركيز على سوريا
    map = L.map('map').setView([36.0, 38.0], 7);
    
    // إضافة طبقة OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18
    }).addTo(map);
    
    console.log('✅ تم تهيئة الخريطة');
}

// ===================================
// تحميل قائمة المخيمات من الخادم
// ===================================
async function loadCampsList() {
    try {
        const response = await fetch('/get_camps_list');
        const data = await response.json();
        
        if (data.camps && data.camps.length > 0) {
            allCampsFromExcel = data.camps;
            displayCampsList(data.camps);
            
            // عرض جميع المخيمات على الخريطة
            updateMapMarkers();
            
            console.log(`✅ تم تحميل ${data.camps.length} مخيم`);
        } else {
            document.getElementById('campList').innerHTML = 
                '<p style="text-align: center; color: #64748b; padding: 20px;">لا توجد بيانات متاحة</p>';
        }
    } catch (error) {
        console.error('❌ خطأ في تحميل المخيمات:', error);
        document.getElementById('campList').innerHTML = 
            '<p style="text-align: center; color: #ef4444; padding: 20px;">خطأ في تحميل البيانات</p>';
    }
}

// ===================================
// عرض قائمة المخيمات
// ===================================
function displayCampsList(camps) {
    const campList = document.getElementById('campList');
    
    if (!camps || camps.length === 0) {
        campList.innerHTML = '<p style="text-align: center; color: #64748b;">لا توجد مخيمات</p>';
        return;
    }
    
    let html = '';
    camps.forEach((camp, index) => {
        html += `
            <div class="camp-item" onclick="selectCamp('${camp.name.replace(/'/g, "\\'")}')">
                <div class="camp-item-name">${camp.name}</div>
                <div class="camp-item-details">
                    ${camp.region} | ${camp.families} عائلة | ${camp.individuals} فرد
                </div>
            </div>
        `;
    });
    
    campList.innerHTML = html;
}

// ===================================
// تصفية المخيمات حسب البحث
// ===================================
function filterCamps() {
    const searchTerm = document.getElementById('campSearch').value.toLowerCase();
    const filteredCamps = allCampsFromExcel.filter(camp => 
        camp.name.toLowerCase().includes(searchTerm) ||
        camp.region.toLowerCase().includes(searchTerm)
    );
    displayCampsList(filteredCamps);
}

// ===================================
// اختيار مخيم من القائمة
// ===================================
async function selectCamp(campName) {
    try {
        // إزالة التحديد من جميع العناصر
        document.querySelectorAll('.camp-item').forEach(item => {
            item.classList.remove('selected');
        });
        
        // تحديد العنصر المختار
        event.target.closest('.camp-item').classList.add('selected');
        
        // تحديث حقل اسم المخيم
        document.getElementById('campName').value = campName;
        selectedCamp = campName;
        
        // تحميل تفاصيل المخيم
        const response = await fetch(`/get_camp_details/${encodeURIComponent(campName)}`);
        const campData = await response.json();
        
        // عرض مؤشرات الضعف
        displayVulnerabilityIndicators(campData);
        
        // تحديث المنطقة على الخريطة
        const regionSelect = document.getElementById('region');
        if (campData.region === 'حلب') {
            regionSelect.value = 'aleppo';
        } else if (campData.region === 'إدلب') {
            regionSelect.value = 'idlib';
        }
        
        // ضبط الإحداثيات تلقائياً (يمكن تحسينها بإحداثيات حقيقية)
        if (campData.region === 'حلب') {
            document.getElementById('lat').value = '36.2';
            document.getElementById('lng').value = '37.5';
        } else if (campData.region === 'إدلب') {
            document.getElementById('lat').value = '35.9';
            document.getElementById('lng').value = '36.6';
        }
        
        console.log(`✅ تم اختيار المخيم: ${campName}`);
        
    } catch (error) {
        console.error('❌ خطأ في تحميل تفاصيل المخيم:', error);
    }
}

// ===================================
// عرض مؤشرات الضعف
// ===================================
function displayVulnerabilityIndicators(campData) {
    const panel = document.getElementById('vulnerabilityPanel');
    const items = document.getElementById('vulnerabilityItems');
    
    if (!campData.female_headed && !campData.special_needs && !campData.orphans) {
        panel.style.display = 'none';
        return;
    }
    
    let html = '';
    
    if (campData.female_headed > 0) {
        const ratio = ((campData.female_headed / campData.total_families) * 100).toFixed(1);
        html += `
            <div class="vulnerability-item">
                <span>👩 أسر تديرها نساء</span>
                <strong>${campData.female_headed} (${ratio}%)</strong>
            </div>
        `;
    }
    
    if (campData.special_needs > 0) {
        const ratio = ((campData.special_needs / campData.total_families) * 100).toFixed(1);
        html += `
            <div class="vulnerability-item">
                <span>♿ ذوي احتياجات خاصة</span>
                <strong>${campData.special_needs} (${ratio}%)</strong>
            </div>
        `;
    }
    
    if (campData.orphans > 0) {
        html += `
            <div class="vulnerability-item">
                <span>👶 أيتام</span>
                <strong>${campData.orphans} طفل</strong>
            </div>
        `;
    }
    
    if (campData.children > 0) {
        const ratio = ((campData.children / campData.total_individuals) * 100).toFixed(1);
        html += `
            <div class="vulnerability-item">
                <span>🧒 أطفال</span>
                <strong>${campData.children} (${ratio}%)</strong>
            </div>
        `;
    }
    
    items.innerHTML = html;
    panel.style.display = 'block';
}

// ===================================
// تحميل الإحصائيات
// ===================================
async function loadStatistics() {
    try {
        const response = await fetch('/statistics');
        const stats = await response.json();
        
        document.getElementById('totalCamps').textContent = stats.totalCamps || 0;
        document.getElementById('totalFamilies').textContent = (stats.totalFamilies || 0).toLocaleString('ar-EG');
        document.getElementById('totalIndividuals').textContent = (stats.totalIndividuals || 0).toLocaleString('ar-EG');
        document.getElementById('calculatedCamps').textContent = stats.calculatedCamps || 0;
        
    } catch (error) {
        console.error('❌ خطأ في تحميل الإحصائيات:', error);
    }
}

// ===================================
// تحميل المخيمات المحسوبة
// ===================================
async function loadCalculatedCamps() {
    try {
        const response = await fetch('/camps');
        const camps = await response.json();
        
        if (camps && camps.length > 0) {
            campsData = camps;
            updateMapMarkers();
        }
    } catch (error) {
        console.error('❌ خطأ في تحميل المخيمات المحسوبة:', error);
    }
}

// ===================================
// تحديث قيم المنزلقات
// ===================================
function updateValue(id) {
    const value = document.getElementById(id).value;
    document.getElementById('val-' + id).textContent = parseFloat(value).toFixed(1);
}

// ===================================
// حساب القرار
// ===================================
async function calculateDecision() {
    try {
        // جمع البيانات
        const data = {
            campName: document.getElementById('campName').value || 'مخيم غير محدد',
            region: document.getElementById('region').value,
            lat: parseFloat(document.getElementById('lat').value) || 36.0,
            lng: parseFloat(document.getElementById('lng').value) || 38.0,
            A1: parseFloat(document.getElementById('A1').value),
            A2: parseFloat(document.getElementById('A2').value),
            A3: parseFloat(document.getElementById('A3').value),
            A4: parseFloat(document.getElementById('A4').value),
            A5: parseFloat(document.getElementById('A5').value),
            B1: parseFloat(document.getElementById('B1').value),
            B2: parseFloat(document.getElementById('B2').value),
            B3: parseFloat(document.getElementById('B3').value),
            B4: parseFloat(document.getElementById('B4').value),
            B5: parseFloat(document.getElementById('B5').value),
            C1: parseFloat(document.getElementById('C1').value),
            C2: parseFloat(document.getElementById('C2').value),
            C3: parseFloat(document.getElementById('C3').value),
            C4: parseFloat(document.getElementById('C4').value),
            C5: parseFloat(document.getElementById('C5').value),
            C6: parseFloat(document.getElementById('C6').value),
            C7: parseFloat(document.getElementById('C7').value),
            D1: parseFloat(document.getElementById('D1').value),
            D2: parseFloat(document.getElementById('D2').value),
            D3: parseFloat(document.getElementById('D3').value),
            D4: parseFloat(document.getElementById('D4').value),
            D5: parseFloat(document.getElementById('D5').value),
            D6: parseFloat(document.getElementById('D6').value),
            riskFactor: parseFloat(document.getElementById('riskFactor').value)
        };
        
        // إرسال البيانات إلى الخادم
        const response = await fetch('/calculate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error('فشل في حساب النتائج');
        }
        
        const result = await response.json();
        
        // حفظ النتيجة
        campsData.push(result);
        
        // عرض النتائج
        displayResults(result);
        
        // تحديث الخريطة
        updateMapMarkers();
        
        // تحديث الإحصائيات
        loadStatistics();
        
        // التبديل إلى تبويب النتائج
        switchTab('results');
        
        console.log('✅ تم حساب القرار بنجاح:', result);
        
    } catch (error) {
        console.error('❌ خطأ في حساب القرار:', error);
        alert('حدث خطأ أثناء حساب القرار. يرجى المحاولة مرة أخرى.');
    }
}

// ===================================
// عرض النتائج
// ===================================
function displayResults(result) {
    const resultContent = document.getElementById('resultContent');
    
    const campDataHTML = result.campData && result.campData.total_families ? `
        <div class="section" style="margin-top: 20px;">
            <h3>📊 بيانات المخيم من قاعدة البيانات</h3>
            <div class="metrics" style="grid-template-columns: repeat(3, 1fr);">
                <div class="metric">
                    <div class="metric-label">إجمالي العائلات</div>
                    <div class="metric-value">${result.campData.total_families.toLocaleString('ar-EG')}</div>
                </div>
                <div class="metric">
                    <div class="metric-label">إجمالي الأفراد</div>
                    <div class="metric-value">${result.campData.total_individuals.toLocaleString('ar-EG')}</div>
                </div>
                <div class="metric">
                    <div class="metric-label">الأطفال</div>
                    <div class="metric-value">${(result.campData.children || 0).toLocaleString('ar-EG')}</div>
                </div>
                <div class="metric">
                    <div class="metric-label">أسر تديرها نساء</div>
                    <div class="metric-value">${(result.campData.female_headed || 0).toLocaleString('ar-EG')}</div>
                </div>
                <div class="metric">
                    <div class="metric-label">ذوي احتياجات خاصة</div>
                    <div class="metric-value">${(result.campData.special_needs || 0).toLocaleString('ar-EG')}</div>
                </div>
                <div class="metric">
                    <div class="metric-label">الأيتام</div>
                    <div class="metric-value">${(result.campData.orphans || 0).toLocaleString('ar-EG')}</div>
                </div>
            </div>
        </div>
    ` : '';
    
    resultContent.innerHTML = `
        <div class="result-card" style="background: linear-gradient(135deg, ${result.color}CC, ${result.color});">
            <h2 style="margin: 0; font-size: 20px;">نتائج التقييم لمخيم</h2>
            <h1 style="margin: 10px 0; font-size: 32px;">${result.name}</h1>
            <div class="result-fs">${result.FS.toFixed(2)}</div>
            <div class="result-decision">${result.decision_ar}</div>
            <p style="margin-top: 15px; font-size: 14px; opacity: 0.95;">
                الأولوية: <strong>${result.priority}</strong>
            </p>
            ${result.vulnerabilityScore > 0 ? `
                <p style="margin-top: 10px; font-size: 14px; background: rgba(255,255,255,0.2); padding: 10px; border-radius: 8px;">
                    ⚠️ مؤشر الضعف: <strong>${result.vulnerabilityScore.toFixed(2)}</strong>
                    <br><small>يتطلب اهتماماً خاصاً بالفئات الضعيفة</small>
                </p>
            ` : ''}
        </div>
        
        <div class="metrics">
            <div class="metric" style="border-top-color: #8b5cf6;">
                <div class="metric-label">جاهزية العودة</div>
                <div class="metric-value" style="color: #8b5cf6;">${result.RRI.toFixed(2)}</div>
            </div>
            <div class="metric" style="border-top-color: #10b981;">
                <div class="metric-label">جدوى الأصل</div>
                <div class="metric-value" style="color: #10b981;">${result.OVS.toFixed(2)}</div>
            </div>
            <div class="metric" style="border-top-color: #f97316;">
                <div class="metric-label">ملاءمة التوطين</div>
                <div class="metric-value" style="color: #f97316;">${result.RSS.toFixed(2)}</div>
            </div>
            <div class="metric" style="border-top-color: #0ea5e9;">
                <div class="metric-label">الأمن والمؤسسات</div>
                <div class="metric-value" style="color: #0ea5e9;">${result.SIS.toFixed(2)}</div>
            </div>
        </div>
        
        ${campDataHTML}
        
        <div class="recommendations-panel">
            <h3>💡 الإجراءات الموصى بها</h3>
            ${result.actions.map(action => `
                <div class="recommendation-item">${action}</div>
            `).join('')}
        </div>
        
        <div class="section" style="margin-top: 20px; background: #f0fdf4; border-left-color: #10b981;">
            <h3 style="color: #047857;">📋 ملاحظات هامة للتنفيذ</h3>
            <ul style="margin: 15px 0; padding-right: 25px; color: #065f46; line-height: 1.8;">
                <li>يجب إجراء تقييم ميداني شامل قبل اتخاذ أي قرار نهائي</li>
                <li>إشراك المجتمع المحلي والنازحين في عملية اتخاذ القرار</li>
                <li>توفير الحماية الخاصة للفئات الضعيفة (النساء، الأطفال، ذوي الاحتياجات الخاصة)</li>
                <li>ضمان توفر الخدمات الأساسية والبنية التحتية قبل العودة</li>
                <li>وضع خطة طوارئ للتعامل مع المخاطر المحتملة</li>
                <li>المتابعة والتقييم المستمر للوضع الأمني والإنساني</li>
            </ul>
        </div>
    `;
    
    // تحديث التحليلات
    updateAnalytics();
}

// ===================================
// تحديث العلامات على الخريطة
// ===================================
function updateMapMarkers() {
    // مسح العلامات القديمة
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];
    
    // إحداثيات تقريبية للمناطق
    const regionCoords = {
        'حلب': { lat: 36.2, lng: 37.15 },
        'إدلب': { lat: 35.93, lng: 36.63 }
    };
    
    // 1. إضافة علامات للمخيمات المحسوبة
    campsData.forEach(camp => {
        const marker = L.circleMarker([camp.lat, camp.lng], {
            radius: 10,
            fillColor: camp.color,
            color: '#fff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8
        }).addTo(map);
        
        marker.bindPopup(`
            <div style="direction: rtl; text-align: right; min-width: 200px;">
                <h3 style="margin: 0 0 10px 0; color: ${camp.color}; font-size: 16px;">${camp.name}</h3>
                <p style="margin: 5px 0;"><strong>النتيجة النهائية:</strong> ${camp.FS.toFixed(2)}</p>
                <p style="margin: 5px 0;"><strong>القرار:</strong> ${camp.decision_ar}</p>
                <p style="margin: 5px 0;"><strong>الأولوية:</strong> ${camp.priority}</p>
            </div>
        `);
        
        markers.push(marker);
    });
    
    // 2. إضافة علامات للمخيمات غير المحسوبة (باللون الأزرق)
    const calculatedNames = campsData.map(c => c.name);
    const notCalculated = allCampsFromExcel.filter(c => !calculatedNames.includes(c.name));
    
    notCalculated.forEach((camp, idx) => {
        // تحديد الإحداثيات حسب المنطقة
        let lat, lng;
        if (regionCoords[camp.region]) {
            // توزيع المخيمات في شبكة لتجنب التراكب
            const offset = (idx % 5) * 0.05;
            const offsetLng = Math.floor(idx / 5) * 0.05;
            lat = regionCoords[camp.region].lat + offset;
            lng = regionCoords[camp.region].lng + offsetLng;
        } else {
            lat = 36.0 + (idx * 0.1);
            lng = 37.0 + (idx * 0.1);
        }
        
        const marker = L.circleMarker([lat, lng], {
            radius: 8,
            fillColor: '#3b82f6',
            color: '#fff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.7
        }).addTo(map);
        
        marker.bindPopup(`
            <div style="direction: rtl; text-align: right; min-width: 200px;">
                <h3 style="margin: 0 0 10px 0; color: #3b82f6; font-size: 16px;">${camp.name}</h3>
                <p style="margin: 5px 0;"><strong>المنطقة:</strong> ${camp.region}</p>
                <p style="margin: 5px 0;"><strong>عدد العائلات:</strong> ${camp.families.toLocaleString('ar-EG')}</p>
                <p style="margin: 5px 0;"><strong>عدد الأفراد:</strong> ${camp.individuals.toLocaleString('ar-EG')}</p>
                <p style="margin: 8px 0; padding: 8px; background: #eff6ff; border-radius: 5px; color: #1e40af; font-size: 12px;">
                    🔵 مخيم غير محسوب - اختره للتقييم
                </p>
                <button onclick="selectCamp('${camp.name.replace(/'/g, "\\'")}'); map.closePopup();" 
                        style="margin-top: 5px; padding: 8px 12px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer; width: 100%; font-size: 13px;">
                    اختر للتقييم
                </button>
            </div>
        `);
        
        markers.push(marker);
    });
    
    // ضبط عرض الخريطة لتشمل جميع العلامات
    if (markers.length > 0) {
        const group = L.featureGroup(markers);
        map.fitBounds(group.getBounds().pad(0.1));
    }
}

// ===================================
// تحديث التحليلات
// ===================================
function updateAnalytics() {
    if (campsData.length === 0) return;
    
    // إحصائيات القرارات
    const decisions = {
        'immediate': campsData.filter(c => c.FS >= 4.0).length,
        'phased': campsData.filter(c => c.FS >= 3.0 && c.FS < 4.0).length,
        'relocation': campsData.filter(c => c.FS >= 2.0 && c.FS < 3.0).length,
        'integration': campsData.filter(c => c.FS >= 1.5 && c.FS < 2.0).length,
        'noReturn': campsData.filter(c => c.FS < 1.5).length
    };
    
    // تحديث الرسم البياني
    const ctx = document.getElementById('analyticsChart');
    
    if (analyticsChart) {
        analyticsChart.destroy();
    }
    
    analyticsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['عودة فورية', 'عودة تدريجية', 'إعادة توطين', 'اندماج محلي', 'لا عودة'],
            datasets: [{
                label: 'عدد المخيمات',
                data: [decisions.immediate, decisions.phased, decisions.relocation, decisions.integration, decisions.noReturn],
                backgroundColor: [
                    '#10b981',
                    '#eab308',
                    '#f97316',
                    '#fb923c',
                    '#ef4444'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: 'توزيع القرارات حسب الفئة',
                    font: {
                        size: 16,
                        weight: 'bold'
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
    
    // إحصائيات تفصيلية
    const totalFamilies = campsData.reduce((sum, c) => sum + (c.campData?.total_families || 0), 0);
    const totalVulnerable = campsData.reduce((sum, c) => 
        sum + (c.campData?.female_headed || 0) + (c.campData?.special_needs || 0), 0
    );
    
    document.getElementById('analyticsContent').innerHTML = `
        <div class="metrics" style="grid-template-columns: repeat(3, 1fr); margin-top: 20px;">
            <div class="metric">
                <div class="metric-label">إجمالي المخيمات المقيّمة</div>
                <div class="metric-value">${campsData.length}</div>
            </div>
            <div class="metric">
                <div class="metric-label">إجمالي العائلات المشمولة</div>
                <div class="metric-value">${totalFamilies.toLocaleString('ar-EG')}</div>
            </div>
            <div class="metric">
                <div class="metric-label">الحالات الضعيفة</div>
                <div class="metric-value">${totalVulnerable.toLocaleString('ar-EG')}</div>
            </div>
        </div>
        
        <div class="section" style="margin-top: 20px;">
            <h3>📊 ملخص التوصيات</h3>
            <div style="padding: 15px; background: #f8fafc; border-radius: 8px;">
                <p style="margin: 10px 0; font-size: 14px; color: #475569;">
                    • <strong>${decisions.immediate}</strong> مخيم يوصى بالعودة الفورية
                </p>
                <p style="margin: 10px 0; font-size: 14px; color: #475569;">
                    • <strong>${decisions.phased}</strong> مخيم يوصى بالعودة التدريجية
                </p>
                <p style="margin: 10px 0; font-size: 14px; color: #475569;">
                    • <strong>${decisions.relocation}</strong> مخيم يوصى بإعادة التوطين
                </p>
                <p style="margin: 10px 0; font-size: 14px; color: #475569;">
                    • <strong>${decisions.integration}</strong> مخيم يوصى بالاندماج المحلي
                </p>
                <p style="margin: 10px 0; font-size: 14px; color: #475569;">
                    • <strong>${decisions.noReturn}</strong> مخيم لا يوصى بالعودة حالياً
                </p>
            </div>
        </div>
    `;
}

// ===================================
// التبديل بين التبويبات
// ===================================
function switchTab(tabName) {
    // إزالة التنشيط من جميع التبويبات
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // تنشيط التبويب المختار
    event.target.classList.add('active');
    
    if (tabName === 'map') {
        document.getElementById('map-section').classList.add('active');
        // إعادة حساب حجم الخريطة
        setTimeout(() => map.invalidateSize(), 100);
    } else if (tabName === 'results') {
        document.getElementById('results-section').classList.add('active');
    } else if (tabName === 'analytics') {
        document.getElementById('analytics-section').classList.add('active');
    }
}

// ===================================
// تحديث منطقة الخريطة
// ===================================
function updateMapRegion() {
    const region = document.getElementById('region').value;
    
    if (region === 'aleppo') {
        map.setView([36.2, 37.5], 9);
    } else if (region === 'idlib') {
        map.setView([35.9, 36.6], 9);
    } else {
        map.setView([36.0, 38.0], 7);
    }
}

// ===================================
// تصدير النتائج إلى Excel
// ===================================
async function exportToExcel() {
    try {
        if (campsData.length === 0) {
            alert('لا توجد نتائج للتصدير. قم بحساب بعض المخيمات أولاً.');
            return;
        }
        
        const response = await fetch('/export');
        const blob = await response.blob();
        
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `IRR_SDM_Results_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        alert('✅ تم تصدير النتائج بنجاح!');
        
    } catch (error) {
        console.error('❌ خطأ في التصدير:', error);
        alert('حدث خطأ أثناء تصدير النتائج.');
    }
}

// ===================================
// مسح النتائج
// ===================================
async function clearResults() {
    if (!confirm('هل أنت متأكد من مسح جميع النتائج المحسوبة؟')) {
        return;
    }
    
    try {
        await fetch('/clear', { method: 'POST' });
        
        campsData = [];
        updateMapMarkers();
        
        document.getElementById('resultContent').innerHTML = `
            <div style="text-align: center; padding: 60px 20px; color: #64748b;">
                <p style="font-size: 48px; margin-bottom: 20px;">📋</p>
                <h3 style="color: #475569; margin-bottom: 10px;">لا توجد نتائج</h3>
                <p>قم باختيار مخيم وإدخال المعايير ثم اضغط "احسب القرار الأمثل"</p>
            </div>
        `;
        
        if (analyticsChart) {
            analyticsChart.destroy();
            analyticsChart = null;
        }
        
        document.getElementById('analyticsContent').innerHTML = 
            '<p style="text-align: center; color: #64748b; padding: 40px;">سيتم عرض التحليلات بعد حساب النتائج</p>';
        
        loadStatistics();
        
        alert('✅ تم مسح جميع النتائج');
        
    } catch (error) {
        console.error('❌ خطأ في المسح:', error);
        alert('حدث خطأ أثناء مسح النتائج.');
    }
}

console.log('✅ تم تحميل جميع الوظائف بنجاح');
