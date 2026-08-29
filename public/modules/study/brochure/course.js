const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const R2_BASE_URL = isLocal ? '../../../../new_staging_area' : 'https://pub-d048d28d4cd54d579def4bf758d5a298.r2.dev';

let allCourses = [];
let institutionInfo = {};

const urlParams = new URLSearchParams(window.location.search);
const instId = urlParams.get('id');
const countryCode = urlParams.get('c') || 'ng';

const searchInput = document.getElementById('searchInput');
const courseList = document.getElementById('courseList');
const instTitle = document.getElementById('instTitle');

const courseModal = document.getElementById('courseModal');
const modalTitle = document.getElementById('modalTitle');
const modalDept = document.getElementById('modalDept');
const modalUtme = document.getElementById('modalUtme');
const modalDe = document.getElementById('modalDe');
const modalDeContainer = document.getElementById('modalDeContainer');

async function init() {
    if (!instId) {
        courseList.innerHTML = `<div style="padding: 40px; text-align: center; color: #ef4444;">No institution ID provided.</div>`;
        instTitle.textContent = "Error";
        return;
    }

    try {
        const res = await fetch(`${R2_BASE_URL}/${countryCode}/brochure/institutions/${instId}.json?t=${new Date().getTime()}`);
        if (!res.ok) throw new Error('Failed to fetch institution details');
        
        const data = await res.json();
        institutionInfo = data.institution || {};
        allCourses = data.programmes || [];
        
        instTitle.textContent = institutionInfo.school_name || "Institution Courses";
        
        renderList(allCourses);
        
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const filtered = allCourses.filter(c => (c.course_name || '').toLowerCase().includes(term));
            renderList(filtered);
        });
        
    } catch (err) {
        console.error("Error loading courses:", err);
        courseList.innerHTML = `<div style="padding: 40px; text-align: center; color: #ef4444;">Failed to load courses. Data might not be available yet.</div>`;
        instTitle.textContent = "Error Loading Institution";
    }
}

function renderList(courses) {
    if (courses.length === 0) {
        courseList.innerHTML = `<div style="padding: 40px; text-align: center; color: var(--text-secondary);">No courses found.</div>`;
        return;
    }
    
    let html = '';
    courses.forEach((course, index) => {
        // SVG for the eye icon inside the button
        const eyeIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>`;
        
        html += `
            <div class="course-item">
                <div class="course-name">${course.course_name}</div>
                <button class="btn-view-details" onclick="openDetails(${index})">
                    View Details
                    ${eyeIcon}
                </button>
            </div>
        `;
    });
    
    courseList.innerHTML = html;
}

// Ensure the openDetails function is globally accessible so onclick can trigger it
window.openDetails = function(index) {
    // Determine the array to use based on the current search filter state
    // To ensure correct index mapping, we must search allCourses for the correct match, 
    // but passing index from the filtered list is problematic.
    // Instead of passing index, let's fix the logic by regenerating the HTML correctly above
    // or by passing the course ID if available. Let's find it by course_name for safety.
};

// Fixed renderList to pass the actual course object ID to avoid index mismatch on filter
function renderList(courses) {
    if (courses.length === 0) {
        courseList.innerHTML = `<div style="padding: 40px; text-align: center; color: var(--text-secondary);">No courses found.</div>`;
        return;
    }
    
    let html = '';
    courses.forEach(course => {
        const eyeIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>`;
        
        // Pass the course.id to the onclick handler
        html += `
            <div class="course-item">
                <div class="course-name">${course.course_name}</div>
                <button class="btn-view-details" onclick="openDetails(${course.id})">
                    View Details
                    ${eyeIcon}
                </button>
            </div>
        `;
    });
    
    courseList.innerHTML = html;
}

window.openDetails = function(courseId) {
    const course = allCourses.find(c => c.id === courseId);
    if (!course) return;
    
    // Set Header
    modalTitle.textContent = course.course_name;
    
    // Determine Subjects - Use course.subjects if we ever add it to the scraper, 
    // otherwise fallback to special remarks or 'N/A'
    const subjects = course.subjects || course.special_remarks || "N/A";
    
    // Set grid content
    document.getElementById('modalColInst').textContent = course.course_name; // from the image, Institutions shows course name
    document.getElementById('modalColDe').innerHTML = (course.de_requirements && course.de_requirements.trim() !== '') ? course.de_requirements : '<span style="color:#9CA3AF">N/A</span>';
    document.getElementById('modalColOlevel').innerHTML = course.utme_requirements || '<span style="color:#9CA3AF">N/A</span>';
    document.getElementById('modalColSubj').innerHTML = subjects;
    
    courseModal.classList.add('active');

    // --- MEC Task Engine: record article/course read ---
    try {
      if (typeof MECTasks !== 'undefined') {
        const articleId = 'course_' + (course.id || courseId || course.course_name || Math.random());
        MECTasks.recordArticleRead(articleId, course.course_name || 'Course Detail');
      }
    } catch(e) {}
};

document.addEventListener('DOMContentLoaded', init);
