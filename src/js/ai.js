// Lu ngapain njing
// pergi but 
class ChatAI {
    constructor() {
        this.currentChatId = this.generateChatId();
        this.chats = JSON.parse(localStorage.getItem('zhadev_chats')) || {};
        this.currentModel = 'gemini';
        this.theme = localStorage.getItem('zhadev_theme') || 'dark';
        
        this.init();
    }

    init() {
        this.setupDOM();
        this.setupEventListeners();
        this.loadChatHistory();
        this.applyTheme();
        this.showWelcomeMessage();
    }

    setupDOM() {
        this.elements = {
            newChatBtn: document.getElementById('newChatBtn'),
            sidebarClose: document.getElementById('sidebarClose'),
            sidebarToggle: document.getElementById('sidebarToggle'),
            historyList: document.getElementById('historyList'),
            modelSelect: document.getElementById('modelSelect'),
            themeToggle: document.getElementById('themeToggle'),
            clearChat: document.getElementById('clearChat'),
            currentModel: document.getElementById('currentModel'),
            messagesContainer: document.getElementById('messagesContainer'),
            messageInput: document.getElementById('messageInput'),
            sendButton: document.getElementById('sendButton'),
            charCount: document.querySelector('.char-count'),
            sidebar: document.querySelector('.sidebar')
        };
    }

    setupEventListeners() {
        this.elements.newChatBtn.addEventListener('click', () => this.startNewChat());
        this.elements.sidebarClose.addEventListener('click', () => this.toggleSidebar());
        this.elements.sidebarToggle.addEventListener('click', () => this.toggleSidebar());
        this.elements.modelSelect.addEventListener('change', (e) => this.changeModel(e.target.value));
        this.elements.themeToggle.addEventListener('click', () => this.toggleTheme());
        this.elements.clearChat.addEventListener('click', () => this.clearCurrentChat());
        
        this.elements.messageInput.addEventListener('input', (e) => this.handleInput(e));
        this.elements.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        this.elements.sendButton.addEventListener('click', () => this.sendMessage());

        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('suggestion')) {
                this.handleSuggestion(e.target.textContent);
            }
            
            if (e.target.closest('.chat-item') && !e.target.closest('.delete-chat')) {
                const chatId = e.target.closest('.chat-item').dataset.chatId;
                if (chatId) this.loadChat(chatId);
            }
        });

        window.addEventListener('resize', () => this.handleResize());
    }

    handleInput(e) {
        const textarea = e.target;
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
        
        const count = textarea.value.length;
        if (this.elements.charCount) {
            this.elements.charCount.textContent = `${count}/4000`;
        }
    }

    async sendMessage() {
        const message = this.elements.messageInput.value.trim();
        if (!message) return;

        if (message.length > 4000) {
            this.showNotification('Message too long (max 4000 characters)', 'error');
            return;
        }

        this.addMessage('user', message);
        this.elements.messageInput.value = '';
        this.elements.messageInput.style.height = 'auto';
        if (this.elements.charCount) {
            this.elements.charCount.textContent = '0/4000';
        }

        this.setInputState(false);
        const loadingId = this.showLoading();

        try {
            const response = await this.callAIModel(this.currentModel, message);
            this.hideLoading(loadingId);
            
            const aiResponse = this.extractAIResponse(response);
            this.addMessage('bot', aiResponse);
            this.saveChatToHistory(message, aiResponse);
            
        } catch (error) {
            console.error('AI API Error:', error);
            this.hideLoading(loadingId);
            
            const errorMessage = 'Sorry, I encountered an error. Please try again.';
            this.addMessage('bot', errorMessage);
            this.saveChatToHistory(message, errorMessage);
            
            this.showNotification('Failed to get AI response', 'error');
        } finally {
            this.setInputState(true);
        }
    }

    async callAIModel(model, prompt) {
        if (!window.zhadevAPI || !window.zhadevAPI.AI) {
            throw new Error('AI API not available');
        }

        const aiFunctions = {
            'claude': () => zhadevAPI.AI.claude(prompt),
            'aicoding': () => zhadevAPI.AI.aicoding(prompt),
            'gpt4': () => zhadevAPI.AI.gpt4(prompt),
            'gemini': () => zhadevAPI.AI.gemini(prompt)
        };

        const aiFunction = aiFunctions[model] || aiFunctions['gemini'];
        return await aiFunction();
    }

    extractAIResponse(response) {
        if (!response) return 'No response from AI.';

        if (typeof response === 'string') return response;
        if (response.message) return response.message;
        if (response.data) return response.data;
        if (response.result) return response.result;
        if (response.response) return response.response;
        
        try {
            return JSON.stringify(response, null, 2);
        } catch {
            return 'Unable to parse AI response.';
        }
    }

    addMessage(role, content) {
        this.removeWelcomeMessage();

        const messageElement = document.createElement('div');
        messageElement.className = `message message-${role}`;
        
        const avatar = role === 'user' ? 
            '<i class="fas fa-user"></i>' : 
            '<i class="fas fa-robot"></i>';

        messageElement.innerHTML = `
            <div class="message-content">
                <div class="message-avatar">${avatar}</div>
                <div class="message-text">${this.formatMessage(content)}</div>
            </div>
        `;

        this.elements.messagesContainer.appendChild(messageElement);
        this.scrollToBottom();
    }

    formatMessage(content) {
        if (!content) return '';
        
        content = this.escapeHtml(content.toString());
        
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
            .replace(/\n/g, '<br>');
    }

    showLoading() {
        const loadingId = 'loading-' + Date.now();
        const loadingElement = document.createElement('div');
        loadingElement.className = 'message message-bot';
        loadingElement.id = loadingId;
        
        loadingElement.innerHTML = `
            <div class="message-content">
                <div class="message-avatar"><i class="fas fa-robot"></i></div>
                <div class="typing-indicator">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>
            </div>
        `;
        
        this.elements.messagesContainer.appendChild(loadingElement);
        this.scrollToBottom();
        
        return loadingId;
    }

    hideLoading(loadingId) {
        const element = document.getElementById(loadingId);
        if (element) element.remove();
    }

    showWelcomeMessage() {
        this.elements.messagesContainer.innerHTML = `
            <div class="welcome-message">
                <div class="welcome-icon">
                    <i class="fas fa-robot"></i>
                </div>
                <h1>How can I help you today?</h1>
                <div class="suggestions">
                    <div class="suggestion">Explain quantum computing in simple terms</div>
                    <div class="suggestion">Write a Python script for data analysis</div>
                    <div class="suggestion">Help me plan a workout routine</div>
                    <div class="suggestion">Create a business plan template</div>
                </div>
            </div>
        `;
    }

    removeWelcomeMessage() {
        const welcomeMessage = this.elements.messagesContainer.querySelector('.welcome-message');
        if (welcomeMessage) {
            welcomeMessage.remove();
        }
    }

    handleSuggestion(text) {
        this.elements.messageInput.value = text;
        this.elements.messageInput.focus();
        this.handleInput({ target: this.elements.messageInput });
        
        setTimeout(() => {
            if (this.elements.messageInput.value === text) {
                this.sendMessage();
            }
        }, 500);
    }

    startNewChat() {
        this.currentChatId = this.generateChatId();
        this.currentModel = 'gemini';
        this.elements.modelSelect.value = 'gemini';
        this.elements.currentModel.textContent = 'Gemini';
        
        this.elements.messagesContainer.innerHTML = '';
        this.showWelcomeMessage();
        this.loadChatHistory();
        
        this.showNotification('New conversation started', 'success');
        this.toggleSidebar();
    }

    clearCurrentChat() {
        if (confirm('Clear all messages in this conversation?')) {
            if (this.chats[this.currentChatId]) {
                this.chats[this.currentChatId].messages = [];
                localStorage.setItem('zhadev_chats', JSON.stringify(this.chats));
            }
            this.startNewChat();
        }
    }

    saveChatToHistory(userMessage, aiResponse) {
        if (!this.chats[this.currentChatId]) {
            this.chats[this.currentChatId] = {
                id: this.currentChatId,
                title: userMessage.substring(0, 50) + (userMessage.length > 50 ? '...' : ''),
                timestamp: new Date().toISOString(),
                messages: [],
                model: this.currentModel
            };
        }
        
        this.chats[this.currentChatId].messages.push(
            { role: 'user', content: userMessage, timestamp: new Date().toISOString() },
            { role: 'bot', content: aiResponse, timestamp: new Date().toISOString() }
        );
        
        localStorage.setItem('zhadev_chats', JSON.stringify(this.chats));
        this.loadChatHistory();
    }

    loadChatHistory() {
        const chatArray = Object.values(this.chats).sort((a, b) => 
            new Date(b.timestamp) - new Date(a.timestamp)
        );
        
        if (chatArray.length === 0) {
            this.elements.historyList.innerHTML = '<div class="no-chats">No conversations yet</div>';
            return;
        }
        
        this.elements.historyList.innerHTML = '';
        chatArray.forEach(chat => {
            const isActive = chat.id === this.currentChatId;
            const chatElement = document.createElement('div');
            chatElement.className = `chat-item ${isActive ? 'active' : ''}`;
            chatElement.dataset.chatId = chat.id;
            chatElement.innerHTML = `
                <i class="fas fa-comment"></i>
                <span>${this.escapeHtml(chat.title)}</span>
            `;
            
            this.elements.historyList.appendChild(chatElement);
        });
    }

    loadChat(chatId) {
        const chat = this.chats[chatId];
        if (!chat) return;
        
        this.currentChatId = chatId;
        this.currentModel = chat.model || 'gemini';
        this.elements.modelSelect.value = this.currentModel;
        this.elements.currentModel.textContent = this.getModelDisplayName(this.currentModel);
        
        this.elements.messagesContainer.innerHTML = '';
        if (chat.messages.length === 0) {
            this.showWelcomeMessage();
        } else {
            chat.messages.forEach(msg => this.addMessage(msg.role, msg.content));
        }
        
        this.loadChatHistory();
        this.scrollToBottom();
        this.toggleSidebar();
    }

    changeModel(model) {
        this.currentModel = model;
        this.elements.currentModel.textContent = this.getModelDisplayName(model);
        this.showNotification(`Model changed to: ${this.getModelDisplayName(model)}`, 'info');
    }

    getModelDisplayName(model) {
        const names = {
            'gemini': 'Gemini',
            'claude': 'Claude',
            'aicoding': 'Deepseek Coder', 
            'gpt4': 'GPT-4'
        };
        return names[model] || model;
    }

    toggleTheme() {
        this.theme = this.theme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('zhadev_theme', this.theme);
        this.applyTheme();
        
        const icon = this.elements.themeToggle.querySelector('i');
        const text = this.elements.themeToggle.querySelector('span');
        if (this.theme === 'dark') {
            icon.className = 'fas fa-moon';
            text.textContent = 'Dark mode';
        } else {
            icon.className = 'fas fa-sun';
            text.textContent = 'Light mode';
        }
    }

    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.theme);
    }

    toggleSidebar() {
        if (window.innerWidth <= 768) {
            this.elements.sidebar.classList.toggle('active');
        }
    }

    setInputState(enabled) {
        this.elements.messageInput.disabled = !enabled;
        this.elements.sendButton.disabled = !enabled;
        
        if (enabled) {
            setTimeout(() => this.elements.messageInput.focus(), 100);
        }
    }

    scrollToBottom() {
        setTimeout(() => {
            this.elements.messagesContainer.scrollTop = this.elements.messagesContainer.scrollHeight;
        }, 100);
    }

    handleResize() {
        if (window.innerWidth > 768) {
            this.elements.sidebar.classList.remove('active');
        }
    }

    generateChatId() {
        return 'chat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#ef4146' : '#10a37f'};
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            z-index: 10000;
            font-size: 14px;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ChatAI();
});