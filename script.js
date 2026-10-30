let currentSemester = 'all';
let currentBranch = 'all';
let currentType = 'all';

function switchSemesterTab(sem, btnElement) {
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => tab.classList.remove('active'));
    if (btnElement) {
        btnElement.classList.add('active');
    }

    currentSemester = sem;
    applyFilters();
}

function applyFilters() {
    const branchSelect = document.getElementById('branchSelect');
    const typeSelect = document.getElementById('typeSelect');

    currentBranch = branchSelect ? branchSelect.value : 'all';
    currentType = typeSelect ? typeSelect.value : 'all';

    const cards = document.querySelectorAll('.resource-card');
    let visibleCount = 0;

    cards.forEach(card => {
        const cardSem = card.getAttribute('data-sem');
        const cardBranch = card.getAttribute('data-branch');
        const cardType = card.getAttribute('data-type');

        const semMatch = (currentSemester === 'all' || cardSem === currentSemester);
        const branchMatch = (currentBranch === 'all' || cardBranch === currentBranch);
        const typeMatch = (currentType === 'all' || cardType === currentType);

        if (semMatch && branchMatch && typeMatch) {
            card.style.display = 'flex';
            visibleCount++;
        } else {
            card.style.display = 'none';
        }
    });

    const noResultsDiv = document.getElementById('noResults');
    if (noResultsDiv) {
        noResultsDiv.style.display = (visibleCount === 0) ? 'block' : 'none';
    }
}

function handleGlobalSearch() {
    const searchInput = document.getElementById('globalSearchInput');
    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const cards = document.querySelectorAll('.resource-card');
    let visibleCount = 0;

    cards.forEach(card => {
        const titleEl = card.querySelector('h3');
        const descEl = card.querySelector('p');
        const codeElement = card.querySelector('.badge-code');

        const title = titleEl ? titleEl.innerText.toLowerCase() : '';
        const description = descEl ? descEl.innerText.toLowerCase() : '';
        const branch = card.getAttribute('data-branch') ? card.getAttribute('data-branch').toLowerCase() : '';
        const code = codeElement ? codeElement.innerText.toLowerCase() : '';

        if (title.includes(query) || description.includes(query) || branch.includes(query) || code.includes(query)) {
            card.style.display = 'flex';
            visibleCount++;
        } else {
            card.style.display = 'none';
        }
    });

    const noResultsDiv = document.getElementById('noResults');
    if (noResultsDiv) {
        noResultsDiv.style.display = (visibleCount === 0) ? 'block' : 'none';
    }
}

function filterByBranch(branchName) {
    const branchSelect = document.getElementById('branchSelect');
    if (branchSelect) {
        branchSelect.value = branchName;
    }
    
    const semestersSection = document.getElementById('semesters');
    if (semestersSection) {
        semestersSection.scrollIntoView({ behavior: 'smooth' });
    }
    applyFilters();
}

function resetFilters() {
    currentSemester = 'all';
    currentBranch = 'all';
    currentType = 'all';

    const branchSelect = document.getElementById('branchSelect');
    const typeSelect = document.getElementById('typeSelect');
    const searchInput = document.getElementById('globalSearchInput');

    if (branchSelect) branchSelect.value = 'all';
    if (typeSelect) typeSelect.value = 'all';
    if (searchInput) searchInput.value = '';

    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach((tab, index) => {
        if (index === 0) tab.classList.add('active');
        else tab.classList.remove('active');
    });

    applyFilters();
}

function downloadNotice(resourceName) {
    alert(`Starting download for: ${resourceName}\n(DPG Polytechnic HSBTE Verified Academic PDF)`);
}

function toggleAIChat() {
    const modal = document.getElementById('aiChatModal');
    if (modal) {
        modal.style.display = (modal.style.display === 'flex') ? 'none' : 'flex';
    }
}

function handleAIEnter(e) {
    if (e.key === 'Enter') {
        sendAIMessage();
    }
}

async function sendAIMessage() {
    const input = document.getElementById('aiUserInput');
    const chatBody = document.getElementById('aiChatBody');
    if (!input || !chatBody) return;

    const text = input.value.trim();
    if (!text) return;


    chatBody.innerHTML += `<div class="user-msg">${escapeHtml(text)}</div>`;
    input.value = '';
    chatBody.scrollTop = chatBody.scrollHeight;

    const typingId = 'typing-' + Date.now();
    chatBody.innerHTML += `<div class="ai-msg" id="${typingId}"><i class="fa-solid fa-spinner fa-spin"></i> Google Gemma is analyzing your question...</div>`;
    chatBody.scrollTop = chatBody.scrollHeight;

    try {
        
        const response = await fetch('http://localhost:5000/api/ai-chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message: text })
        });

        const data = await response.json();
        const typingEl = document.getElementById(typingId);

        if (typingEl) {
            if (data.reply) {
                typingEl.innerHTML = `<strong>Google Gemma AI:</strong><br>${escapeHtml(data.reply).replace(/\n/g, '<br>')}`;
            } else {
                typingEl.innerHTML = `<strong>Error:</strong> ${data.error || 'Failed to fetch response'}`;
            }
            chatBody.scrollTop = chatBody.scrollHeight;
        }
    } catch (error) {
        console.error('Chat Error:', error);
        const typingEl = document.getElementById(typingId);
        if (typingEl) {
            typingEl.innerHTML = `<strong>Server Error:</strong> Could not connect to the backend server. Check whether the Node server is running!`;
            chatBody.scrollTop = chatBody.scrollHeight;
        }
    }
}

async function uploadAndSolvePDF(fileInputId) {
    const fileInput = document.getElementById(fileInputId);
    if (!fileInput || !fileInput.files[0]) {
        alert("Pehle koi PDF file select karein!");
        return;
    }

    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append('pdfFile', file);

    const chatBody = document.getElementById('aiChatBody');
    if(chatBody) {
        chatBody.innerHTML += `<div class="user-msg">Uploaded PDF: ${file.name}</div>`;
        chatBody.innerHTML += `<div class="ai-msg" id="pdf-loading"><i class="fa-solid fa-spinner fa-spin"></i> Reading PDF & Solving questions via Google Gemma...</div>`;
        chatBody.scrollTop = chatBody.scrollHeight;
    }

    try {
        const response = await fetch('http://localhost:5000/api/solve-pdf', {
            method: 'POST',
            body: formData 
        });

        const data = await response.json();
        const loadingEl = document.getElementById('pdf-loading');

        if (loadingEl) {
            if (data.solution) {
                loadingEl.innerHTML = `<strong>PDF Solution by Google Gemma:</strong><br>${escapeHtml(data.solution).replace(/\n/g, '<br>')}`;
            } else {
                loadingEl.innerHTML = `<strong>Error:</strong> ${data.error || 'Failed to solve PDF'}`;
            }
            chatBody.scrollTop = chatBody.scrollHeight;
        }
    } catch (error) {
        console.error('PDF Upload Error:', error);
        const loadingEl = document.getElementById('pdf-loading');
        if (loadingEl) {
            loadingEl.innerHTML = `<strong>Error:</strong> A server error occurred while processing the PDF`;
            chatBody.scrollTop = chatBody.scrollHeight;
        }
    }
}

function escapeHtml(string) {
    return string.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}