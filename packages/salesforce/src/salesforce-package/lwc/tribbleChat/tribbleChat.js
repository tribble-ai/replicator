/**
 * @description Lightning Web Component for Tribble Chat Interface
 * Provides real-time chat interaction with Tribble AI agents
 */
import { LightningElement, track, api } from 'lwc';
import sendMessage from '@salesforce/apex/TribbleAgentService.sendMessage';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class TribbleChat extends LightningElement {
    // Public properties
    @api conversationId;
    @api userEmail;
    @api placeholder = 'Ask me anything...';
    @api maxMessageLength = 4000;
    @api showTypingIndicator = true;

    // Private properties
    @track messages = [];
    @track inputMessage = '';
    @track isLoading = false;
    @track isTyping = false;

    // Computed properties
    get isInputDisabled() {
        return this.isLoading || this.inputMessage.length === 0;
    }

    get messageCount() {
        return this.messages.length;
    }

    get hasMessages() {
        return this.messages.length > 0;
    }

    // Lifecycle hooks
    connectedCallback() {
        this.initializeChat();
    }

    // Initialize chat
    initializeChat() {
        if (!this.conversationId) {
            this.addSystemMessage('Chat initialized. How can I help you today?');
        }
    }

    // Handle input change
    handleInputChange(event) {
        this.inputMessage = event.target.value;
    }

    // Handle send message
    handleSendMessage() {
        if (!this.inputMessage || this.inputMessage.trim() === '') {
            return;
        }

        const userMessage = this.inputMessage.trim();
        this.inputMessage = '';

        // Add user message to chat
        this.addMessage({
            id: this.generateId(),
            role: 'user',
            content: userMessage,
            timestamp: new Date()
        });

        // Send to Tribble
        this.sendToTribble(userMessage);
    }

    // Handle key press (Enter to send)
    handleKeyPress(event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            this.handleSendMessage();
        }
    }

    // Send message to Tribble API
    async sendToTribble(message) {
        this.isLoading = true;

        if (this.showTypingIndicator) {
            this.isTyping = true;
        }

        try {
            const result = await sendMessage({
                message: message,
                conversationId: this.conversationId
            });

            if (result.success) {
                // Update conversation ID
                if (result.conversationId) {
                    this.conversationId = result.conversationId;
                }

                // Add assistant response
                this.addMessage({
                    id: this.generateId(),
                    role: 'assistant',
                    content: result.message,
                    timestamp: new Date(result.timestamp || Date.now())
                });
            } else {
                this.showError('Failed to send message: ' + (result.errorMessage || 'Unknown error'));
                this.addSystemMessage('Error: ' + (result.errorMessage || 'Failed to get response'));
            }
        } catch (error) {
            console.error('Chat error:', error);
            this.showError('An error occurred while sending your message');
            this.addSystemMessage('Error: Unable to connect to Tribble AI');
        } finally {
            this.isLoading = false;
            this.isTyping = false;
            this.scrollToBottom();
        }
    }

    // Add message to chat
    addMessage(message) {
        this.messages = [...this.messages, message];
        this.scrollToBottom();
    }

    // Add system message
    addSystemMessage(content) {
        this.addMessage({
            id: this.generateId(),
            role: 'system',
            content: content,
            timestamp: new Date()
        });
    }

    // Clear chat
    handleClearChat() {
        this.messages = [];
        this.conversationId = null;
        this.addSystemMessage('Chat cleared. Start a new conversation.');
    }

    // Export chat
    handleExportChat() {
        const chatData = {
            conversationId: this.conversationId,
            messages: this.messages,
            exportedAt: new Date().toISOString()
        };

        const dataStr = JSON.stringify(chatData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

        const exportFileDefaultName = `tribble-chat-${this.conversationId || 'export'}.json`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();

        this.showSuccess('Chat exported successfully');
    }

    // Scroll to bottom of chat
    scrollToBottom() {
        setTimeout(() => {
            const chatContainer = this.template.querySelector('.chat-messages');
            if (chatContainer) {
                chatContainer.scrollTop = chatContainer.scrollHeight;
            }
        }, 100);
    }

    // Generate unique ID
    generateId() {
        return 'msg-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }

    // Format timestamp
    formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString();
    }

    // Show toast notifications
    showSuccess(message) {
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Success',
                message: message,
                variant: 'success'
            })
        );
    }

    showError(message) {
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Error',
                message: message,
                variant: 'error'
            })
        );
    }
}
