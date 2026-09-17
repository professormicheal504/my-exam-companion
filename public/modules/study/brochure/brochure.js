const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:';
const R2_BASE_URL = isLocal ? '../../../../new_staging_area' : 'https://pub-d048d28d4cd54d579def4bf758d5a298.r2.dev';
let currentCountryCode = 'ng'; // Default to Nigeria for now

function toSlug(name, id) {
  const slugName = (name || 'institution')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 60);
  return `${slugName}-${id}`;
}

const premiumAdStyles = `
    .ad-container-premium {
      background: rgba(255, 255, 255, 0.8);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(229, 231, 235, 0.8);
      border-radius: 16px;
      padding: 16px;
      margin: 16px auto;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0,0,0,0.02);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      max-width: fit-content;
      position: relative;
      overflow: hidden;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }
    .ad-container-premium:hover {
      transform: translateY(-2px);
      box-shadow: 0 15px 35px rgba(0, 0, 0, 0.06), 0 3px 6px rgba(0,0,0,0.03);
    }
    .ad-container-premium::before {
      content: 'ADVERTISEMENT';
      display: block;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #9ca3af;
      margin-bottom: 12px;
      text-align: center;
      width: 100%;
    }
    [data-theme="dark"] .ad-container-premium {
      background: rgba(30, 41, 59, 0.8);
      border-color: rgba(51, 65, 85, 0.8);
    }
`;
if (!document.getElementById('premium-ad-styles')) {
    const styleEl = document.createElement('style');
    styleEl.id = 'premium-ad-styles';
    styleEl.innerHTML = premiumAdStyles;
    document.head.appendChild(styleEl);
}

let allInstitutions = [];
let filteredInstitutions = [];
let currentPage = 1;
const ITEMS_PER_PAGE = 20;

// DOM Elements
const typeFilter = document.getElementById('typeFilter');
const ownershipFilter = document.getElementById('ownershipFilter');
const searchInput = document.getElementById('searchInput');
const institutionList = document.getElementById('institutionList');
const paginationContainer = document.getElementById('pagination');

// Read country from Edge Function params (clean URL) or URL query param
if (window.MEC_BROCHURE_PARAMS && window.MEC_BROCHURE_PARAMS.country) {
    currentCountryCode = window.MEC_BROCHURE_PARAMS.country;
} else {
    const _urlP = new URLSearchParams(window.location.search);
    if (_urlP.get('c')) currentCountryCode = _urlP.get('c');
}

async function init() {
    try {
        const res = await fetch(`${R2_BASE_URL}/${currentCountryCode}/brochure/institutions.json?t=${new Date().getTime()}`);
        if (!res.ok) throw new Error('Failed to fetch institutions list');
        
        allInstitutions = await res.json();
        filteredInstitutions = [...allInstitutions];
        
        populateFilters();
        renderList();
        
        // Event Listeners
        typeFilter.addEventListener('change', applyFilters);
        ownershipFilter.addEventListener('change', applyFilters);
        searchInput.addEventListener('input', applyFilters);
        
    } catch (err) {
        console.error("Error loading brochure:", err);
        institutionList.innerHTML = `<div style="padding: 40px; text-align: center; color: #ef4444;">Failed to load brochure data. Make sure the extraction is pushed to Cloudflare R2.</div>`;
    }
}

function populateFilters() {
    const types = new Set();
    const ownerships = new Set();
    
    allInstitutions.forEach(inst => {
        if (inst.program_type && inst.program_type !== 'Unknown') types.add(inst.program_type);
        if (inst.ownership) ownerships.add(inst.ownership);
    });
    
    // Sort sets and append to selects
    Array.from(types).sort().forEach(type => {
        const opt = document.createElement('option');
        opt.value = type;
        opt.textContent = type;
        typeFilter.appendChild(opt);
    });
    
    Array.from(ownerships).sort().forEach(own => {
        const opt = document.createElement('option');
        opt.value = own;
        opt.textContent = own;
        ownershipFilter.appendChild(opt);
    });
}

function applyFilters() {
    const type = typeFilter.value;
    const ownership = ownershipFilter.value;
    const search = searchInput.value.toLowerCase();
    
    filteredInstitutions = allInstitutions.filter(inst => {
        const matchType = type === 'All' || inst.program_type === type;
        const matchOwnership = ownership === 'All' || inst.ownership === ownership;
        
        const schoolName = (inst.school_name || '').toLowerCase();
        const abbr = (inst.abbreviation || '').toLowerCase();
        const matchSearch = schoolName.includes(search) || abbr.includes(search);
        
        return matchType && matchOwnership && matchSearch;
    });
    
    currentPage = 1;
    renderList();
}

function renderList() {
    institutionList.innerHTML = '';
    
    if (filteredInstitutions.length === 0) {
        institutionList.innerHTML = `<div style="padding: 40px; text-align: center; color: var(--text-secondary);">No institutions found matching your criteria.</div>`;
        paginationContainer.innerHTML = '';
        return;
    }
    
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedItems = filteredInstitutions.slice(startIndex, endIndex);
    
    paginatedItems.forEach((inst, index) => {
        const card = document.createElement('div');
        card.className = 'institution-card';
        
        let stateText = inst.state ? `, ${inst.state} STATE` : '';
        let fullName = `${inst.school_name || 'UNKNOWN INSTITUTION'}${stateText}`;
        let progBadge = (inst.program_type && inst.program_type !== 'Unknown') 
            ? `<span style="font-size: 11px; background: #eef2ff; color: #4f46e5; padding: 2px 8px; border-radius: 4px; font-weight: 600; text-transform: uppercase;">${inst.program_type}</span>` 
            : '';
        
        card.innerHTML = `
            <div class="institution-info">
                <div class="institution-name">${fullName}</div>
                <div style="margin-top: 4px;">${progBadge}</div>
            </div>
            <a href="/${currentCountryCode}/study/brochure/${toSlug(inst.school_name, inst.id)}" class="btn-view-courses">
                View Courses
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
            </a>
        `;
        institutionList.appendChild(card);
        
        // Insert ad placeholder every 5 items
        if ((index + 1) % 5 === 0 && index !== paginatedItems.length - 1) {
            const adCount = Math.floor((index + 1) / 5);
            const zone = adCount % 2 === 1 ? 'multitag_300x250' : 'multitag_300x250_2';
            const adWrapper = document.createElement('div');
            adWrapper.className = 'ad-container-premium';
            adWrapper.style.cssText = 'width: 100%; box-sizing: border-box;';
            
            const adSlot = document.createElement('div');
            adSlot.className = 'mec-ad-slot';
            adSlot.setAttribute('data-zone', zone);
            
            adWrapper.appendChild(adSlot);
            institutionList.appendChild(adWrapper);
        }
    });
    
    renderPagination();
}

function renderPagination() {
    const totalPages = Math.ceil(filteredInstitutions.length / ITEMS_PER_PAGE);
    paginationContainer.innerHTML = '';
    
    if (totalPages <= 1) return;
    
    // Previous Button
    const prevBtn = document.createElement('button');
    prevBtn.className = 'page-nav-btn';
    prevBtn.disabled = currentPage === 1;
    prevBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16l-4-4m0 0l4-4m-4 4h18" />
        </svg>
        Previous
    `;
    prevBtn.onclick = () => { if (currentPage > 1) { currentPage--; renderList(); window.scrollTo(0,0); } };
    paginationContainer.appendChild(prevBtn);
    
    // Page Numbers Container
    const numbersContainer = document.createElement('div');
    numbersContainer.className = 'page-numbers';
    
    // Simple pagination display logic
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    
    if (endPage - startPage < 4 && totalPages > 4) {
        startPage = Math.max(1, endPage - 4);
    }
    
    if (startPage > 1) {
        const btn = createPageBtn(1);
        numbersContainer.appendChild(btn);
        if (startPage > 2) {
            const ellipsis = document.createElement('span');
            ellipsis.textContent = '...';
            ellipsis.style.color = 'var(--text-secondary)';
            numbersContainer.appendChild(ellipsis);
        }
    }
    
    for (let i = startPage; i <= endPage; i++) {
        numbersContainer.appendChild(createPageBtn(i));
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            const ellipsis = document.createElement('span');
            ellipsis.textContent = '...';
            ellipsis.style.color = 'var(--text-secondary)';
            numbersContainer.appendChild(ellipsis);
        }
        numbersContainer.appendChild(createPageBtn(totalPages));
    }
    
    paginationContainer.appendChild(numbersContainer);
    
    // Next Button
    const nextBtn = document.createElement('button');
    nextBtn.className = 'page-nav-btn';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.innerHTML = `
        Next
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
    `;
    nextBtn.onclick = () => { if (currentPage < totalPages) { currentPage++; renderList(); window.scrollTo(0,0); } };
    paginationContainer.appendChild(nextBtn);
}

function createPageBtn(num) {
    const btn = document.createElement('button');
    btn.className = `page-btn ${num === currentPage ? 'active' : ''}`;
    btn.textContent = num;
    btn.onclick = () => {
        currentPage = num;
        renderList();
        window.scrollTo(0, 0);
    };
    return btn;
}

// Start
document.addEventListener('DOMContentLoaded', init);
