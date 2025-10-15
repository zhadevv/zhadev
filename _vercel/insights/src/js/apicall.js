// Lu ngapain njing
// pergi but

// CREDIT: bang Ferdev, ResitaApi
const API_BASE_URL = 'https://api.ferdev.my.id';
const API_KEY = 'douyin-apikey';

async function callAPI(endpoint, params = {}) {
    try {
      
        const urlParams = new URLSearchParams();
        
        Object.keys(params).forEach(key => {
            if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
                urlParams.append(key, params[key]);
            }
        });
        
        if (!params.apikey) {
            urlParams.append('apikey', API_KEY);
        }
        
        const url = `${API_BASE_URL}${endpoint}?${urlParams}`;
        
        console.log('API Call:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'User-Agent': 'zhadev-web/1.0'
            }
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Response Error:', response.status, errorText);
            
            throw new Error(`HTTP ${response.status}: ${getErrorMessage(response.status, errorText)}`);
        }
        
        const data = await response.json();
        
        if (data && data.status === 'error') {
            throw new Error(data.message || 'API returned error status');
        }
        
        return data;
    } catch (error) {
        console.error('API call failed:', error);
        
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            throw new Error('Gagal terhubung ke server. Periksa koneksi internet Anda.');
        }
        
        throw error;
    }
}

function getErrorMessage(status, responseText) {
    switch(status) {
        case 400:
            return 'Request tidak valid';
        case 401:
            return 'API key tidak valid';
        case 403:
            return 'Akses ditolak';
        case 404:
            return 'Endpoint tidak ditemukan';
        case 429:
            return 'Terlalu banyak request. Silakan coba lagi nanti.';
        case 500:
            return 'Server error. Silakan coba lagi nanti.';
        case 502:
            return 'Server sedang maintenance';
        case 503:
            return 'Service tidak tersedia';
        default:
            try {
                const data = JSON.parse(responseText);
                return data.message || `Error ${status}`;
            } catch {
                return `Error ${status}`;
            }
    }
}

const AI = {
    aicoding: async (prompt) => {
        return await callAPI('/ai/aicoding', { prompt });
    },
    
    claude: async (prompt) => {
        return await callAPI('/ai/claude', { prompt });
    },
    
    gemini: async (prompt) => {
        return await callAPI('/ai/gemini', { prompt });
    },
    
    gpt4: async (prompt, logic = 'Kamu adalah Zhadev - Ai yang di program sebagai Assistant Cerdas, Pintar dan juga Kritis. kamu di peruntukkan untuk membantu user entah itu pertanyaan sederhana kompleks') => {
        return await callAPI('/ai/gptlogic', { prompt, logic });
    }
};

const Downloader = {
    bilibili: async (link) => {
        return await callAPI('/downloader/bilibili', { link });
    },
    
    capcut: async (link) => {
        return await callAPI('/downloader/capcut', { link });
    },
    
    douyin: async (link) => {
        return await callAPI('/downloader/douyin', { link });
    },
    
    facebook: async (link) => {
        return await callAPI('/downloader/facebook', { link });
    },
    
    gdrive: async (link) => {
        return await callAPI('/downloader/gdrive', { link });
    },
    
    github: async (repo) => {
        let repoParam = repo;
        if (repo.includes('github.com')) {
            const match = repo.match(/github\.com\/([^\/]+\/[^\/]+)/);
            if (match) {
                repoParam = match[1];
            }
        }
        return await callAPI('/downloader/github', { repo: repoParam });
    },
    
    igstory: async (link) => {
        return await callAPI('/downloader/igstory', { link });
    },
    
    instagram: async (link) => {
        return await callAPI('/downloader/instagram', { link });
    },
    
    mediafire: async (link) => {
        return await callAPI('/downloader/mediafire', { link });
    },
    
    pinterest: async (link) => {
        return await callAPI('/downloader/pinterest', { link });
    },
    
    spotify: async (link) => {
        return await callAPI('/downloader/spotify', { link });
    },
    
    tiktok: async (link) => {
        return await callAPI('/downloader/tiktok', { link });
    },
    
    threads: async (link) => {
        return await callAPI('/downloader/threads', { link });
    },
    
    twitter: async (link) => {
        return await callAPI('/downloader/twitter', { link });
    },
    
    ytshorts: async (link) => {
        return await callAPI('/downloader/ytshorts', { link });
    },
    
    ytmp4: async (link) => {
        return await callAPI('/downloader/ytmp4', { link });
    },
    
    ytmp3: async (link) => {
        return await callAPI('/downloader/ytmp3', { link });
    }
};

const Stalker = {
    instagram: async (username) => {
        return await callAPI('/stalker/instagram', { username });
    },
    
    tiktok: async (username) => {
        return await callAPI('/stalker/tiktok', { username });
    }
};

const Search = {
    bstation: async (query) => {
        return await callAPI('/search/bstation', { query });
    },
    
    pinterest: async (query) => {
        return await callAPI('/search/pinterest', { query });
    },
    
    spotify: async (query) => {
        return await callAPI('/search/spotify', { query });
    },
    
    tiktok: async (query) => {
        return await callAPI('/search/tiktok', { query });
    },
    
    youtube: async (query) => {
        return await callAPI('/search/youtube', { query });
    }
};

const Tools = {
    placeholder: async () => {
        return { success: false, message: 'Fitur ini sedang dalam pengembangan' };
    }
};

function handleDownloaderResponse(response, platform) {
    if (!response) {
        throw new Error('Tidak ada response dari server');
    }
    
    if (response.success === false || response.status === 'error') {
        throw new Error(response.message || `Gagal mengambil data dari ${platform}`);
    }
    
    let videoData = null;
    
    switch(platform) {
        case 'bilibili':
            videoData = response.data || response;
            break;
        case 'capcut':
            videoData = response.data || response;
            break;
        case 'douyin':
            videoData = response.result || response.data || response;
            break;
        case 'facebook':
            videoData = response.data || response;
            break;
        case 'gdrive':
            videoData = response.data || response;
            break;
        case 'github':
            videoData = response.result || response.data || response;
            break;
        case 'instagram':
            videoData = response.data || response;
            break;
        case 'pinterest':
            videoData = response.data || response;
            break;
        case 'spotify':
            videoData = {
                ...(response.data || {}),
                download: response.download || response.data?.download
            };
            break;
        case 'tiktok':
            videoData = response.data || response;
            break;
        case 'threads':
            videoData = response.result || response.data || response;
            break;
        case 'youtube':
            videoData = response.data || response;
            break;
        default:
            videoData = response.data || response.result || response;
    }
    
    if (!videoData) {
        throw new Error('Data video tidak valid');
    }
    
    switch(platform) {
        case 'bilibili':
            if (!videoData.videoUrl && !videoData.title) {
                throw new Error('Data Bilibili tidak lengkap');
            }
            break;
        case 'capcut':
            if (!videoData.videoUrl && !videoData.title) {
                throw new Error('Data CapCut tidak lengkap');
            }
            break;
        case 'douyin':
            if (!videoData.download && !videoData.title) {
                throw new Error('Data Douyin tidak lengkap');
            }
            break;
        case 'facebook':
            if (!videoData.hd && !videoData.sd && !videoData.title) {
                throw new Error('Data Facebook tidak lengkap');
            }
            break;
        case 'gdrive':
            if (!videoData.download && !videoData.fileName) {
                throw new Error('Data Google Drive tidak lengkap');
            }
            break;
        case 'github':
            if (!videoData.download_zip && !videoData.name) {
                throw new Error('Data GitHub tidak lengkap');
            }
            break;
        case 'instagram':
            if (!videoData.videoUrls && !videoData.thumbnailUrl && !videoData.metadata) {
                throw new Error('Data Instagram tidak lengkap');
            }
            break;
        case 'pinterest':
            if (!videoData.video && !videoData.image && !videoData.thumb) {
                throw new Error('Data Pinterest tidak lengkap');
            }
            break;
        case 'spotify':
            if (!videoData.download && !videoData.title) {
                throw new Error('Data Spotify tidak lengkap');
            }
            break;
        case 'tiktok':
            if (!videoData.play && !videoData.title) {
                throw new Error('Data TikTok tidak lengkap');
            }
            break;
        case 'threads':
            if (!videoData.result && !videoData.download) {
                throw new Error('Data Threads tidak lengkap');
            }
            break;
        case 'youtube':
            if (!videoData.dlink && !videoData.metadata?.title) {
                throw new Error('Data YouTube tidak lengkap');
            }
            break;
    }
    
    const hasDownloadUrl = 
        videoData.download || 
        videoData.video || 
        videoData.play || 
        videoData.dlink ||
        videoData.hd ||
        videoData.sd ||
        videoData.videoUrl ||
        (videoData.download && (videoData.download.no_watermark || videoData.download.with_watermark || videoData.download.mp3)) ||
        (videoData.videoUrls && videoData.videoUrls.length > 0) ||
        videoData.music ||
        videoData.audio ||
        videoData.download_zip ||
        videoData.title;
    
    if (!hasDownloadUrl && !videoData.title) {
        throw new Error('Tidak ada data yang tersedia untuk konten ini');
    }
    
    return videoData;
}

function handleAIResponse(response) {
    if (!response) {
        throw new Error('Tidak ada response dari server AI');
    }
    
    if (response.success === false || response.status === 'error') {
        throw new Error(response.message || 'Gagal memproses permintaan AI');
    }
    
    return response.message || response.result || 'Tidak ada response dari AI';
}

function handleStalkerResponse(response, platform) {
    if (!response) {
        throw new Error('Tidak ada response dari server');
    }
    
    if (response.success === false || response.status === 'error') {
        throw new Error(response.message || `Gagal mengambil data dari ${platform}`);
    }
    
    return response.data || response.result || response;
}

function handleSearchResponse(response, platform) {
    if (!response) {
        throw new Error('Tidak ada response dari server');
    }
    
    if (response.success === false || response.status === 'error') {
        throw new Error(response.message || `Gagal mencari data di ${platform}`);
    }
    
    return response.result || response.data || response;
}

function handleAPIResponse(response, type = 'default', platform = null) {
    if (!response) {
        return {
            success: false,
            message: 'Tidak ada response dari server'
        };
    }
    
    const isSuccess = 
        response.success === true || 
        response.status === 200 || 
        response.status === 'success' ||
        (response.data && Object.keys(response.data).length > 0) ||
        (response.result && Object.keys(response.result).length > 0);
    
    if (isSuccess) {
        return {
            success: true,
            data: response.data || response.result || response,
            message: response.message || 'Success',
            raw: response
        };
    } else {
        const errorMsg = response?.message || 
                        response?.error || 
                        'Terjadi kesalahan saat memproses permintaan';
        
        return {
            success: false,
            message: errorMsg,
            raw: response
        };
    }
}

function extractPlatformData(response, platform) {
    if (!response) return null;
    
    const data = response.data || response.result || response;
    
    switch(platform) {
        case 'bilibili':
            return {
                title: data.title,
                description: data.description,
                cover: data.cover,
                views: data.views,
                like: data.like,
                videoUrl: data.videoUrl,
                author: data.author
            };
        case 'capcut':
            return {
                title: data.title,
                date: data.date,
                pengguna: data.pengguna,
                likes: data.likes,
                author: data.author,
                videoUrl: data.videoUrl,
                posterUrl: data.posterUrl
            };
        case 'douyin':
            return {
                title: data.title,
                thumbnail: data.thumbnail,
                download: data.download,
                author: data.author
            };
        case 'facebook':
            return {
                title: data.title,
                hd: data.hd,
                sd: data.sd,
                thumbnail: data.thumbnail
            };
        case 'gdrive':
            return {
                download: data.download,
                fileName: data.fileName,
                fileSize: data.fileSize,
                mimetype: data.mimetype,
                extension: data.extension,
                modified: data.modified
            };
        case 'github':
            return {
                id: data.id,
                name: data.name,
                full_name: data.full_name,
                owner: data.owner,
                owner_avatar: data.owner_avatar,
                description: data.description,
                stars: data.stars,
                forks: data.forks,
                language: data.language,
                default_branch: data.default_branch,
                repo_url: data.repo_url,
                download_zip: data.download_zip
            };
        case 'instagram':
            return {
                videoUrls: data.videoUrls,
                thumbnailUrl: data.thumbnailUrl,
                metadata: data.metadata,
                rawResponse: data.rawResponse
            };
        case 'pinterest':
            return {
                thumb: data.thumb,
                video: data.video,
                image: data.image
            };
        case 'spotify':
            return {
                title: data.title,
                artist: data.artist,
                thumbnail: data.thumbnail,
                album: data.album,
                download: data.download || response.download
            };
        case 'tiktok':
            return {
                title: data.title,
                cover: data.cover,
                play: data.play,
                music: data.music,
                play_count: data.play_count,
                share_count: data.share_count,
                download_count: data.download_count,
                author: data.author
            };
        case 'threads':
            return {
                result: data.result || data.download,
                type: data.type
            };
        case 'youtube':
            return {
                metadata: data.metadata,
                dlink: data.dlink,
                download: data.download,
                audio: data.audio
            };
        default:
            return data;
    }
}

async function checkAPIHealth() {
    try {
        const response = await fetch(`${API_BASE_URL}/`, { 
            method: 'HEAD',
            headers: {
                'User-Agent': 'zhadev-web/1.0'
            }
        });
        return response.ok;
    } catch (error) {
        console.error('API Health Check failed:', error);
        return false;
    }
}

function createRateLimiter(limit = 10, interval = 60000) {
    const calls = [];
    
    return function() {
        const now = Date.now();
        calls.push(now);
        
        while (calls.length > 0 && calls[0] <= now - interval) {
            calls.shift();
        }
        
        return calls.length <= limit;
    };
}

const downloadRateLimiter = createRateLimiter(15, 60000);
const aiRateLimiter = createRateLimiter(10, 60000);
const searchRateLimiter = createRateLimiter(20, 60000);

async function callAPIWithRateLimit(endpoint, params = {}, category = 'download') {
    let rateLimiter;
    
    switch(category) {
        case 'ai':
            rateLimiter = aiRateLimiter;
            break;
        case 'search':
            rateLimiter = searchRateLimiter;
            break;
        default:
            rateLimiter = downloadRateLimiter;
    }
    
    if (!rateLimiter()) {
        throw new Error('Terlalu banyak request. Silakan tunggu sebentar sebelum mencoba lagi.');
    }
    
    return await callAPI(endpoint, params);
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        AI, 
        Downloader, 
        Stalker, 
        Search, 
        Tools, 
        handleAPIResponse, 
        handleDownloaderResponse,
        handleAIResponse,
        handleStalkerResponse,
        handleSearchResponse,
        extractPlatformData,
        checkAPIHealth,
        callAPI,
        callAPIWithRateLimit
    };
} else {
    window.zhadevAPI = { 
        AI, 
        Downloader, 
        Stalker, 
        Search, 
        Tools, 
        handleAPIResponse, 
        handleDownloaderResponse,
        handleAIResponse,
        handleStalkerResponse,
        handleSearchResponse,
        extractPlatformData,
        checkAPIHealth,
        callAPI,
        callAPIWithRateLimit
    };
    
    window.addEventListener('unhandledrejection', function(event) {
        if (event.reason && event.reason.message && 
            (event.reason.message.includes('API') || 
             event.reason.message.includes('fetch') ||
             event.reason.message.includes('network'))) {
            console.error('Unhandled API Error:', event.reason);
            if (window.showNotification) {
                window.showNotification('Terjadi kesalahan pada koneksi API', 'error');
            }
        }
    });
    
    document.addEventListener('DOMContentLoaded', async function() {
        const isHealthy = await checkAPIHealth();
        if (!isHealthy && window.showNotification) {
            window.showNotification('API server sedang mengalami gangguan', 'warning');
        }
    });
}