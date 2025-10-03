/**
 * @description Lightning Web Component for Tribble Document Upload
 * Handles file uploads to Tribble platform with metadata
 */
import { LightningElement, track, api } from 'lwc';
import uploadFile from '@salesforce/apex/TribbleIngestService.uploadFile';
import uploadFromContentVersion from '@salesforce/apex/TribbleIngestService.uploadFromContentVersion';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

const MAX_FILE_SIZE = 10485760; // 10MB default

export default class TribbleUpload extends LightningElement {
    // Public properties
    @api acceptedFormats = '.pdf,.doc,.docx,.txt,.html,.csv,.json,.xlsx';
    @api maxFileSizeMB = 10;
    @api allowMultiple = false;
    @api autoUpload = false;
    @api uploadButtonLabel = 'Upload to Tribble';

    // Private properties
    @track selectedFiles = [];
    @track uploadedFiles = [];
    @track isUploading = false;
    @track uploadProgress = 0;

    // Metadata form
    @track metadata = {
        title: '',
        author: '',
        source: '',
        category: '',
        tags: ''
    };

    // Computed properties
    get hasSelectedFiles() {
        return this.selectedFiles.length > 0;
    }

    get hasUploadedFiles() {
        return this.uploadedFiles.length > 0;
    }

    get uploadButtonDisabled() {
        return !this.hasSelectedFiles || this.isUploading;
    }

    get acceptedFormatsLabel() {
        return `Accepted formats: ${this.acceptedFormats}`;
    }

    get maxFileSizeLabel() {
        return `Maximum file size: ${this.maxFileSizeMB}MB`;
    }

    get maxFileSizeBytes() {
        return this.maxFileSizeMB * 1024 * 1024;
    }

    // Handle file selection
    handleFileChange(event) {
        const files = event.target.files;

        if (!files || files.length === 0) {
            return;
        }

        this.selectedFiles = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];

            // Validate file size
            if (file.size > this.maxFileSizeBytes) {
                this.showError(`File ${file.name} exceeds maximum size of ${this.maxFileSizeMB}MB`);
                continue;
            }

            this.selectedFiles.push({
                id: this.generateId(),
                name: file.name,
                size: file.size,
                type: file.type,
                file: file,
                status: 'pending'
            });
        }

        // Auto-upload if enabled
        if (this.autoUpload && this.selectedFiles.length > 0) {
            this.handleUpload();
        }
    }

    // Handle metadata input
    handleMetadataChange(event) {
        const field = event.target.dataset.field;
        this.metadata[field] = event.target.value;
    }

    // Handle upload
    async handleUpload() {
        if (!this.hasSelectedFiles) {
            return;
        }

        this.isUploading = true;
        this.uploadProgress = 0;

        const totalFiles = this.selectedFiles.length;
        let uploadedCount = 0;

        for (const fileData of this.selectedFiles) {
            try {
                fileData.status = 'uploading';
                const result = await this.uploadSingleFile(fileData);

                if (result.success) {
                    fileData.status = 'completed';
                    fileData.documentIds = result.documentIds;

                    this.uploadedFiles.push({
                        name: fileData.name,
                        documentIds: result.documentIds,
                        timestamp: new Date()
                    });

                    uploadedCount++;
                } else {
                    fileData.status = 'failed';
                    fileData.error = result.errors && result.errors.length > 0 ?
                                      result.errors[0] : 'Upload failed';
                }
            } catch (error) {
                fileData.status = 'failed';
                fileData.error = error.message || 'Unknown error';
            }

            this.uploadProgress = Math.round((uploadedCount / totalFiles) * 100);
        }

        this.isUploading = false;

        // Show summary
        const successCount = this.selectedFiles.filter(f => f.status === 'completed').length;
        const failCount = this.selectedFiles.filter(f => f.status === 'failed').length;

        if (successCount > 0) {
            this.showSuccess(`Successfully uploaded ${successCount} file(s)`);
        }

        if (failCount > 0) {
            this.showError(`Failed to upload ${failCount} file(s)`);
        }
    }

    // Upload single file
    async uploadSingleFile(fileData) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = async () => {
                try {
                    // Convert to base64
                    const base64 = reader.result.split(',')[1];

                    // Build metadata
                    const fileMetadata = {
                        title: this.metadata.title || fileData.name,
                        author: this.metadata.author,
                        source: this.metadata.source,
                        category: this.metadata.category,
                        tags: this.metadata.tags ? this.metadata.tags.split(',').map(t => t.trim()) : [],
                        documentType: this.detectDocumentType(fileData.name)
                    };

                    // Call Apex
                    const result = await uploadFile({
                        fileName: fileData.name,
                        fileContent: base64,
                        metadata: fileMetadata
                    });

                    resolve(result);
                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = () => {
                reject(new Error('Failed to read file'));
            };

            reader.readAsDataURL(fileData.file);
        });
    }

    // Handle clear
    handleClear() {
        this.selectedFiles = [];
        this.uploadProgress = 0;
        this.resetMetadata();

        // Clear file input
        const fileInput = this.template.querySelector('input[type="file"]');
        if (fileInput) {
            fileInput.value = '';
        }
    }

    // Handle clear uploaded files
    handleClearUploaded() {
        this.uploadedFiles = [];
    }

    // Reset metadata
    resetMetadata() {
        this.metadata = {
            title: '',
            author: '',
            source: '',
            category: '',
            tags: ''
        };
    }

    // Detect document type from filename
    detectDocumentType(filename) {
        const ext = filename.toLowerCase().split('.').pop();
        const typeMap = {
            'pdf': 'pdf',
            'html': 'html',
            'htm': 'html',
            'txt': 'text',
            'md': 'text',
            'csv': 'csv',
            'json': 'json',
            'xlsx': 'spreadsheet',
            'xls': 'spreadsheet'
        };
        return typeMap[ext] || 'auto';
    }

    // Format file size
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }

    // Generate unique ID
    generateId() {
        return 'file-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
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
                variant: 'error',
                mode: 'sticky'
            })
        );
    }

    showWarning(message) {
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Warning',
                message: message,
                variant: 'warning'
            })
        );
    }
}
