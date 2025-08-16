class ChatApp {
    constructor() {
        this.token = localStorage.getItem('token');
        this.currentConversation = null;
        this.init();
    }

    async init() {
        this.bindEvents();
        if (this.token) {
            await this.checkOnboardingStatus();
        } else {
            this.showAuth();
        }
    }

    bindEvents() {
        // Auth events
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        const onboardingForm = document.getElementById('onboarding-form');
        
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }
        if (onboardingForm) {
            onboardingForm.addEventListener('submit', (e) => this.handleOnboarding(e));
        }

        // Chat events (these might not exist initially)
        const logoutBtn = document.getElementById('logout-btn');
        const newChatBtn = document.getElementById('new-chat-btn');
        const sendBtn = document.getElementById('send-btn');
        const messageInput = document.getElementById('message-input');
        
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }
        if (newChatBtn) {
            newChatBtn.addEventListener('click', () => this.createNewConversation());
        }
        if (sendBtn) {
            sendBtn.addEventListener('click', () => this.sendMessage());
        }
        if (messageInput) {
            messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
            
            // Auto-resize input
            messageInput.addEventListener('input', (e) => {
                this.autoResizeInput(e.target);
                this.showTypingStatus();
            });
        }
        
        // Emoji button
        const emojiBtn = document.getElementById('emoji-btn');
        if (emojiBtn) {
            emojiBtn.addEventListener('click', () => this.toggleEmojiPicker());
        }
        
        // Voice button
        const voiceBtn = document.getElementById('voice-btn');
        if (voiceBtn) {
            voiceBtn.addEventListener('click', () => this.toggleVoiceInput());
        }
    }

    showAuth() {
        document.getElementById('auth-container').classList.remove('hidden');
        document.getElementById('onboarding-container').classList.add('hidden');
        document.getElementById('chat-container').classList.add('hidden');
    }

    showOnboarding() {
        document.getElementById('auth-container').classList.add('hidden');
        document.getElementById('onboarding-container').classList.remove('hidden');
        document.getElementById('chat-container').classList.add('hidden');
    }

    showChat() {
        document.getElementById('auth-container').classList.add('hidden');
        document.getElementById('onboarding-container').classList.add('hidden');
        document.getElementById('chat-container').classList.remove('hidden');
    }

    async handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            if (response.ok) {
                this.token = data.token;
                localStorage.setItem('token', this.token);
                await this.checkOnboardingStatus();
            } else {
                alert(data.error);
            }
        } catch (error) {
            alert('Login failed');
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        const username = document.getElementById('register-username').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });

            const data = await response.json();
            if (response.ok) {
                this.token = data.token;
                localStorage.setItem('token', this.token);
                this.showOnboarding(); // New users go to onboarding
            } else {
                alert(data.error);
            }
        } catch (error) {
            alert('Registration failed');
        }
    }

    logout() {
        this.token = null;
        localStorage.removeItem('token');
        this.showAuth();
    }

    async loadConversations() {
        try {
            const response = await fetch('/api/chat/conversations', {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });

            const conversations = await response.json();
            this.renderConversations(conversations);

            if (conversations.length > 0) {
                this.selectConversation(conversations[0].id);
            }
        } catch (error) {
            console.error('Failed to load conversations:', error);
        }
    }

    renderConversations(conversations) {
        const container = document.getElementById('conversations-list');
        container.innerHTML = conversations.map(conv => `
            <div class="conversation-item" data-id="${conv.id}">
                ${conv.title}
            </div>
        `).join('');

        // Add click handlers
        container.querySelectorAll('.conversation-item').forEach(item => {
            item.addEventListener('click', () => {
                this.selectConversation(parseInt(item.dataset.id));
            });
        });
    }

    async selectConversation(conversationId) {
        this.currentConversation = conversationId;

        // Update UI
        document.querySelectorAll('.conversation-item').forEach(item => {
            item.classList.toggle('active', parseInt(item.dataset.id) === conversationId);
        });

        // Load messages
        try {
            const response = await fetch(`/api/chat/conversations/${conversationId}/messages`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });

            const messages = await response.json();
            this.renderMessages(messages);
        } catch (error) {
            console.error('Failed to load messages:', error);
        }
    }

    renderMessages(messages) {
        const container = document.getElementById('messages-container');
        container.innerHTML = messages.map(msg => `
            <div class="message ${msg.role}">
                ${msg.content}
            </div>
        `).join('');
        container.scrollTop = container.scrollHeight;
    }

    async createNewConversation() {
        try {
            const response = await fetch('/api/chat/conversations', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ title: 'New Conversation' })
            });

            const conversation = await response.json();
            this.loadConversations();
            this.selectConversation(conversation.id);
        } catch (error) {
            console.error('Failed to create conversation:', error);
        }
    }

    async sendMessage() {
        const input = document.getElementById('message-input');
        const content = input.value.trim();

        if (!content || !this.currentConversation) return;

        const sendBtn = document.getElementById('send-btn');
        sendBtn.disabled = true;
        input.value = '';

        // Add user message to UI immediately
        this.addMessageToUI('user', content);

        // Show typing indicator
        this.showTypingIndicator();

        try {
            const response = await fetch(`/api/chat/conversations/${this.currentConversation}/messages`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ content })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Server error:', errorData);
                
                // Handle different error types
                this.hideTypingIndicator();
                this.handleChatError(errorData);
                return;
            }

            const data = await response.json();
            // Remove typing indicator and show response
            this.hideTypingIndicator();
            this.addMessageToUI('assistant', data.content);
        } catch (error) {
            console.error('Send message error:', error);
            this.hideTypingIndicator();
            this.addMessageToUI('assistant', 'Sorry, I encountered a connection error. Please check your internet and try again.');
        } finally {
            if (sendBtn) {
                sendBtn.disabled = false;
            }
        }
    }

    showTypingIndicator() {
        // Update status
        this.updateChatStatus('typing');
        
        const container = document.getElementById('messages-container');
        const typingDiv = document.createElement('div');
        typingDiv.id = 'typing-indicator';
        typingDiv.className = 'typing-indicator';
        typingDiv.innerHTML = `
            <span class="typing-text">Daddy John is typing</span>
            <div class="typing-dots">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        `;
        container.appendChild(typingDiv);
        this.smoothScrollToBottom();
    }

    hideTypingIndicator() {
        // Update status back to online
        this.updateChatStatus('online');
        
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.style.animation = 'messageSlideOut 0.3s ease-in forwards';
            setTimeout(() => {
                if (typingIndicator.parentNode) {
                    typingIndicator.remove();
                }
            }, 300);
        }
    }

    async checkOnboardingStatus() {
        try {
            const response = await fetch('/api/preferences', {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            
            const preferences = await response.json();
            
            if (preferences.onboarding_completed) {
                this.showChat();
                this.loadConversations();
            } else {
                this.showOnboarding();
            }
        } catch (error) {
            console.error('Failed to check onboarding status:', error);
            this.showOnboarding();
        }
    }

    async handleOnboarding(e) {
        e.preventDefault();
        
        const formData = {
            preferred_name: document.getElementById('preferred-name').value,
            likes: document.getElementById('likes').value,
            turn_offs: document.getElementById('turn-offs').value,
            curious_about: document.getElementById('curious-about').value,
            relationship_status: document.getElementById('relationship-status').value,
            connection_type: document.getElementById('connection-type').value,
            additional_info: document.getElementById('additional-info').value
        };

        try {
            const response = await fetch('/api/preferences', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                this.showChat();
                this.loadConversations();
            } else {
                alert('Failed to save preferences');
            }
        } catch (error) {
            alert('Failed to save preferences');
        }
    }

    addMessageToUI(role, content) {
        const container = document.getElementById('messages-container');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}`;
        
        // Add timestamp
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        // Enhanced message content with reactions
        messageDiv.innerHTML = `
            <div class="message-content">${this.formatMessage(content)}</div>
            <div class="message-meta">
                <span class="message-time">${timestamp}</span>
            </div>
        `;
        
        container.appendChild(messageDiv);
        
        // Add entrance animation
        setTimeout(() => {
            messageDiv.style.opacity = '1';
            messageDiv.style.transform = 'translateY(0)';
        }, 50);
        
        this.smoothScrollToBottom();
        
        // Play message sound
        this.playMessageSound(role);
    }
    
    formatMessage(content) {
        // Add emoji support and basic formatting
        return content
            .replace(/:\)/g, '😊')
            .replace(/:\(/g, '😢')
            .replace(/:D/g, '😄')
            .replace(/;\)/g, '😉')
            .replace(/<3/g, '💙')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>');
    }
    
    smoothScrollToBottom() {
        const container = document.getElementById('messages-container');
        container.scrollTo({
            top: container.scrollHeight,
            behavior: 'smooth'
        });
    }
    
    playMessageSound(role) {
        // Create audio context for subtle sound effects
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            // Different tones for user vs assistant
            oscillator.frequency.setValueAtTime(role === 'user' ? 800 : 600, audioContext.currentTime);
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.2);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.2);
        } catch (error) {
            // Silently fail if audio context not supported
        }
    }
    
    updateChatStatus(status) {
        const statusElement = document.getElementById('chat-status');
        if (statusElement) {
            switch (status) {
                case 'typing':
                    statusElement.textContent = 'Typing...';
                    statusElement.style.color = '#8b5cf6';
                    break;
                case 'online':
                    statusElement.textContent = 'Online • Ready to chat';
                    statusElement.style.color = '#10b981';
                    break;
                case 'thinking':
                    statusElement.textContent = 'Thinking...';
                    statusElement.style.color = '#f59e0b';
                    break;
                case 'offline':
                    statusElement.textContent = 'Credits exhausted • Try tomorrow';
                    statusElement.style.color = '#ef4444';
                    break;
                case 'limited':
                    statusElement.textContent = 'Rate limited • Please wait';
                    statusElement.style.color = '#f59e0b';
                    break;
            }
        }
    }
    
    autoResizeInput(input) {
        input.style.height = '20px';
        input.style.height = Math.min(input.scrollHeight, 80) + 'px';
    }
    
    showTypingStatus() {
        // Show "typing" status briefly
        this.updateChatStatus('thinking');
        clearTimeout(this.typingTimeout);
        this.typingTimeout = setTimeout(() => {
            this.updateChatStatus('online');
        }, 1000);
    }
    
    toggleEmojiPicker() {
        const input = document.getElementById('message-input');
        const emojis = ['😊', '😄', '😢', '😍', '🤔', '👍', '❤️', '🔥', '💯', '🎉', '😂', '🥰'];
        const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
        
        if (input) {
            input.value += randomEmoji;
            input.focus();
            this.autoResizeInput(input);
        }
    }
    
    toggleVoiceInput() {
        // Placeholder for voice input functionality
        const voiceBtn = document.getElementById('voice-btn');
        if (voiceBtn) {
            voiceBtn.style.color = '#8b5cf6';
            setTimeout(() => {
                voiceBtn.style.color = '';
            }, 1000);
        }
        
        // Show notification
        this.showNotification('Voice input coming soon! 🎤');
    }
    
    handleChatError(errorData) {
        const errorType = errorData.type || 'general';
        const errorMessage = errorData.error || 'An error occurred';
        
        switch (errorType) {
            case 'credits':
                // Show credits exhausted message
                this.addMessageToUI('assistant', errorMessage);
                this.showNotification('💳 Free credits exhausted for today!', 'error');
                this.updateChatStatus('offline');
                break;
                
            case 'rate_limit':
                this.addMessageToUI('assistant', '⏱️ Please wait a moment before sending another message.');
                this.showNotification('Rate limit - please wait', 'warning');
                break;
                
            case 'auth':
                this.addMessageToUI('assistant', '🔐 Authentication error. Please refresh and try again.');
                this.showNotification('Authentication failed', 'error');
                break;
                
            default:
                this.addMessageToUI('assistant', 'Sorry, I encountered an error. Please try again.');
                this.showNotification('Something went wrong', 'error');
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        
        let backgroundColor;
        switch (type) {
            case 'error':
                backgroundColor = 'linear-gradient(135deg, #ef4444, #dc2626)';
                break;
            case 'warning':
                backgroundColor = 'linear-gradient(135deg, #f59e0b, #d97706)';
                break;
            case 'success':
                backgroundColor = 'linear-gradient(135deg, #10b981, #059669)';
                break;
            default:
                backgroundColor = 'linear-gradient(135deg, #8b5cf6, #ec4899)';
        }
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${backgroundColor};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            z-index: 1000;
            animation: slideInRight 0.3s ease-out;
            max-width: 300px;
            word-wrap: break-word;
        `;
        
        document.body.appendChild(notification);
        
        const duration = type === 'error' ? 5000 : 3000; // Show errors longer
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-in forwards';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }, duration);
    }
}

// Tab switching functions
function showLogin() {
    document.getElementById('login-form').classList.remove('hidden');
    document.getElementById('register-form').classList.add('hidden');
    document.querySelectorAll('.tab-btn').forEach((btn, i) => {
        btn.classList.toggle('active', i === 0);
    });
}

function showRegister() {
    document.getElementById('login-form').classList.add('hidden');
    document.getElementById('register-form').classList.remove('hidden');
    document.querySelectorAll('.tab-btn').forEach((btn, i) => {
        btn.classList.toggle('active', i === 1);
    });
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ChatApp();
});