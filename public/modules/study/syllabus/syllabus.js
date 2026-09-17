/**
 * Syllabus Dynamic Data Fetching
 * 
 * IMPORTANT: Replace this URL with your actual Cloudflare R2 Public URL.
 * e.g., 'https://pub-xxxxxx.r2.dev'
 */
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:';
const R2_BASE_URL = isLocal ? '../../../../new_staging_area' : 'https://pub-d048d28d4cd54d579def4bf758d5a298.r2.dev';

// State
let globalData = null;
let currentCountryCode = 'ng';
let currentExamCode = 'jamb';
let currentSubjectId = null;

// Read clean URL params injected by Edge SSR (if present)
const _cleanParams = (typeof window !== 'undefined' && window.MEC_SYLLABUS_PARAMS) || {};
if (_cleanParams.country) currentCountryCode = _cleanParams.country;
if (_cleanParams.exam)    currentExamCode    = _cleanParams.exam;
if (_cleanParams.subject) currentSubjectId   = _cleanParams.subject;

// DOM Elements
const countrySelect = document.getElementById('country-select');
const examTabsContainer = document.getElementById('exam-tabs');
const subjListDesktop = document.getElementById('subj-list-desktop');
const subjListMobile = document.getElementById('subj-list-mobile');
const titleText = document.getElementById('active-subject-title');
const contentSubtitle = document.getElementById('content-subtitle');
const syllabusTextContainer = document.getElementById('syllabus-text-container');

// Event Listeners
countrySelect.addEventListener('change', (e) => {
    currentCountryCode = e.target.value;
    loadCountryData();
});

// Initialization
async function init() {
    try {
        const res = await fetch(`${R2_BASE_URL}/syllabus_global_index.json?t=${new Date().getTime()}`);
        if (!res.ok) throw new Error('Failed to fetch global index');
        globalData = await res.json();
        
        populateCountrySelect();
        
        // Use clean URL country if present, otherwise localStorage or first country
        if (_cleanParams.country) {
            currentCountryCode = _cleanParams.country;
        } else {
            const saved = localStorage.getItem('mec_country') || null;
            if (saved && globalData.countries && globalData.countries.find(c => c.id === saved)) {
                currentCountryCode = saved;
            } else if (globalData.countries && globalData.countries.length > 0) {
                const defaultCountry = globalData.countries.find(c => c.id === 'ng') || globalData.countries[0];
                currentCountryCode = defaultCountry.id;
            }
        }
        countrySelect.value = currentCountryCode;
        
        await loadCountryData();
        
    } catch (err) {
        console.error("Error initializing syllabus data:", err);
        syllabusTextContainer.innerHTML = `<div style="padding: 40px; text-align: center; color: #ef4444;">Failed to load syllabus index. Please check your connection or R2 URL configuration.</div>`;
    }
}

function populateCountrySelect() {
    countrySelect.innerHTML = '';
    if (!globalData || !globalData.countries) return;
    
    globalData.countries.forEach(country => {
        const option = document.createElement('option');
        option.value = country.id;
        option.textContent = country.name;
        countrySelect.appendChild(option);
    });
}

async function loadCountryData() {
    try {
        const res = await fetch(`${R2_BASE_URL}/${currentCountryCode}/syllabus/index.json?t=${new Date().getTime()}`);
        if (!res.ok) throw new Error('Failed to fetch country index');
        const countryData = await res.json();
        
        examTabsContainer.innerHTML = '';
        
        if (countryData.exams && countryData.exams.length > 0) {
            // Use clean URL exam if present, otherwise default to jamb or first
            if (_cleanParams.exam && countryData.exams.find(e => e.id === _cleanParams.exam)) {
                currentExamCode = _cleanParams.exam;
            } else {
                const defaultExam = countryData.exams.find(e => e.id === 'jamb') || countryData.exams[0];
                currentExamCode = defaultExam.id;
            }
            
            countryData.exams.forEach(exam => {
                const tab = document.createElement('div');
                tab.className = `tab ${exam.id === currentExamCode ? 'active' : ''}`;
                tab.textContent = `${exam.name || exam.exam} Syllabus`;
                tab.onclick = () => {
                    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                    tab.classList.add('active');
                    currentExamCode = exam.id;
                    // Push clean URL for exam switch
                    history.pushState(null, '', `/syllabus/${currentCountryCode}/${currentExamCode}`);
                    loadExamData();
                };
                examTabsContainer.appendChild(tab);
            });
            
            await loadExamData();
        } else {
            examTabsContainer.innerHTML = '<div style="padding: 10px; color: var(--text-muted);">No exams found for this country</div>';
            subjListDesktop.innerHTML = '';
            subjListMobile.innerHTML = '';
            syllabusTextContainer.innerHTML = '';
        }
    } catch (err) {
        console.error("Error loading country data:", err);
        syllabusTextContainer.innerHTML = `<div style="padding: 40px; text-align: center; color: #ef4444;">Failed to load ${currentCountryCode.toUpperCase()} exam index. (${err.message})</div>`;
    }
}

async function loadExamData() {
    try {
        const res = await fetch(`${R2_BASE_URL}/${currentCountryCode}/syllabus/${currentExamCode}/index.json?t=${new Date().getTime()}`);
        if (!res.ok) throw new Error('Failed to fetch exam index');
        const examData = await res.json();
        
        subjListDesktop.innerHTML = '';
        subjListMobile.innerHTML = '';
        
        if (examData.subjects && examData.subjects.length > 0) {
            // Use clean URL subject if present, otherwise first subject
            if (_cleanParams.subject && examData.subjects.find(s => s.id === _cleanParams.subject)) {
                currentSubjectId = _cleanParams.subject;
            } else {
                currentSubjectId = examData.subjects[0].id;
            }
            
            examData.subjects.forEach(subject => {
                const itemHTML = `${subject.name} <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`;

                const dItem = document.createElement('a');
                dItem.href = `/syllabus/${currentCountryCode}/${currentExamCode}/${subject.id}`;
                dItem.className = `qs-item ${subject.id === currentSubjectId ? 'active' : ''}`;
                dItem.dataset.subjectId = subject.id;
                dItem.innerHTML = itemHTML;
                dItem.onclick = (e) => { e.preventDefault(); setActiveSubject(subject.id); };
                subjListDesktop.appendChild(dItem);

                const mItem = document.createElement('a');
                mItem.href = `/syllabus/${currentCountryCode}/${currentExamCode}/${subject.id}`;
                mItem.className = `qs-item ${subject.id === currentSubjectId ? 'active' : ''}`;
                mItem.dataset.subjectId = subject.id;
                mItem.innerHTML = itemHTML;
                mItem.onclick = (e) => {
                    e.preventDefault();
                    setActiveSubject(subject.id);
                    document.getElementById('subjToggle').classList.remove('open');
                    document.getElementById('subjPanel').classList.remove('open');
                };
                subjListMobile.appendChild(mItem);
            });
            
            await loadSubjectContent(currentSubjectId);
        } else {
            const noSubj = '<div style="padding: 12px; color: var(--text-muted);">No subjects found</div>';
            subjListDesktop.innerHTML = noSubj;
            subjListMobile.innerHTML = noSubj;
            syllabusTextContainer.innerHTML = '';
            titleText.textContent = 'Syllabus';
            contentSubtitle.textContent = 'No Subjects';
        }
    } catch (err) {
        console.error("Error loading exam data:", err);
    }
}

function setActiveSubject(subjectId) {
    currentSubjectId = subjectId;

    [subjListDesktop, subjListMobile].forEach(list => {
        list.querySelectorAll('.qs-item').forEach(item => {
            item.classList.toggle('active', item.dataset.subjectId === subjectId);
        });
    });

    history.pushState(null, '', `/syllabus/${currentCountryCode}/${currentExamCode}/${subjectId}`);
    loadSubjectContent(subjectId);
}

async function loadSubjectContent(subjectId) {
    syllabusTextContainer.innerHTML = '<div style="padding: 40px; text-align: center; color: var(--text-muted);">Loading...</div>';

    try {
        const res = await fetch(`${R2_BASE_URL}/${currentCountryCode}/syllabus/${currentExamCode}/subjects/${subjectId}.json?t=${new Date().getTime()}`);
        if (!res.ok) throw new Error('Failed to fetch subject content');
        const subjectData = await res.json();
        
        titleText.textContent = subjectData.name;
        contentSubtitle.textContent = subjectData.name;
        syllabusTextContainer.innerHTML = subjectData.content;
        
        // Inject Watch Video buttons next to topics
        let topicIndex = 0;
        const tables = syllabusTextContainer.querySelectorAll('table');
        tables.forEach(table => {
            const strongs = table.querySelectorAll('strong');
            strongs.forEach(st => {
                const text = st.textContent.trim();
                if (/^\d+\.\s*/.test(text)) {
                    const btn = document.createElement('a');
                    btn.href = `../topic_video/topic_video.html?country=${currentCountryCode}&exam=${currentExamCode}&subject=${subjectId}&topic_index=${topicIndex}`;
                    btn.className = 'btn-watch-tutorial';
                    btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg> Watch Class`;
                    st.parentNode.insertBefore(btn, st.nextSibling);
                    topicIndex++;
                }
            });
        });
        
        // Ensure all active classes are correct
        const itemsD = subjListDesktop.querySelectorAll('.qs-item');
        const itemsM = subjListMobile.querySelectorAll('.qs-item');
        itemsD.forEach(i => {
            i.classList.toggle('active', i.textContent.trim() === subjectData.name);
        });
        itemsM.forEach(i => {
            i.classList.toggle('active', i.textContent.trim() === subjectData.name);
        });

    } catch (err) {
        console.error("Error loading subject content:", err);
        syllabusTextContainer.innerHTML = `<div style="padding: 40px; text-align: center; color: #ef4444;">Failed to load syllabus content.</div>`;
    }
}

// Start
document.addEventListener('DOMContentLoaded', init);
