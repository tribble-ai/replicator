/**
 * @description Unified Tribble Agent component with chat and upload
 * Combines chat interface and document upload in a single component
 */
import { LightningElement, track, api } from 'lwc';

export default class TribbleAgent extends LightningElement {
    // Public properties
    @api title = 'Tribble AI Assistant';
    @api enableChat = true;
    @api enableUpload = true;
    @api conversationId;
    @api welcomeMessage = 'Hello! I\'m your Tribble AI assistant. How can I help you today?';

    // Private properties
    @track activeTab = 'chat';

    // Computed properties
    get showChat() {
        return this.enableChat;
    }

    get showUpload() {
        return this.enableUpload;
    }

    get isChatActive() {
        return this.activeTab === 'chat';
    }

    get isUploadActive() {
        return this.activeTab === 'upload';
    }

    get chatTabClass() {
        return this.isChatActive ? 'slds-tabs_default__item slds-is-active' : 'slds-tabs_default__item';
    }

    get uploadTabClass() {
        return this.isUploadActive ? 'slds-tabs_default__item slds-is-active' : 'slds-tabs_default__item';
    }

    // Lifecycle hooks
    connectedCallback() {
        // Set initial active tab based on enabled features
        if (this.enableChat) {
            this.activeTab = 'chat';
        } else if (this.enableUpload) {
            this.activeTab = 'upload';
        }
    }

    // Handle tab selection
    handleTabSelect(event) {
        this.activeTab = event.currentTarget.dataset.tab;
    }

    // Handle chat events
    handleChatMessage(event) {
        // Forward chat events to parent components
        this.dispatchEvent(new CustomEvent('chatmessage', {
            detail: event.detail
        }));
    }

    // Handle upload events
    handleUploadComplete(event) {
        // Forward upload events to parent components
        this.dispatchEvent(new CustomEvent('uploadcomplete', {
            detail: event.detail
        }));

        // Optional: Show notification in chat
        if (this.enableChat && this.template.querySelector('c-tribble-chat')) {
            const chatComponent = this.template.querySelector('c-tribble-chat');
            // Could add a system message about the upload
        }
    }
}
