// Lu ngapain njing
// pergi but 

document.addEventListener('DOMContentLoaded', function() {
    const platformSelect = document.getElementById('platformSelect');
    const usernameInput = document.getElementById('usernameInput');
    const searchBtn = document.getElementById('searchBtn');
    const resultsSection = document.getElementById('resultsSection');
    
    platformSelect.addEventListener('change', function() {
        updatePlaceholder();
    });
    
    function updatePlaceholder() {
        const platform = platformSelect.value;
        const placeholders = {
            'instagram': 'Masukkan username Instagram...',
            'tiktok': 'Masukkan username TikTok...'
        };
        usernameInput.placeholder = placeholders[platform] || 'Masukkan username...';
    }
    
    searchBtn.addEventListener('click', searchUser);
    usernameInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchUser();
        }
    });
    
    function searchUser() {
        const platform = platformSelect.value;
        const username = usernameInput.value.trim();
        
        if (!username) {
            showNotification('Masukkan username terlebih dahulu', 'error');
            return;
        }
        
        const resetLoading = showLoading(searchBtn, 'Mencari...');
        resultsSection.style.display = 'block';
        resultsSection.innerHTML = `
            <div class="loading-state">
                <div class="loading-spinner"></div>
                <p>Mencari informasi ${platform}...</p>
            </div>
        `;
        
        let apiCall;
        switch(platform) {
            case 'instagram':
                apiCall = zhadevAPI.Stalker.instagram(username);
                break;
            case 'tiktok':
                apiCall = zhadevAPI.Stalker.tiktok(username);
                break;
            default:
                showNotification('Platform belum didukung', 'error');
                resetLoading();
                return;
        }
        
        apiCall
            .then(response => {
                resetLoading();
                
                if (response && response.success) {
                    displayUserInfo(response.data || response.result, platform);
                } else {
                    throw new Error(response?.message || 'Gagal mengambil data pengguna');
                }
            })
            .catch(error => {
                resetLoading();
                showErrorState(error.message);
                console.error('Stalker API Error:', error);
            });
    }
    
    function displayUserInfo(userData, platform) {
        let html = '';
        
        if (platform === 'instagram') {
            html = `
                <div class="user-profile-card">
                    <div class="profile-header">
                        <img src="${userData.profile_pic}" alt="${userData.username}" class="profile-pic">
                        <div class="profile-info">
                            <h2>${userData.name || userData.username}</h2>
                            <p class="username">@${userData.username}</p>
                            <p class="bio">${userData.bio || 'Tidak ada bio'}</p>
                        </div>
                    </div>
                    <div class="profile-stats">
                        <div class="stat">
                            <div class="stat-number">${formatNumber(userData.followers)}</div>
                            <div class="stat-label">Pengikut</div>
                        </div>
                        <div class="stat">
                            <div class="stat-number">${formatNumber(userData.following)}</div>
                            <div class="stat-label">Mengikuti</div>
                        </div>
                        <div class="stat">
                            <div class="stat-number">${formatNumber(userData.posts)}</div>
                            <div class="stat-label">Postingan</div>
                        </div>
                    </div>
                    ${userData.verified ? '<div class="verified-badge"><i class="fas fa-check-circle"></i> Terverifikasi</div>' : ''}
                </div>
            `;
        } else if (platform === 'tiktok') {
            html = `
                <div class="user-profile-card">
                    <div class="profile-header">
                        <img src="${userData.avatar || '../assets/img/placeholder.jpg'}" alt="${userData.nickname}" class="profile-pic">
                        <div class="profile-info">
                            <h2>${userData.nickname || userData.unique_id}</h2>
                            <p class="username">@${userData.unique_id}</p>
                            <p class="bio">${userData.signature || 'Tidak ada bio'}</p>
                        </div>
                    </div>
                    <div class="profile-stats">
                        <div class="stat">
                            <div class="stat-number">${formatNumber(userData.followers_count)}</div>
                            <div class="stat-label">Pengikut</div>
                        </div>
                        <div class="stat">
                            <div class="stat-number">${formatNumber(userData.following_count)}</div>
                            <div class="stat-label">Mengikuti</div>
                        </div>
                        <div class="stat">
                            <div class="stat-number">${formatNumber(userData.video_count)}</div>
                            <div class="stat-label">Video</div>
                        </div>
                    </div>
                    ${userData.verified ? '<div class="verified-badge"><i class="fas fa-check-circle"></i> Terverifikasi</div>' : ''}
                </div>
            `;
        }
        
        resultsSection.innerHTML = html;
    }
    
    function showErrorState(message) {
        resultsSection.innerHTML = `
            <div class="error-state">
                <div class="error-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h3>Gagal Mencari Pengguna</h3>
                <p>${message}</p>
                <button class="btn btn-secondary" onclick="searchUser()">Coba Lagi</button>
            </div>
        `;
    }
    
    updatePlaceholder();
});