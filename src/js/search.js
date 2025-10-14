// Lu ngapain njing
// pergi but 

document.addEventListener('DOMContentLoaded', function() {
    const platformSelect = document.getElementById('platformSelect');
    const queryInput = document.getElementById('queryInput');
    const searchBtn = document.getElementById('searchBtn');
    const resultsSection = document.getElementById('resultsSection');
    
    platformSelect.addEventListener('change', function() {
        updatePlaceholder();
    });
    
    function updatePlaceholder() {
        const platform = platformSelect.value;
        const placeholders = {
            'bstation': 'Cari anime atau video...',
            'pinterest': 'Cari gambar atau ide...',
            'spotify': 'Cari lagu atau artis...',
            'youtube': 'Cari video YouTube...',
            'tiktok': 'Cari video TikTok...'
        };
        queryInput.placeholder = placeholders[platform] || 'Masukkan kata kunci pencarian...';
    }
    
    searchBtn.addEventListener('click', performSearch);
    queryInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
    
    function performSearch() {
        const platform = platformSelect.value;
        const query = queryInput.value.trim();
        
        if (!query) {
            showNotification('Masukkan kata kunci pencarian terlebih dahulu', 'error');
            return;
        }
        
        const resetLoading = showLoading(searchBtn, 'Mencari...');
        resultsSection.style.display = 'block';
        resultsSection.innerHTML = `
            <div class="loading-state">
                <div class="loading-spinner"></div>
                <p>Mencari di ${platform}...</p>
            </div>
        `;
        
        let apiCall;
        switch(platform) {
            case 'bstation':
                apiCall = zhadevAPI.Search.bstation(query);
                break;
            case 'pinterest':
                apiCall = zhadevAPI.Search.pinterest(query);
                break;
            case 'spotify':
                apiCall = zhadevAPI.Search.spotify(query);
                break;
            case 'youtube':
                apiCall = zhadevAPI.Search.youtube(query);
                break;
            case 'tiktok':
                apiCall = zhadevAPI.Search.tiktok(query);
                break;
            default:
                showNotification('Platform belum didukung', 'error');
                resetLoading();
                return;
        }
        
        apiCall
            .then(response => {
                resetLoading();
                
                if (response && (response.success || response.succes)) {
                    displaySearchResults(response.result || response.data, platform);
                } else {
                    throw new Error(response?.message || 'Gagal melakukan pencarian');
                }
            })
            .catch(error => {
                resetLoading();
                showErrorState(error.message);
                console.error('Search API Error:', error);
            });
    }
    
    function displaySearchResults(results, platform) {
        let html = '<div class="search-results">';
        
        if (!results || (Array.isArray(results) && results.length === 0)) {
            html = `
                <div class="no-results">
                    <i class="fas fa-search"></i>
                    <h3>Tidak ada hasil ditemukan</h3>
                    <p>Coba dengan kata kunci yang berbeda</p>
                </div>
            `;
        } else if (platform === 'pinterest' && Array.isArray(results)) {
            html += '<h3 class="results-count">Ditemukan ' + results.length + ' gambar</h3>';
            html += '<div class="pinterest-grid">';
            results.forEach(imageUrl => {
                html += `
                    <div class="pinterest-item">
                        <img src="${imageUrl}" alt="Pinterest Image" loading="lazy">
                        <div class="pinterest-actions">
                            <a href="${imageUrl}" target="_blank" class="btn-download">
                                <i class="fas fa-download"></i>
                            </a>
                        </div>
                    </div>
                `;
            });
            html += '</div>';
        } else if (platform === 'spotify' && Array.isArray(results)) {
            html += '<h3 class="results-count">Ditemukan ' + results.length + ' lagu</h3>';
            results.forEach(track => {
                html += `
                    <div class="spotify-track">
                        <div class="track-info">
                            <h4>${track.name}</h4>
                            <p class="artist">${track.artists}</p>
                            <p class="album">${track.album}</p>
                        </div>
                        <a href="${track.url}" target="_blank" class="btn-spotify">
                            <i class="fab fa-spotify"></i> Buka di Spotify
                        </a>
                    </div>
                `;
            });
        } else if (platform === 'youtube' && Array.isArray(results)) {
            html += '<h3 class="results-count">Ditemukan ' + results.length + ' video</h3>';
            results.forEach(video => {
                html += `
                    <div class="youtube-video">
                        <div class="video-thumbnail">
                            <img src="${video.thumbnail}" alt="${video.title}">
                            <div class="video-duration">${video.duration}</div>
                        </div>
                        <div class="video-info">
                            <h4>${video.title}</h4>
                            <p class="channel">${video.author}</p>
                            <p class="views">${video.views} views • ${video.uploadDate}</p>
                            <a href="${video.url}" target="_blank" class="btn-youtube">
                                <i class="fab fa-youtube"></i> Tonton di YouTube
                            </a>
                        </div>
                    </div>
                `;
            });
        } else if (platform === 'tiktok' && Array.isArray(results)) {
            html += '<h3 class="results-count">Ditemukan ' + results.length + ' video</h3>';
            html += '<div class="tiktok-grid">';
            results.forEach((videoUrl, index) => {
                html += `
                    <div class="tiktok-video">
                        <video controls>
                            <source src="${videoUrl}" type="video/mp4">
                            Browser Anda tidak mendukung video tag.
                        </video>
                        <a href="${videoUrl}" download="tiktok_video_${index + 1}.mp4" class="btn-download">
                            <i class="fas fa-download"></i> Download
                        </a>
                    </div>
                `;
            });
            html += '</div>';
        } else if (platform === 'bstation' && Array.isArray(results)) {
            results.forEach(item => {
                html += `
                    <div class="bstation-item">
                        <div class="anime-poster">
                            <img src="${item.imageUrl}" alt="${item.search}">
                        </div>
                        <div class="anime-info">
                            <h4>${item.search}</h4>
                            <p class="views">${item.views}</p>
                            <p class="description">${item.description}</p>
                            <a href="${item.videoUrl}" target="_blank" class="btn-watch">
                                <i class="fas fa-play"></i> Tonton Sekarang
                            </a>
                        </div>
                    </div>
                `;
            });
        }
        
        html += '</div>';
        resultsSection.innerHTML = html;
    }
    
    function showErrorState(message) {
        resultsSection.innerHTML = `
            <div class="error-state">
                <div class="error-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h3>Gagal Melakukan Pencarian</h3>
                <p>${message}</p>
                <button class="btn btn-secondary" onclick="performSearch()">Coba Lagi</button>
            </div>
        `;
    }
    
    updatePlaceholder();
});