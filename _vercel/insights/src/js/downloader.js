// Lu ngapain njing
// pergi but 

document.addEventListener('DOMContentLoaded', function() {
    const videoUrlInput = document.getElementById('videoUrl');
    const fetchVideoBtn = document.getElementById('fetchVideo');
    const resultsSection = document.getElementById('resultsSection');
    const loadingState = document.getElementById('loadingState');
    const videoInfoCard = document.getElementById('videoInfoCard');
    const errorState = document.getElementById('errorState');
    const retryButton = document.getElementById('retryButton');
    const historyList = document.getElementById('historyList');
    const platformSelect = document.getElementById('platformSelect');
    
    const fileOptionsSection = document.getElementById('fileOptionsSection');
    const imageOptionsSection = document.getElementById('imageOptionsSection');
    const fileQualityOptions = document.getElementById('fileQualityOptions');
    const imageQualityOptions = document.getElementById('imageQualityOptions');
    
    let currentUrl = '';
    let downloadHistory = JSON.parse(localStorage.getItem('zhadev_download_history')) || [];
    
    loadDownloadHistory();
    autoCleanHistory();
    
    fetchVideoBtn.addEventListener('click', fetchVideoInfo);
    
    videoUrlInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            fetchVideoInfo();
        }
    });
    
    retryButton.addEventListener('click', fetchVideoInfo);
    
    platformSelect.addEventListener('change', updatePlatformPlaceholder);
    
    function updatePlatformPlaceholder() {
        const platform = platformSelect.value;
        const placeholders = {
            'auto': 'Masukan URL',
            'youtube': 'https://www.youtube.com/watch?v=... atau https://youtu.be/...',
            'tiktok': 'https://www.tiktok.com/@username/video/...',
            'instagram': 'https://www.instagram.com/p/... atau https://www.instagram.com/reel/...',
            'facebook': 'https://www.facebook.com/watch/?v=...',
            'douyin': 'https://www.douyin.com/video/...',
            'spotify': 'https://open.spotify.com/track/...',
            'bilibili': 'https://www.bilibili.com/video/...',
            'capcut': 'https://www.capcut.com/template/...',
            'threads': 'https://www.threads.net/@username/post/...',
            'pinterest': 'https://www.pinterest.com/pin/...',
            'github': 'https://github.com/username/repository',
            'gdrive': 'https://drive.google.com/file/d/.../view'
        };
        
        videoUrlInput.placeholder = placeholders[platform] || placeholders.auto;
    }
    
    function fetchVideoInfo() {
        const url = videoUrlInput.value.trim();
        const selectedPlatform = platformSelect.value;
        
        if (!url) {
            showNotification('Masukkan URL video terlebih dahulu', 'error');
            return;
        }
        
        if (!isValidUrl(url)) {
            showNotification('URL tidak valid', 'error');
            return;
        }
        
        currentUrl = url;
        const detectedPlatform = detectPlatform(url);
        
        if (selectedPlatform !== 'auto' && selectedPlatform !== detectedPlatform) {
            const confirmDownload = confirm(`URL terdeteksi sebagai ${detectedPlatform}, tetapi Anda memilih ${selectedPlatform}. Lanjutkan?`);
            if (!confirmDownload) return;
        }
        
        const platform = selectedPlatform === 'auto' ? detectedPlatform : selectedPlatform;
        
        showLoadingState();
        
        fileOptionsSection.style.display = 'none';
        imageOptionsSection.style.display = 'none';
        
        let apiCall;
        switch(platform) {
            case 'youtube':
                apiCall = zhadevAPI.Downloader.ytmp4(url);
                break;
            case 'tiktok':
                apiCall = zhadevAPI.Downloader.tiktok(url);
                break;
            case 'instagram':
                apiCall = zhadevAPI.Downloader.instagram(url);
                break;
            case 'facebook':
                apiCall = zhadevAPI.Downloader.facebook(url);
                break;
            case 'douyin':
                apiCall = zhadevAPI.Downloader.douyin(url);
                break;
            case 'spotify':
                apiCall = zhadevAPI.Downloader.spotify(url);
                break;
            case 'bilibili':
                apiCall = zhadevAPI.Downloader.bilibili(url);
                break;
            case 'capcut':
                apiCall = zhadevAPI.Downloader.capcut(url);
                break;
            case 'threads':
                apiCall = zhadevAPI.Downloader.threads(url);
                break;
            case 'pinterest':
                apiCall = zhadevAPI.Downloader.pinterest(url);
                break;
            case 'github':
                apiCall = zhadevAPI.Downloader.github(url);
                break;
            case 'gdrive':
                apiCall = zhadevAPI.Downloader.gdrive(url);
                break;
            default:
                showErrorState(`Platform ${platform} belum didukung`);
                return;
        }
        
        apiCall
            .then(response => {
                hideLoadingState();
                
                if (response && response.success) {
                    const videoData = zhadevAPI.handleDownloaderResponse(response, platform);
                    displayVideoInfo(videoData, platform);
                    addToDownloadHistory(url, videoData, platform);
                } else {
                    throw new Error(response?.message || `Gagal mengambil data dari ${platform}`);
                }
            })
            .catch(error => {
                hideLoadingState();
                showErrorState(error.message);
                console.error('Downloader API Error:', error);
            });
    }
    
    function displayVideoInfo(videoData, platform) {
        if (!videoData) {
            showErrorState('Data video tidak valid');
            return;
        }
        
        const title = getVideoTitle(videoData, platform);
        const description = getVideoDescription(videoData, platform);
        const thumbnail = getVideoThumbnail(videoData, platform);
        const creator = getVideoCreator(videoData, platform);
        const publishDate = getPublishDate(videoData, platform);
        const viewCount = getViewCount(videoData, platform);
        const likes = getLikesCount(videoData, platform);
        const comments = getCommentsCount(videoData, platform);
        const shares = getSharesCount(videoData, platform);
        
        document.getElementById('videoTitle').textContent = title;
        document.getElementById('videoDescription').textContent = description.length > 200 ? description.substring(0, 200) + '...' : description;
        
        const thumbnailImg = document.getElementById('videoThumbnail');
        if (thumbnail) {
            thumbnailImg.src = thumbnail;
            thumbnailImg.style.display = 'block';
        } else {
            thumbnailImg.style.display = 'none';
        }
        
        document.getElementById('creatorName').textContent = creator;
        document.getElementById('publishDate').textContent = publishDate;
        
        let viewText = viewCount;
        if (likes) viewText += ` • ${likes} likes`;
        if (comments) viewText += ` • ${comments} comments`;
        if (shares) viewText += ` • ${shares} shares`;
        
        document.getElementById('viewCount').textContent = viewText;
        
        generateDownloadOptions(videoData, platform);
        
        videoInfoCard.style.display = 'block';
        errorState.style.display = 'none';
        resultsSection.style.display = 'block';
    }
    
    function getVideoTitle(videoData, platform) {
        switch(platform) {
            case 'tiktok':
                return videoData.title || videoData.data?.title || 'Judul tidak tersedia';
            case 'youtube':
                return videoData.metadata?.title || videoData.data?.metadata?.title || 'Judul tidak tersedia';
            case 'instagram':
                return videoData.metadata?.title || videoData.data?.metadata?.title || 'Instagram Video';
            case 'douyin':
                return videoData.title || videoData.result?.title || 'Judul tidak tersedia';
            case 'facebook':
                return videoData.title || videoData.data?.title || 'Facebook Video';
            case 'spotify':
                return videoData.title || videoData.data?.title || 'Spotify Track';
            case 'bilibili':
                return videoData.title || videoData.data?.title || 'Judul tidak tersedia';
            case 'capcut':
                return videoData.title || videoData.data?.title || 'CapCut Template';
            case 'threads':
                return videoData.title || 'Threads Video';
            case 'pinterest':
                return videoData.title || 'Pinterest Post';
            case 'github':
                return videoData.name || videoData.result?.name || 'GitHub Repository';
            case 'gdrive':
                return videoData.fileName || videoData.data?.fileName || 'Google Drive File';
            default:
                return videoData.title || videoData.data?.title || videoData.result?.title || 'Judul tidak tersedia';
        }
    }
    
    function getVideoDescription(videoData, platform) {
        switch(platform) {
            case 'tiktok':
                return videoData.description || videoData.data?.description || '';
            case 'youtube':
                return videoData.metadata?.description || videoData.data?.metadata?.description || '';
            case 'instagram':
                return videoData.metadata?.description || videoData.data?.metadata?.description || '';
            case 'douyin':
                return videoData.description || videoData.result?.description || '';
            case 'bilibili':
                return videoData.description || videoData.data?.description || '';
            case 'capcut':
                return videoData.description || videoData.data?.description || '';
            case 'github':
                return videoData.description || videoData.result?.description || '';
            default:
                return videoData.description || videoData.data?.description || '';
        }
    }
    
    function getVideoThumbnail(videoData, platform) {
        switch(platform) {
            case 'tiktok':
                return videoData.cover || videoData.data?.cover;
            case 'youtube':
                return videoData.metadata?.thumbnail || videoData.data?.metadata?.thumbnail;
            case 'instagram':
                return videoData.thumbnailUrl || videoData.data?.thumbnailUrl;
            case 'douyin':
                return videoData.thumbnail || videoData.result?.thumbnail;
            case 'facebook':
                return videoData.thumbnail || videoData.data?.thumbnail;
            case 'spotify':
                return videoData.thumbnail || videoData.data?.thumbnail;
            case 'bilibili':
                return videoData.cover || videoData.data?.cover;
            case 'capcut':
                return videoData.posterUrl || videoData.data?.posterUrl;
            case 'threads':
                return videoData.thumbnail || videoData.result?.thumbnail;
            case 'pinterest':
                return videoData.thumb || videoData.data?.thumb;
            case 'github':
                return videoData.owner_avatar || videoData.result?.owner_avatar;
            default:
                return videoData.thumbnail || videoData.cover || videoData.data?.thumbnail || videoData.data?.cover;
        }
    }
    
    function getVideoCreator(videoData, platform) {
        switch(platform) {
            case 'tiktok':
                if (videoData.author) {
                    return videoData.author.nickname || videoData.author.unique_id || 'Unknown';
                }
                if (videoData.data?.author) {
                    return videoData.data.author.nickname || videoData.data.author.unique_id || 'Unknown';
                }
                return 'Unknown';
            case 'youtube':
                return videoData.metadata?.author || videoData.data?.metadata?.author || 'Unknown';
            case 'instagram':
                return videoData.metadata?.username || videoData.data?.metadata?.username || 'Unknown';
            case 'douyin':
                return videoData.author || videoData.result?.author || 'Unknown';
            case 'spotify':
                return videoData.artist || videoData.data?.artist || 'Unknown';
            case 'bilibili':
                return videoData.author || videoData.data?.author || 'Unknown';
            case 'capcut':
                if (videoData.author) {
                    return videoData.author.name || 'Unknown';
                }
                if (videoData.data?.author) {
                    return videoData.data.author.name || 'Unknown';
                }
                return 'Unknown';
            case 'github':
                return videoData.owner || videoData.result?.owner || 'Unknown';
            default:
                return videoData.author || videoData.data?.author || 'Unknown';
        }
    }
    
    function getPublishDate(videoData, platform) {
        switch(platform) {
            case 'youtube':
                return videoData.metadata?.upload || videoData.data?.metadata?.upload || 'Tidak tersedia';
            case 'instagram':
                if (videoData.metadata?.takenAt) {
                    return new Date(videoData.metadata.takenAt * 1000).toLocaleDateString('id-ID');
                }
                return 'Tidak tersedia';
            case 'tiktok':
                if (videoData.created_at) {
                    return new Date(videoData.created_at).toLocaleDateString('id-ID');
                }
                return 'Tidak tersedia';
            case 'capcut':
                return videoData.date || videoData.data?.date || 'Tidak tersedia';
            case 'gdrive':
                return videoData.modified || videoData.data?.modified || 'Tidak tersedia';
            default:
                return 'Tidak tersedia';
        }
    }
    
    function getViewCount(videoData, platform) {
        switch(platform) {
            case 'tiktok':
                const views = videoData.play_count || videoData.data?.play_count;
                return views ? formatCount(views) + ' views' : 'Tidak tersedia';
            case 'youtube':
                const ytViews = videoData.metadata?.viewers || videoData.data?.metadata?.viewers;
                return ytViews ? formatCount(ytViews) + ' views' : 'Tidak tersedia';
            case 'instagram':
                const igViews = videoData.metadata?.like_count || videoData.data?.metadata?.like_count;
                return igViews ? formatCount(igViews) + ' likes' : 'Tidak tersedia';
            case 'bilibili':
                const biliViews = videoData.views || videoData.data?.views;
                return biliViews ? formatCount(biliViews) + ' views' : 'Tidak tersedia';
            case 'capcut':
                const capcutUses = videoData.pengguna || videoData.data?.pengguna;
                return capcutUses ? capcutUses : 'Tidak tersedia';
            case 'github':
                const stars = videoData.stars || videoData.result?.stars;
                return stars ? formatCount(stars) + ' stars' : 'Tidak tersedia';
            default:
                return 'Tidak tersedia';
        }
    }
    
    function getLikesCount(videoData, platform) {
        switch(platform) {
            case 'tiktok':
                return videoData.like_count || videoData.data?.like_count;
            case 'instagram':
                return videoData.metadata?.like_count || videoData.data?.metadata?.like_count;
            case 'bilibili':
                return videoData.like || videoData.data?.like;
            case 'capcut':
                return videoData.likes || videoData.data?.likes;
            default:
                return null;
        }
    }
    
    function getCommentsCount(videoData, platform) {
        switch(platform) {
            case 'tiktok':
                return videoData.comment_count || videoData.data?.comment_count;
            case 'instagram':
                return videoData.metadata?.comment_count || videoData.data?.metadata?.comment_count;
            default:
                return null;
        }
    }
    
    function getSharesCount(videoData, platform) {
        switch(platform) {
            case 'tiktok':
                return videoData.share_count || videoData.data?.share_count;
            default:
                return null;
        }
    }
    
    function generateDownloadOptions(videoData, platform) {
        const videoOptions = document.getElementById('videoQualityOptions');
        const audioOptions = document.getElementById('audioQualityOptions');
        
        videoOptions.innerHTML = '';
        audioOptions.innerHTML = '';
        fileQualityOptions.innerHTML = '';
        imageQualityOptions.innerHTML = '';
        
        fileOptionsSection.style.display = 'none';
        imageOptionsSection.style.display = 'none';
        
        switch(platform) {
            case 'tiktok':
                const tiktokVideo = videoData.play || videoData.data?.play;
                const tiktokAudio = videoData.music || videoData.data?.music;
                
                if (tiktokVideo) {
                    const option = createDownloadOption('video', 'Video Quality', tiktokVideo, 'video/mp4');
                    videoOptions.appendChild(option);
                }
                if (tiktokAudio) {
                    const option = createDownloadOption('audio', 'Audio MP3', tiktokAudio, 'audio/mpeg');
                    audioOptions.appendChild(option);
                }
                break;
                
            case 'youtube':
                const ytVideo = videoData.dlink || videoData.download || videoData.data?.dlink || videoData.data?.download;
                const ytAudio = videoData.audio || videoData.data?.audio;
                
                if (ytVideo) {
                    const option = createDownloadOption('video', 'Video MP4', ytVideo, 'video/mp4');
                    videoOptions.appendChild(option);
                }
                if (ytAudio) {
                    const option = createDownloadOption('audio', 'Audio MP3', ytAudio, 'audio/mpeg');
                    audioOptions.appendChild(option);
                }
                break;
                
            case 'instagram':
                const igVideos = videoData.videoUrls || videoData.data?.videoUrls;
                if (igVideos && igVideos.length > 0) {
                    igVideos.forEach((video, index) => {
                        const quality = video.quality || video.name || `Video ${index + 1}`;
                        const option = createDownloadOption('video', quality, video.url, 'video/mp4');
                        videoOptions.appendChild(option);
                    });
                }
                break;
                
            case 'douyin':
                const douyinDownload = videoData.download || videoData.result?.download;
                if (douyinDownload) {
                    if (douyinDownload.no_watermark) {
                        const option = createDownloadOption('video', 'No Watermark', douyinDownload.no_watermark, 'video/mp4');
                        videoOptions.appendChild(option);
                    }
                    if (douyinDownload.with_watermark) {
                        const option = createDownloadOption('video', 'With Watermark', douyinDownload.with_watermark, 'video/mp4');
                        videoOptions.appendChild(option);
                    }
                    if (douyinDownload.mp3) {
                        const option = createDownloadOption('audio', 'MP3 Audio', douyinDownload.mp3, 'audio/mpeg');
                        audioOptions.appendChild(option);
                    }
                }
                break;
                
            case 'facebook':
                const fbHd = videoData.hd || videoData.data?.hd;
                const fbSd = videoData.sd || videoData.data?.sd;
                
                if (fbHd) {
                    const option = createDownloadOption('video', 'HD Quality', fbHd, 'video/mp4');
                    videoOptions.appendChild(option);
                }
                if (fbSd) {
                    const option = createDownloadOption('video', 'SD Quality', fbSd, 'video/mp4');
                    videoOptions.appendChild(option);
                }
                break;
                
            case 'spotify':
                const spotifyAudio = videoData.download || videoData.data?.download;
                if (spotifyAudio) {
                    const option = createDownloadOption('audio', 'MP3 Audio', spotifyAudio, 'audio/mpeg');
                    audioOptions.appendChild(option);
                }
                break;
                
            case 'bilibili':
                const bilibiliHD = videoData.videoUrl || videoData.data?.videoUrl;
                if (bilibiliHD) {
                    const option = createDownloadOption('video', 'HD Quality', bilibiliHD, 'video/mp4');
                    videoOptions.appendChild(option);
                }
                break;
                
            case 'capcut':
                const capcutVideo = videoData.videoUrl || videoData.data?.videoUrl;
                if (capcutVideo) {
                    const option = createDownloadOption('video', 'Video Template', capcutVideo, 'video/mp4');
                    videoOptions.appendChild(option);
                }
                break;
                
            case 'threads':
                const threadsVideo = videoData.result || videoData.download;
                if (threadsVideo) {
                    const option = createDownloadOption('video', 'Video', threadsVideo, 'video/mp4');
                    videoOptions.appendChild(option);
                }
                break;
                
            case 'pinterest':
                const pinterestVideo = videoData.video || videoData.data?.video;
                const pinterestImage = videoData.image || videoData.data?.image;
                
                if (pinterestVideo) {
                    const option = createDownloadOption('video', 'Video', pinterestVideo, 'video/mp4');
                    videoOptions.appendChild(option);
                }
                if (pinterestImage) {
                    imageOptionsSection.style.display = 'block';
                    const option = createDownloadOption('image', 'Image', pinterestImage, 'image/jpeg');
                    imageQualityOptions.appendChild(option);
                }
                break;
                
            case 'github':
                const githubZip = videoData.download_zip || videoData.result?.download_zip;
                if (githubZip) {
                    fileOptionsSection.style.display = 'block';
                    const option = createDownloadOption('file', 'Download ZIP', githubZip, 'application/zip');
                    fileQualityOptions.appendChild(option);
                }
                break;
                
            case 'gdrive':
                const gdriveDownload = videoData.download || videoData.data?.download;
                if (gdriveDownload) {
                    fileOptionsSection.style.display = 'block';
                    const option = createDownloadOption('file', 'Download File', gdriveDownload, 'application/octet-stream');
                    fileQualityOptions.appendChild(option);
                }
                break;
                
            default:
                if (videoData.download) {
                    const option = createDownloadOption('video', 'Download', videoData.download, 'video/mp4');
                    videoOptions.appendChild(option);
                }
                if (videoData.video) {
                    const option = createDownloadOption('video', 'Video', videoData.video, 'video/mp4');
                    videoOptions.appendChild(option);
                }
                if (videoData.audio) {
                    const option = createDownloadOption('audio', 'Audio', videoData.audio, 'audio/mpeg');
                    audioOptions.appendChild(option);
                }
        }
        
        if (videoOptions.children.length === 0) {
            videoOptions.innerHTML = '<p class="no-options">Tidak ada opsi video tersedia</p>';
        }
        if (audioOptions.children.length === 0) {
            audioOptions.innerHTML = '<p class="no-options">Tidak ada opsi audio tersedia</p>';
        }
        if (fileQualityOptions.children.length === 0 && fileOptionsSection.style.display === 'block') {
            fileQualityOptions.innerHTML = '<p class="no-options">Tidak ada opsi file tersedia</p>';
        }
        if (imageQualityOptions.children.length === 0 && imageOptionsSection.style.display === 'block') {
            imageQualityOptions.innerHTML = '<p class="no-options">Tidak ada opsi gambar tersedia</p>';
        }
    }
    
    function createDownloadOption(type, label, url, mimeType = '') {
        const option = document.createElement('div');
        option.className = 'quality-option';
        
        const fileType = type === 'video' ? 'MP4' : 
                        type === 'audio' ? 'MP3' : 
                        type === 'image' ? 'JPG' : 'FILE';
        const icon = type === 'video' ? 'fa-video' : 
                    type === 'audio' ? 'fa-music' : 
                    type === 'image' ? 'fa-image' : 'fa-file-download';
        
        option.innerHTML = `
            <div class="quality-info">
                <i class="fas ${icon}"></i>
                <div class="quality-details">
                    <span class="quality-label">${label}</span>
                    <span class="file-type">${fileType}</span>
                </div>
            </div>
            <a href="${url}" class="btn-download" download target="_blank" type="${mimeType}">
                <i class="fas fa-download"></i> Download
            </a>
        `;
        
        return option;
    }
    
    function showLoadingState() {
        resultsSection.style.display = 'block';
        loadingState.style.display = 'flex';
        videoInfoCard.style.display = 'none';
        errorState.style.display = 'none';
    }
    
    function hideLoadingState() {
        loadingState.style.display = 'none';
    }
    
    function showErrorState(message) {
        resultsSection.style.display = 'block';
        loadingState.style.display = 'none';
        videoInfoCard.style.display = 'none';
        errorState.style.display = 'block';
        document.getElementById('errorMessage').textContent = message;
    }
    
    function addToDownloadHistory(url, data, platform) {
        const title = getVideoTitle(data, platform);
        const thumbnail = getVideoThumbnail(data, platform);
        
        const historyItem = {
            url: url,
            title: title,
            thumbnail: thumbnail,
            platform: platform,
            timestamp: new Date().toISOString()
        };
        
        downloadHistory = downloadHistory.filter(item => item.url !== url);
        
        downloadHistory.unshift(historyItem);
        
        if (downloadHistory.length > 10) {
            downloadHistory = downloadHistory.slice(0, 10);
        }
        
        localStorage.setItem('zhadev_download_history', JSON.stringify(downloadHistory));
        loadDownloadHistory();
    }
    
    function shortenTitle(title, maxLength = 40) {
        if (title.length <= maxLength) return title;
        return title.substring(0, maxLength - 3) + '...';
    }
    
    function autoCleanHistory() {
        const lastClean = localStorage.getItem('zhadev_history_last_clean');
        const now = new Date().getTime();
        
        if (!lastClean || (now - parseInt(lastClean)) > 24 * 60 * 60 * 1000) {
            const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000).toISOString();
            downloadHistory = downloadHistory.filter(item => new Date(item.timestamp) > new Date(oneDayAgo));
            localStorage.setItem('zhadev_download_history', JSON.stringify(downloadHistory));
            localStorage.setItem('zhadev_history_last_clean', now.toString());
            loadDownloadHistory();
        }
    }
    
    function removeHistoryItem(url) {
        downloadHistory = downloadHistory.filter(item => item.url !== url);
        localStorage.setItem('zhadev_download_history', JSON.stringify(downloadHistory));
        loadDownloadHistory();
        showNotification('Item berhasil dihapus dari riwayat', 'success');
    }
    
    function loadDownloadHistory() {
        historyList.innerHTML = '';
        
        if (downloadHistory.length === 0) {
            historyList.innerHTML = '<p class="no-history">Belum ada riwayat download</p>';
            return;
        }
        
        downloadHistory.forEach(item => {
            const historyElement = document.createElement('div');
            historyElement.className = 'history-item';
            
            const shortenedTitle = shortenTitle(item.title);
            
            historyElement.innerHTML = `
                <div class="history-thumbnail">
                    <img src="${item.thumbnail || '../assets/img/placeholder.jpg'}" alt="${item.title}" onerror="this.src='../assets/img/placeholder.jpg'">
                    <div class="platform-badge ${item.platform}">${item.platform}</div>
                    <button class="history-delete" data-url="${item.url}" title="Hapus dari riwayat">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="history-details">
                    <h4 class="history-title" title="${item.title}">${shortenedTitle}</h4>
                    <div class="history-meta">
                        <span class="history-time">${formatTimeAgo(new Date(item.timestamp))}</span>
                    </div>
                </div>
                <button class="history-redownload" data-url="${item.url}" title="Download ulang">
                    <i class="fas fa-redo"></i>
                </button>
            `;
            
            const deleteBtn = historyElement.querySelector('.history-delete');
            deleteBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                removeHistoryItem(item.url);
            });
            
            const reDownloadBtn = historyElement.querySelector('.history-redownload');
            reDownloadBtn.addEventListener('click', function() {
                videoUrlInput.value = item.url;
                platformSelect.value = 'auto';
                updatePlatformPlaceholder();
                fetchVideoInfo();
            });
            
            historyList.appendChild(historyElement);
        });
    }
    
    function detectPlatform(url) {
        if (url.includes('douyin.com')) return 'douyin';
        if (url.includes('tiktok.com')) return 'tiktok';
        if (url.includes('instagram.com')) return 'instagram';
        if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
        if (url.includes('facebook.com')) return 'facebook';
        if (url.includes('spotify.com')) return 'spotify';
        if (url.includes('threads.net')) return 'threads';
        if (url.includes('pinterest.com')) return 'pinterest';
        if (url.includes('capcut.com')) return 'capcut';
        if (url.includes('bilibili.com') || url.includes('bilibili.tv')) return 'bilibili';
        if (url.includes('github.com')) return 'github';
        if (url.includes('drive.google.com')) return 'gdrive';
        return 'unknown';
    }
    
    function isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }
    
    function formatCount(count) {
        if (!count) return '0';
        if (typeof count === 'string') return count;
        if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M';
        if (count >= 1000) return (count / 1000).toFixed(1) + 'K';
        return count.toString();
    }
    
    function formatTimeAgo(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return 'Baru saja';
        if (diffMins < 60) return `${diffMins} menit lalu`;
        if (diffHours < 24) return `${diffHours} jam lalu`;
        if (diffDays < 7) return `${diffDays} hari lalu`;
        return date.toLocaleDateString('id-ID');
    }
    
    function showNotification(message, type = 'info') {
        if (window.showNotification) {
            window.showNotification(message, type);
        } else {
            alert(message);
        }
    }
    
    updatePlatformPlaceholder();
});