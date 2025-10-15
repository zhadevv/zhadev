// Lu ngapain njing
// pergi but
class ToolsManager {
  constructor() {
    this.currentJobs = new Map();
    this.uploadedFiles = new Map();
    this.API_BASE_URL = 'https://api.zhadev.my.id';
    this.init();
  }

  init() {
    document.addEventListener('DOMContentLoaded', () => {
      this.setupEventListeners();
    });
  }

  setupEventListeners() {
    this.setupToolSelector();
    this.setupFileUploads();
    this.setupProcessButtons();
    this.setupOptionButtons();
    this.setupDownloadButtons();
    this.setupFileHosting();
  }

  setupToolSelector() {
    const toolSelect = document.getElementById('toolSelect');
    const toolContents = document.querySelectorAll('.tool-content');

    toolSelect?.addEventListener('change', (e) => {
      const selectedTool = e.target.value;
      
      toolContents.forEach(content => {
        content.style.display = 'none';
      });
      
      if (selectedTool) {
        const selectedContent = document.getElementById(`${selectedTool}-content`);
        if (selectedContent) {
          selectedContent.style.display = 'block';
          this.resetOutputSections(selectedContent);
        }
      }
    });
  }

  resetOutputSections(toolContent) {
    const outputSections = toolContent.querySelectorAll('.output-section');
    outputSections.forEach(section => {
      section.style.display = 'none';
    });
  }

  setupFileUploads() {
    const uploadConfigs = [
      { tool: 'vocal', area: 'vocalUploadArea', input: 'vocalFileInput', info: 'vocalFileInfo', process: 'processVocal', remove: 'removeVocalFile' },
      { tool: 'enhance', area: 'enhanceUploadArea', input: 'enhanceFileInput', info: 'enhanceFileInfo', process: 'processEnhance', remove: 'removeEnhanceFile' },
      { tool: 'bgRemove', area: 'bgRemoveUploadArea', input: 'bgRemoveFileInput', info: 'bgRemoveFileInfo', process: 'processBgRemove', remove: 'removeBgFile' },
      { tool: 'audioToText', area: 'audioToTextUploadArea', input: 'audioToTextFileInput', info: 'audioToTextFileInfo', process: 'processAudioToText', remove: 'removeAudioToTextFile' },
      { tool: 'imgToVideo', area: 'imgToVideoUploadArea', input: 'imgToVideoFileInput', info: 'imgToVideoFileInfo', process: 'processImageToVideo', remove: 'removeImgToVideoFile' },
      { tool: 'waifu', area: 'waifuUploadArea', input: 'waifuFileInput', info: 'waifuFileInfo', process: 'processWaifu', remove: 'removeWaifuFile' }
    ];

    uploadConfigs.forEach(config => {
      this.setupFileUpload(config);
    });
  }

  setupFileUpload(config) {
    const { tool, area, input, info, process, remove } = config;
    
    const uploadArea = document.getElementById(area);
    const fileInput = document.getElementById(input);
    const fileInfo = document.getElementById(info);
    const processBtn = document.getElementById(process);
    const removeBtn = document.getElementById(remove);

    if (!uploadArea || !fileInput) return;

    uploadArea.addEventListener('click', (e) => {
      e.stopPropagation();
      fileInput.click();
    });
    
    ['dragover', 'dragleave', 'drop'].forEach(event => {
      uploadArea.addEventListener(event, (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (event === 'dragover') uploadArea.classList.add('dragover');
        if (event === 'dragleave') uploadArea.classList.remove('dragover');
        if (event === 'drop') {
          uploadArea.classList.remove('dragover');
          if (e.dataTransfer.files.length) {
            fileInput.files = e.dataTransfer.files;
            this.handleFileSelect(fileInput, fileInfo, processBtn, tool);
          }
        }
      });
    });
    
    fileInput.addEventListener('change', (e) => {
      e.stopPropagation();
      this.handleFileSelect(fileInput, fileInfo, processBtn, tool);
    });
    
    removeBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      fileInput.value = '';
      if (fileInfo) fileInfo.style.display = 'none';
      if (processBtn) processBtn.disabled = true;
      uploadArea.style.display = 'block';
      this.uploadedFiles.delete(`${tool}_file`);
    });
  }

  setupFileHosting() {
    const uploadUrlBtn = document.getElementById('uploadUrl');
    const fileUrlInput = document.getElementById('fileUrl');
    const fileHostingOutput = document.getElementById('fileHostingOutput');
    const hostedFileUrl = document.getElementById('hostedFileUrl');
    const copyFileUrl = document.getElementById('copyFileUrl');

    uploadUrlBtn?.addEventListener('click', async () => {
      const url = fileUrlInput?.value.trim();
      if (!url) {
        this.showNotification('Masukkan URL file terlebih dahulu', 'error');
        return;
      }

      try {
        this.showNotification('Mengupload file...', 'info');
        uploadUrlBtn.disabled = true;

        const response = await fetch(`${this.API_BASE_URL}/api/upload?url=${encodeURIComponent(url)}`, {
          method: 'POST'
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();
        
        if (data.success) {
          hostedFileUrl.textContent = data.url;
          fileHostingOutput.style.display = 'block';
          this.uploadedFiles.set('hosted_file', data.url);
          this.showNotification('File berhasil diupload!', 'success');
        } else {
          throw new Error(data.error || 'Unknown error');
        }
        
      } catch (error) {
        this.showNotification('Gagal upload file: ' + error.message, 'error');
      } finally {
        uploadUrlBtn.disabled = false;
      }
    });

    copyFileUrl?.addEventListener('click', () => {
      const url = this.uploadedFiles.get('hosted_file');
      if (url) {
        navigator.clipboard.writeText(url).then(() => {
          this.showNotification('URL file berhasil disalin!', 'success');
        }).catch(() => {
          this.showNotification('Gagal menyalin URL', 'error');
        });
      } else {
        this.showNotification('Tidak ada URL untuk disalin', 'error');
      }
    });
  }

  handleFileSelect(fileInput, fileInfo, processBtn, toolType) {
    if (!fileInput.files.length) return;

    const file = fileInput.files[0];
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'audio/mpeg', 'audio/wav', 'audio/flac', 'video/mp4', 'video/webm', 'video/quicktime', 'application/zip', 'application/x-zip-compressed'];
    const maxSize = 100 * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
      this.showNotification('Tipe file tidak didukung', 'error');
      fileInput.value = '';
      return;
    }

    if (file.size > maxSize) {
      this.showNotification('File terlalu besar. Maksimal 100MB', 'error');
      fileInput.value = '';
      return;
    }
    
    if (fileInfo) {
      const fileName = fileInfo.querySelector('h5');
      const fileSize = fileInfo.querySelector('span');
      
      if (fileName) fileName.textContent = file.name;
      if (fileSize) fileSize.textContent = this.formatFileSize(file.size);
      
      fileInfo.style.display = 'block';
    }
    
    if (processBtn) processBtn.disabled = false;
    
    fileInput.parentElement.style.display = 'none';
    this.uploadedFiles.set(`${toolType}_file`, file);
    
    if (file.type.startsWith('image/')) {
      this.showImagePreview(file, fileInfo);
    } else if (file.type.startsWith('video/')) {
      this.showVideoPreview(file, fileInfo);
    }
  }

  showImagePreview(file, container) {
    if (!container) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      let preview = container.querySelector('.preview-box');
      if (!preview) {
        preview = document.createElement('div');
        preview.className = 'preview-box';
        container.appendChild(preview);
      }
      preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
    };
    reader.readAsDataURL(file);
  }

  showVideoPreview(file, container) {
    if (!container) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      let preview = container.querySelector('.preview-box');
      if (!preview) {
        preview = document.createElement('div');
        preview.className = 'preview-box';
        container.appendChild(preview);
      }
      preview.innerHTML = `<video controls><source src="${e.target.result}" type="${file.type}"></video>`;
    };
    reader.readAsDataURL(file);
  }

  setupProcessButtons() {
    const processHandlers = {
      'processVocal': () => this.processVocalRemover(),
      'processEnhance': () => this.processEnhancement(),
      'processBgRemove': () => this.processRemoveBg(),
      'generateImage': () => this.generateImageFromText(),
      'generateVideo': () => this.generateVideoFromText(),
      'generateSpeech': () => this.generateSpeechFromText(),
      'processAudioToText': () => this.processAudioToText(),
      'processImageToVideo': () => this.processImageToVideo(),
      'processWaifu': () => this.processWaifuDarkener(),
      'shortenUrl': () => this.shortenUrl()
    };

    Object.entries(processHandlers).forEach(([id, handler]) => {
      document.getElementById(id)?.addEventListener('click', handler);
    });

    document.getElementById('copyTranscription')?.addEventListener('click', () => this.copyTranscription());
    document.getElementById('copyShortUrl')?.addEventListener('click', () => this.copyShortUrl());
  }

  setupOptionButtons() {
    document.querySelectorAll('.option-btn').forEach(button => {
      button.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const optionContainer = this.closest('.option-buttons');
        if (optionContainer) {
          optionContainer.querySelectorAll('.option-btn').forEach(btn => {
            btn.classList.remove('active');
          });
          this.classList.add('active');
        }
      });
    });
  }

  setupDownloadButtons() {
    document.querySelectorAll('.btn-download').forEach(btn => {
      btn.addEventListener('click', () => {
        const toolContent = btn.closest('.tool-content');
        if (!toolContent) return;
        
        const toolType = toolContent.id.replace('-content', '');
        const url = this.uploadedFiles.get(`${toolType}_result`);
        
        if (url) {
          this.downloadFile(url, `${toolType}_result`);
        } else {
          this.showNotification('Tidak ada hasil untuk diunduh', 'error');
        }
      });
    });
  }

  async processVocalRemover() {
    const fileInput = document.getElementById('vocalFileInput');
    if (!this.validateFileInput(fileInput)) return;
    await this.processWithFile(`${this.API_BASE_URL}/api/vocal-remover`, fileInput.files[0], 'vocal', 'Memisahkan vokal dan instrumental...');
  }

  async processEnhancement() {
    const fileInput = document.getElementById('enhanceFileInput');
    if (!this.validateFileInput(fileInput)) return;

    const formData = new FormData();
    formData.append('image', fileInput.files[0]);
    formData.append('scale', '4');
    formData.append('face_enhance', 'true');

    await this.processWithFormData(`${this.API_BASE_URL}/api/image-enhancement`, formData, 'enhance', 'Meningkatkan kualitas gambar...');
  }

  async processRemoveBg() {
    const fileInput = document.getElementById('bgRemoveFileInput');
    if (!this.validateFileInput(fileInput)) return;
    await this.processWithFile(`${this.API_BASE_URL}/api/background-removal`, fileInput.files[0], 'bgremove', 'Menghapus background...');
  }

  async generateImageFromText() {
    const promptElement = document.getElementById('textToImagePrompt');
    const prompt = promptElement?.value.trim();
    if (!this.validatePrompt(prompt)) return;

    const selectedStyle = document.querySelector('#text-to-image-content .option-btn.active')?.getAttribute('data-value') || 'realistic';

    await this.processWithJSON(`${this.API_BASE_URL}/api/text-to-image`, {
      prompt: prompt,
      style: selectedStyle
    }, 'text2img', 'Membuat gambar dari teks...');
  }

  async generateVideoFromText() {
    const promptElement = document.getElementById('textToVideoPrompt');
    const prompt = promptElement?.value.trim();
    if (!this.validatePrompt(prompt)) return;

    const duration = document.querySelector('#text-to-video-content .option-buttons:first-child .option-btn.active')?.getAttribute('data-value') || '5';
    const resolution = document.querySelector('#text-to-video-content .option-buttons:last-child .option-btn.active')?.getAttribute('data-value') || '720p';

    await this.processWithJSON(`${this.API_BASE_URL}/api/text-to-video`, {
      prompt: prompt,
      duration: parseInt(duration),
      resolution: resolution
    }, 'text2video', 'Membuat video dari teks...');
  }

  async generateSpeechFromText() {
    const textElement = document.getElementById('textToSpeechInput');
    const text = textElement?.value.trim();
    if (!this.validateText(text)) return;

    const voice = document.querySelector('#text-to-speech-content .option-buttons:first-child .option-btn.active')?.getAttribute('data-value') || 'af_heart';
    const speed = document.querySelector('#text-to-speech-content .option-buttons:last-child .option-btn.active')?.getAttribute('data-value') || '1.0';

    await this.processWithJSON(`${this.API_BASE_URL}/api/text-to-speech`, {
      text: text,
      voice: voice,
      speed: parseFloat(speed)
    }, 'text2speech', 'Membuat suara dari teks...');
  }

  async processAudioToText() {
    const fileInput = document.getElementById('audioToTextFileInput');
    if (!this.validateFileInput(fileInput)) return;

    const language = document.querySelector('#audio-to-text-content .option-btn.active')?.getAttribute('data-value') || 'indonesian';

    const formData = new FormData();
    formData.append('audio', fileInput.files[0]);
    formData.append('language', language);

    await this.processWithFormData(`${this.API_BASE_URL}/api/audio-to-text`, formData, 'audio2text', 'Mentranskripsi audio...');
  }

  async processImageToVideo() {
    const fileInput = document.getElementById('imgToVideoFileInput');
    if (!this.validateFileInput(fileInput)) return;
    await this.processWithFile(`${this.API_BASE_URL}/api/image-to-video`, fileInput.files[0], 'img2video', 'Membuat video dari gambar...');
  }

  async processWaifuDarkener() {
    const fileInput = document.getElementById('waifuFileInput');
    if (!this.validateFileInput(fileInput)) return;
    await this.processWithFile(`${this.API_BASE_URL}/api/image-enhancement`, fileInput.files[0], 'waifu', 'Mengubah warna kulit karakter...');
  }

  async shortenUrl() {
    const originalUrl = document.getElementById('originalUrl');
    if (!originalUrl) return;
    
    const url = originalUrl.value.trim();
    const customSlug = document.getElementById('customSlug')?.value.trim() || null;

    if (!url) {
      this.showNotification('Masukkan URL terlebih dahulu', 'error');
      return;
    }

    this.showNotification('Memendekkan URL...', 'info');
    this.setLoadingState('shortenUrl', true);

    try {
      const response = await fetch(`${this.API_BASE_URL}/api/shorten-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url, slug: customSlug })
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      
      if (data.success) {
        this.showUrlShortenerOutput(data);
        this.showNotification('URL berhasil dipendekkan!', 'success');
      } else {
        throw new Error(data.error || 'Unknown error');
      }
      
    } catch (error) {
      this.showNotification('Gagal memendekkan URL: ' + error.message, 'error');
    } finally {
      this.setLoadingState('shortenUrl', false);
    }
  }

  async processWithFile(endpoint, file, toolType, loadingMessage) {
    this.showNotification(loadingMessage, 'info');
    this.setLoadingState(this.getProcessButtonId(toolType), true);

    try {
      const formData = new FormData();
      formData.append(toolType === 'vocal' || toolType === 'audio2text' ? 'audio' : 'image', file);

      const response = await fetch(endpoint, { method: 'POST', body: formData });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      
      if (data.success) {
        this.currentJobs.set(toolType, data.predictionId);
        await this.pollPredictionResult(data.predictionId, toolType);
      } else {
        throw new Error(data.error || 'Unknown error');
      }
      
    } catch (error) {
      this.showNotification('Gagal memproses: ' + error.message, 'error');
      this.setLoadingState(this.getProcessButtonId(toolType), false);
    }
  }

  async processWithFormData(endpoint, formData, toolType, loadingMessage) {
    this.showNotification(loadingMessage, 'info');
    this.setLoadingState(this.getProcessButtonId(toolType), true);

    try {
      const response = await fetch(endpoint, { method: 'POST', body: formData });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      
      if (data.success) {
        this.currentJobs.set(toolType, data.predictionId);
        await this.pollPredictionResult(data.predictionId, toolType);
      } else {
        throw new Error(data.error || 'Unknown error');
      }
      
    } catch (error) {
      this.showNotification('Gagal memproses: ' + error.message, 'error');
      this.setLoadingState(this.getProcessButtonId(toolType), false);
    }
  }

  async processWithJSON(endpoint, data, toolType, loadingMessage) {
    this.showNotification(loadingMessage, 'info');
    this.setLoadingState(this.getProcessButtonId(toolType), true);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const result = await response.json();
      
      if (result.success) {
        if (result.predictionId) {
          this.currentJobs.set(toolType, result.predictionId);
          await this.pollPredictionResult(result.predictionId, toolType);
        } else if (result.output) {
          this.uploadedFiles.set(`${toolType}_result`, result.output);
          this.showToolOutput(toolType, result.output);
          this.showNotification('Processing completed successfully!', 'success');
          this.setLoadingState(this.getProcessButtonId(toolType), false);
        }
      } else {
        throw new Error(result.error || 'Unknown error');
      }
      
    } catch (error) {
      this.showNotification('Gagal memproses: ' + error.message, 'error');
      this.setLoadingState(this.getProcessButtonId(toolType), false);
    }
  }

  async pollPredictionResult(predictionId, toolType) {
    let result;
    let attempts = 0;
    const maxAttempts = 180;
    
    do {
      await new Promise(resolve => setTimeout(resolve, 2000));
      attempts++;
      
      try {
        const response = await fetch(`${this.API_BASE_URL}/api/prediction/${predictionId}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        result = await response.json();
        
        if (result.status === 'failed') throw new Error('Processing failed: ' + (result.error || 'Unknown error'));
        if (attempts >= maxAttempts) throw new Error('Processing timeout');
        
      } catch (error) {
        throw error;
      }
      
    } while (result.status === 'starting' || result.status === 'processing');
    
    if (result.output) {
      if (toolType === 'audio2text') {
        await this.handleAudioToTextResult(result);
      } else {
        this.uploadedFiles.set(`${toolType}_result`, result.output);
        this.showToolOutput(toolType, result.output);
        this.showNotification('Processing completed successfully!', 'success');
      }
    }
    
    this.setLoadingState(this.getProcessButtonId(toolType), false);
  }

  async handleAudioToTextResult(result) {
    if (result.output) {
      const outputSection = document.getElementById('audioToTextOutput');
      const resultElement = document.getElementById('transcriptionResult');
      
      if (outputSection && resultElement) {
        outputSection.style.display = 'block';
        resultElement.value = result.output;
        this.showNotification('Transkripsi berhasil!', 'success');
      }
    }
    this.setLoadingState('processAudioToText', false);
  }

  showToolOutput(toolType, output) {
    const outputSection = document.getElementById(`${toolType.replace('-', '')}Output`);
    if (!outputSection) return;
    
    outputSection.style.display = 'block';
    
    let previewHtml = '';
    if (Array.isArray(output)) output = output[0];
    
    if (typeof output === 'string') {
      if (output.includes('.mp4') || output.includes('.webm')) {
        previewHtml = `<video controls><source src="${output}" type="video/mp4"></video>`;
      } else if (output.includes('.mp3') || output.includes('.wav')) {
        previewHtml = `<audio controls><source src="${output}" type="audio/mpeg"></audio>`;
      } else {
        previewHtml = `<img src="${output}" alt="Result">`;
      }
    }
    
    const previewElement = outputSection.querySelector('.preview-box:last-child');
    if (previewElement) previewElement.innerHTML = previewHtml;
  }

  showUrlShortenerOutput(data) {
    const outputSection = document.getElementById('urlShortenerOutput');
    const shortUrlElement = document.getElementById('shortUrl');
    const expiryElement = document.getElementById('urlExpiry');
    const createdElement = document.getElementById('urlCreated');

    if (!outputSection || !shortUrlElement) return;
    
    outputSection.style.display = 'block';
    shortUrlElement.textContent = data.shortUrl;
    
    if (expiryElement) expiryElement.textContent = data.expires;
    if (createdElement) createdElement.textContent = data.created;
    
    this.uploadedFiles.set('short_url', data.shortUrl);
  }

  copyTranscription() {
    const resultElement = document.getElementById('transcriptionResult');
    if (resultElement && resultElement.value) {
      navigator.clipboard.writeText(resultElement.value).then(() => {
        this.showNotification('Teks berhasil disalin!', 'success');
      }).catch(() => {
        this.showNotification('Gagal menyalin teks', 'error');
      });
    } else {
      this.showNotification('Tidak ada teks untuk disalin', 'error');
    }
  }

  copyShortUrl() {
    const shortUrl = this.uploadedFiles.get('short_url');
    if (shortUrl) {
      navigator.clipboard.writeText(shortUrl).then(() => {
        this.showNotification('URL berhasil disalin!', 'success');
      }).catch(() => {
        this.showNotification('Gagal menyalin URL', 'error');
      });
    } else {
      this.showNotification('Tidak ada URL untuk disalin', 'error');
    }
  }

  validateFileInput(fileInput) {
    if (!fileInput || !fileInput.files.length) {
      this.showNotification('Pilih file terlebih dahulu', 'error');
      return false;
    }
    return true;
  }

  validatePrompt(prompt) {
    if (!prompt) {
      this.showNotification('Masukkan prompt terlebih dahulu', 'error');
      return false;
    }
    return true;
  }

  validateText(text) {
    if (!text) {
      this.showNotification('Masukkan teks terlebih dahulu', 'error');
      return false;
    }
    return true;
  }

  getProcessButtonId(toolType) {
    const buttonMap = {
      'vocal': 'processVocal',
      'enhance': 'processEnhance',
      'bgremove': 'processBgRemove',
      'text2img': 'generateImage',
      'text2video': 'generateVideo',
      'text2speech': 'generateSpeech',
      'audio2text': 'processAudioToText',
      'img2video': 'processImageToVideo',
      'waifu': 'processWaifu'
    };
    return buttonMap[toolType];
  }

  setLoadingState(buttonId, loading) {
    const button = document.getElementById(buttonId);
    if (button) {
      button.disabled = loading;
      const originalText = button.textContent;
      
      if (loading) {
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        button.classList.add('loading');
      } else {
        button.innerHTML = originalText;
        button.classList.remove('loading');
      }
    }
  }

  downloadFile(url, filename) {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.showNotification(`Mengunduh ${filename}...`, 'success');
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  showNotification(message, type = 'info') {
    document.querySelectorAll('.notification').forEach(n => n.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <span>${message}</span>
        <button class="notification-close">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => notification.classList.add('show'), 10);
    
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 4000);
    
    notification.querySelector('.notification-close').addEventListener('click', () => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    });
  }
}

new ToolsManager();