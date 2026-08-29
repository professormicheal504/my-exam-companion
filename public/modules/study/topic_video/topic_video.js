/**
 * topic_video.js
 * Multi-Subject Video Hub with Advanced Search, Dropdown Filters, and Pagination
 */

const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:';
const R2_BASE_URL = isLocal ? '../../../../new_staging_area' : 'https://pub-d048d28d4cd54d579def4bf758d5a298.r2.dev';

const countryCode = 'ng';
const examCode = 'jamb';

// DOM Elements
const videoGrid = document.getElementById('video-grid');
const subjectFilter = document.getElementById('subject-filter');
const topicFilter = document.getElementById('topic-filter');
const searchInput = document.getElementById('advanced-search');
const searchSuggestions = document.getElementById('search-suggestions');
const paginationContainer = document.getElementById('pagination-container');

// Modal Elements
const modalOverlay = document.getElementById('video-modal');
const modalIframe = document.getElementById('modal-iframe');
const modalCloseBtn = document.getElementById('modal-close-btn');
const modalDownloadBtn = document.getElementById('modal-download-btn');

// State
let currentVideoId = null;
let allSubjects = [];
let allVideosFlat = []; 
let filteredVideos = []; 
let activeSubject = 'all'; 
let activeTopic = 'all'; 
let currentPage = 1;
const itemsPerPage = 12;

let videoAdData = null;

async function fetchAdSettings() {
    let vastUrl = null;
    try {
        const sb = window.MECSupabase?.getSupabase();
        if (sb) {
            const { data, error } = await sb.from('app_settings').select('value').eq('key', 'hilltop_zones').single();
            if (data && data.value) {
                let val = data.value;
                if (typeof val === 'string') {
                    try { val = JSON.parse(val); } catch(e){}
                }
                if (val && val.video_vast && val.video_vast.src) {
                    vastUrl = val.video_vast.src;
                }
            }
        }
    } catch (e) {
        console.warn('Ad fetch error:', e);
    }
    
    // Fallback if not found in Supabase
    if (!vastUrl) {
        vastUrl = "https://loyal-product.com/dDm-F.zNdaGxNWvcZ/GJUO/NeCmw9yu/Z/UUlEkWP/T/clzJNETKQo4VNtj/UHt/NRzmM/1dN/DRgS2ROnSOZLsqavWY1opedcD/0CxN";
    }

    // Initialize videoAdData
    videoAdData = { h: 360, w: 640, src: vastUrl }; // Default to vastUrl just in case

    // Parse the VAST XML to get the direct MP4 URL for low-end devices
    try {
        const response = await fetch(vastUrl);
        const xmlText = await response.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, "text/xml");
        const mediaFiles = xmlDoc.getElementsByTagName("MediaFile");
        
        let mp4Url = null;
        for (let i = 0; i < mediaFiles.length; i++) {
            const type = mediaFiles[i].getAttribute("type");
            // Prefer mp4 for low end devices
            if (type === "video/mp4") {
                mp4Url = mediaFiles[i].textContent.trim();
                break;
            }
        }
        
        // Fallback to the first available media file if mp4 is not found
        if (!mp4Url && mediaFiles.length > 0) {
            mp4Url = mediaFiles[0].textContent.trim();
        }
        
        if (mp4Url) {
            videoAdData.src = mp4Url;
        }
    } catch (e) {
        console.warn("Failed to parse VAST XML for direct MP4 link. Might be a CORS issue or invalid XML.", e);
        // Fallback to a direct mp4 known to work from the payload if parsing completely fails
        videoAdData.src = "https://www.silent-basis.pro/301305/351513/1030622_03c9a.mp4";
    }
}

async function init() {
    videoGrid.innerHTML = `<div class="loading-state">Initializing Video Hub... fetching subjects...</div>`;
    
    // Fetch ad settings in parallel with subjects
    await fetchAdSettings();
    
    try {
        // 1. Fetch index of subjects
        let indexUrl = `${R2_BASE_URL}/${countryCode}/syllabus/${examCode}/index.json?t=${new Date().getTime()}`;
        let indexRes = await fetch(indexUrl);
        if (!indexRes.ok && isLocal) {
            indexUrl = `https://pub-d048d28d4cd54d579def4bf758d5a298.r2.dev/${countryCode}/syllabus/${examCode}/index.json?t=${new Date().getTime()}`;
            indexRes = await fetch(indexUrl);
        }
        
        if (!indexRes.ok) throw new Error("Could not load subjects index");
        const indexData = await indexRes.json();
        allSubjects = indexData.subjects.sort((a, b) => a.name.localeCompare(b.name));
        
        populateSubjectDropdown();
        
        videoGrid.innerHTML = `<div class="loading-state">Loading thousands of masterclasses...</div>`;
        
        // 2. Fetch all subject JSONs in parallel
        const fetchPromises = allSubjects.map(async (sub) => {
            try {
                let url = `${R2_BASE_URL}/${countryCode}/syllabus/${examCode}/videos/${sub.id}_videos.json`;
                let res = await fetch(url);
                if (!res.ok && isLocal) {
                    url = `https://pub-d048d28d4cd54d579def4bf758d5a298.r2.dev/${countryCode}/syllabus/${examCode}/videos/${sub.id}_videos.json`;
                    res = await fetch(url);
                }
                if (res.ok) {
                    const data = await res.json();
                    return { subject: sub, topicsData: data };
                }
            } catch(e) { console.warn(`Failed to load ${sub.id}`, e); }
            return null;
        });
        
        const results = await Promise.all(fetchPromises);
        
        // 3. Flatten into one massive array
        results.forEach(res => {
            if (!res) return;
            const { subject, topicsData } = res;
            for (const [topicName, videos] of Object.entries(topicsData)) {
                videos.forEach(vid => {
                    allVideosFlat.push({
                        ...vid,
                        subjectId: subject.id,
                        subjectName: subject.name,
                        topicName: topicName
                    });
                });
            }
        });
        
        allVideosFlat.sort(() => 0.5 - Math.random());
        filteredVideos = [...allVideosFlat];
        
        // 4. Render
        setupFilters();
        setupSearch();
        setupModal();
        renderGrid();
        
    } catch (err) {
        console.error("Initialization Error:", err);
        videoGrid.innerHTML = `<div class="loading-state" style="color: #ef4444;">Failed to load hub.<br><br><b>Error Details:</b> ${err.message}</div>`;
    }
}

function populateSubjectDropdown() {
    if (!subjectFilter) return;
    subjectFilter.innerHTML = '<option value="all">All Subjects</option>';
    
    allSubjects.forEach(sub => {
        const opt = document.createElement('option');
        opt.value = sub.id;
        opt.textContent = sub.name;
        subjectFilter.appendChild(opt);
    });
}

function populateTopicDropdown(subjectId) {
    if (!topicFilter) return;
    topicFilter.innerHTML = '<option value="all">All Topics</option>';
    
    if (subjectId === 'all') return;
    
    const subjectVideos = allVideosFlat.filter(v => v.subjectId === subjectId);
    const uniqueTopics = [...new Set(subjectVideos.map(v => v.topicName))].sort();
    
    uniqueTopics.forEach(topic => {
        const opt = document.createElement('option');
        opt.value = topic;
        opt.textContent = topic;
        topicFilter.appendChild(opt);
    });
}

function setupFilters() {
    if (subjectFilter) {
        subjectFilter.addEventListener('change', (e) => {
            activeSubject = e.target.value;
            activeTopic = 'all'; // Reset topic on subject change
            currentPage = 1; 
            searchInput.value = ''; 
            
            populateTopicDropdown(activeSubject);
            
            if (activeSubject === 'all') {
                filteredVideos = [...allVideosFlat];
            } else {
                filteredVideos = allVideosFlat.filter(v => v.subjectId === activeSubject);
            }
            
            renderGrid();
        });
    }

    if (topicFilter) {
        topicFilter.addEventListener('change', (e) => {
            activeTopic = e.target.value;
            currentPage = 1;
            
            if (activeTopic === 'all') {
                filteredVideos = activeSubject === 'all' ? [...allVideosFlat] : allVideosFlat.filter(v => v.subjectId === activeSubject);
            } else {
                filteredVideos = allVideosFlat.filter(v => v.subjectId === activeSubject && v.topicName === activeTopic);
            }
            
            renderGrid();
        });
    }
}

function setupSearch() {
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        
        // Reset dropdowns to 'All' visually if searching globally
        if (query.length > 0) {
            subjectFilter.value = 'all';
            populateTopicDropdown('all');
            activeSubject = 'all';
            activeTopic = 'all';
        }
        
        if (query === '') {
            searchSuggestions.classList.remove('active');
            filteredVideos = [...allVideosFlat];
        } else {
            const suggestions = [];
            
            const matchingSubjects = allSubjects.filter(s => s.name.toLowerCase().includes(query)).slice(0, 3);
            matchingSubjects.forEach(s => suggestions.push({ type: 'Subject', text: s.name, id: s.id }));
            
            filteredVideos = allVideosFlat.filter(v => 
                v.title.toLowerCase().includes(query) || 
                v.topicName.toLowerCase().includes(query) ||
                v.subjectName.toLowerCase().includes(query)
            );
            
            if (suggestions.length > 0) {
                renderSuggestions(suggestions);
            } else {
                searchSuggestions.classList.remove('active');
            }
        }
        
        currentPage = 1;
        renderGrid();
    });
    
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-container')) {
            searchSuggestions.classList.remove('active');
        }
    });
}

function renderSuggestions(suggestions) {
    searchSuggestions.innerHTML = '';
    suggestions.forEach(s => {
        const div = document.createElement('div');
        div.className = 'suggestion-item';
        div.innerHTML = `
            <svg class="suggestion-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
            <span class="suggestion-text">${s.text} <small style="color:var(--text-muted)">(${s.type})</small></span>
        `;
        div.onclick = () => {
            searchInput.value = '';
            searchSuggestions.classList.remove('active');
            
            // Simulate selecting the subject dropdown
            activeSubject = s.id;
            subjectFilter.value = activeSubject;
            populateTopicDropdown(activeSubject);
            
            filteredVideos = allVideosFlat.filter(v => v.subjectId === activeSubject);
            currentPage = 1;
            renderGrid();
        };
        searchSuggestions.appendChild(div);
    });
    searchSuggestions.classList.add('active');
}

function renderGrid() {
    videoGrid.innerHTML = '';
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedVideos = filteredVideos.slice(startIndex, endIndex);
    
    if (paginatedVideos.length === 0) {
        videoGrid.innerHTML = `<div class="loading-state">No videos found matching your criteria.</div>`;
        paginationContainer.style.display = 'none';
        return;
    }
    
    paginatedVideos.forEach((vid, index) => {
        if (index > 0 && index % 4 === 0 && videoAdData && videoAdData.src) {
            const adCard = document.createElement('div');
            adCard.className = 'video-card';
            adCard.style.cursor = 'default';
            adCard.innerHTML = `
                <div class="video-thumb-container" style="border: 1px solid var(--border);">
                    <video src="${videoAdData.src}" autoplay muted loop playsinline class="video-thumb" style="object-fit: cover; width: 100%; height: 100%; pointer-events: none;"></video>
                    <div style="position: absolute; top: 8px; right: 8px; background: rgba(0,0,0,0.6); color: #fff; padding: 3px 8px; font-size: 11px; border-radius: 4px; font-weight: bold; z-index: 10;">Sponsored</div>
                </div>
                <div class="video-info">
                    <h3 class="video-title" style="color: var(--text-muted);">Partner Content</h3>
                    <div class="video-meta">
                        <span>Advertisement</span>
                    </div>
                </div>
            `;
            videoGrid.appendChild(adCard);
        }

        const card = document.createElement('div');
        card.className = 'video-card';
        card.onclick = () => openModal(vid.id);
        
        card.innerHTML = `
            <div class="video-thumb-container">
                <img loading="lazy" src="https://img.youtube.com/vi/${vid.id}/hqdefault.jpg" alt="Thumbnail" class="video-thumb">
                <div class="play-overlay">
                    <div class="play-button">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                    </div>
                </div>
            </div>
            <div class="video-info">
                <h3 class="video-title">${vid.title}</h3>
                <div class="video-meta">
                    <span style="color: var(--primary-color)">${vid.subjectName}</span>
                    <span class="video-meta-dot"></span>
                    <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 150px;">${vid.topicName}</span>
                </div>
            </div>
        `;
        
        videoGrid.appendChild(card);
    });
    
    renderPagination();
}

function renderPagination() {
    paginationContainer.innerHTML = '';
    const totalPages = Math.ceil(filteredVideos.length / itemsPerPage);
    
    if (totalPages <= 1) {
        paginationContainer.style.display = 'none';
        return;
    }
    
    paginationContainer.style.display = 'flex';
    
    const prevBtn = document.createElement('button');
    prevBtn.className = 'page-btn';
    prevBtn.innerHTML = '&larr;';
    prevBtn.disabled = currentPage === 1;
    prevBtn.onclick = () => { currentPage--; renderGrid(); window.scrollTo({top: 0, behavior: 'smooth'}); };
    paginationContainer.appendChild(prevBtn);
    
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    if (endPage - startPage < 4) {
        startPage = Math.max(1, endPage - 4);
    }
    
    if (startPage > 1) {
        paginationContainer.appendChild(createPageBtn(1));
        if (startPage > 2) {
            const ell = document.createElement('span'); ell.className = 'page-ellipsis'; ell.textContent = '...';
            paginationContainer.appendChild(ell);
        }
    }
    
    for (let i = startPage; i <= endPage; i++) {
        paginationContainer.appendChild(createPageBtn(i));
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            const ell = document.createElement('span'); ell.className = 'page-ellipsis'; ell.textContent = '...';
            paginationContainer.appendChild(ell);
        }
        paginationContainer.appendChild(createPageBtn(totalPages));
    }
    
    const nextBtn = document.createElement('button');
    nextBtn.className = 'page-btn';
    nextBtn.innerHTML = '&rarr;';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.onclick = () => { currentPage++; renderGrid(); window.scrollTo({top: 0, behavior: 'smooth'}); };
    paginationContainer.appendChild(nextBtn);
}

function createPageBtn(pageNum) {
    const btn = document.createElement('button');
    btn.className = `page-btn ${pageNum === currentPage ? 'active' : ''}`;
    btn.textContent = pageNum;
    btn.onclick = () => {
        currentPage = pageNum;
        renderGrid();
        window.scrollTo({top: 0, behavior: 'smooth'});
    };
    return btn;
}

function setupModal() {
    if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', closeModal);
    }
    if (modalDownloadBtn) {
        modalDownloadBtn.addEventListener('click', () => {
            if (currentVideoId) {
                window.open(`https://ssyoutube.com/watch?v=${currentVideoId}`, '_blank');
            }
        });
    }
    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) closeModal();
        });
    }
}

function openModal(videoId) {
    if (!modalOverlay || !modalIframe) return;
    currentVideoId = videoId;
    modalIframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    if (!modalOverlay || !modalIframe) return;
    currentVideoId = null;
    modalIframe.src = ''; 
    modalOverlay.classList.remove('active');
    document.body.style.overflow = '';
}

document.addEventListener('DOMContentLoaded', init);
