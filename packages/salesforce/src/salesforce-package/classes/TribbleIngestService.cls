/**
 * @description Service for document ingestion to Tribble platform
 * Handles file uploads including PDFs, HTML, CSV, JSON, and structured data
 * @author Tribble SDK
 * @version 1.0
 */
public with sharing class TribbleIngestService {

    /**
     * @description Upload response
     */
    public class UploadResponse {
        public Boolean success;
        public List<Integer> documentIds;
        public Integer uploadedCount;
        public Integer failedCount;
        public List<String> errors;

        public UploadResponse() {
            this.success = false;
            this.documentIds = new List<Integer>();
            this.errors = new List<String>();
            this.uploadedCount = 0;
            this.failedCount = 0;
        }
    }

    /**
     * @description File metadata
     */
    public class FileMetadata {
        public String title;
        public String author;
        public String source;
        public List<String> tags;
        public String category;
        public String documentType;
        public Map<String, Object> customFields;

        public FileMetadata() {
            this.tags = new List<String>();
            this.customFields = new Map<String, Object>();
        }
    }

    /**
     * @description Upload a file (PDF, Document, etc.)
     * @param fileName File name
     * @param fileContent File content as base64
     * @param metadata File metadata
     * @return UploadResponse
     */
    public static UploadResponse uploadFile(String fileName, String fileContent, FileMetadata metadata) {
        UploadResponse uploadResponse = new UploadResponse();

        try {
            // Prepare multipart form data
            String boundary = '----WebKitFormBoundary' + generateBoundary();
            String body = buildMultipartBody(fileName, fileContent, metadata, boundary);

            // Prepare HTTP request
            TribbleAPIClient.HTTPRequestWrapper request = new TribbleAPIClient.HTTPRequestWrapper();
            request.endpoint = '/api/upload';
            request.method = 'POST';
            request.body = body;
            request.timeout = 120000; // 2 minutes for file uploads

            // Set multipart headers
            request.headers = new Map<String, String>();
            request.headers.put('Content-Type', 'multipart/form-data; boundary=' + boundary);
            request.headers.put('X-Tribble-Request-Id', TribbleAPIClient.generateRequestId());

            // Execute callout
            TribbleAPIClient.HTTPResponseWrapper response = TribbleAPIClient.executeCallout(request);

            if (response.success) {
                Map<String, Object> responseData = TribbleAPIClient.parseJSON(response.body);
                uploadResponse.success = true;

                if (responseData.containsKey('document_ids')) {
                    List<Object> docIds = (List<Object>) responseData.get('document_ids');
                    for (Object docId : docIds) {
                        uploadResponse.documentIds.add(Integer.valueOf(docId));
                    }
                    uploadResponse.uploadedCount = uploadResponse.documentIds.size();
                }
            } else {
                uploadResponse.errors.add(response.errorMessage);
                uploadResponse.failedCount = 1;
            }

        } catch (Exception e) {
            uploadResponse.errors.add(e.getMessage());
            uploadResponse.failedCount = 1;
            System.debug(LoggingLevel.ERROR, 'Upload Error: ' + e.getMessage());
        }

        return uploadResponse;
    }

    /**
     * @description Upload PDF document
     * @param fileName PDF file name
     * @param fileContent PDF content as base64
     * @param metadata Document metadata
     * @return UploadResponse
     */
    public static UploadResponse uploadPDF(String fileName, String fileContent, FileMetadata metadata) {
        if (metadata == null) {
            metadata = new FileMetadata();
        }
        metadata.documentType = 'pdf';
        return uploadFile(fileName, fileContent, metadata);
    }

    /**
     * @description Upload HTML content
     * @param fileName HTML file name
     * @param htmlContent HTML content as string
     * @param metadata Document metadata
     * @return UploadResponse
     */
    public static UploadResponse uploadHTML(String fileName, String htmlContent, FileMetadata metadata) {
        if (metadata == null) {
            metadata = new FileMetadata();
        }
        metadata.documentType = 'html';

        // Convert HTML to base64
        String base64Content = EncodingUtil.base64Encode(Blob.valueOf(htmlContent));
        return uploadFile(fileName, base64Content, metadata);
    }

    /**
     * @description Upload structured data (CSV, JSON)
     * @param fileName File name
     * @param content Data content
     * @param format Data format (csv, json)
     * @param metadata Document metadata
     * @return UploadResponse
     */
    public static UploadResponse uploadStructuredData(String fileName, String content, String format, FileMetadata metadata) {
        if (metadata == null) {
            metadata = new FileMetadata();
        }
        metadata.documentType = format;

        String base64Content = EncodingUtil.base64Encode(Blob.valueOf(content));
        return uploadFile(fileName, base64Content, metadata);
    }

    /**
     * @description Upload from ContentVersion (Salesforce Files)
     * @param contentVersionId ContentVersion ID
     * @param metadata Optional metadata
     * @return UploadResponse
     */
    public static UploadResponse uploadFromContentVersion(Id contentVersionId, FileMetadata metadata) {
        try {
            // Query ContentVersion
            ContentVersion cv = [
                SELECT Title, FileExtension, VersionData, FileType
                FROM ContentVersion
                WHERE Id = :contentVersionId
                LIMIT 1
            ];

            String fileName = cv.Title + (String.isNotBlank(cv.FileExtension) ? '.' + cv.FileExtension : '');
            String base64Content = EncodingUtil.base64Encode(cv.VersionData);

            if (metadata == null) {
                metadata = new FileMetadata();
                metadata.title = cv.Title;
            }

            // Set document type based on file extension
            if (String.isNotBlank(cv.FileExtension)) {
                metadata.documentType = detectDocumentType(cv.FileExtension);
            }

            return uploadFile(fileName, base64Content, metadata);

        } catch (Exception e) {
            UploadResponse errorResponse = new UploadResponse();
            errorResponse.errors.add(e.getMessage());
            errorResponse.failedCount = 1;
            return errorResponse;
        }
    }

    /**
     * @description Upload from Attachment
     * @param attachmentId Attachment ID
     * @param metadata Optional metadata
     * @return UploadResponse
     */
    public static UploadResponse uploadFromAttachment(Id attachmentId, FileMetadata metadata) {
        try {
            // Query Attachment
            Attachment att = [
                SELECT Name, Body, ContentType
                FROM Attachment
                WHERE Id = :attachmentId
                LIMIT 1
            ];

            String base64Content = EncodingUtil.base64Encode(att.Body);

            if (metadata == null) {
                metadata = new FileMetadata();
                metadata.title = att.Name;
            }

            return uploadFile(att.Name, base64Content, metadata);

        } catch (Exception e) {
            UploadResponse errorResponse = new UploadResponse();
            errorResponse.errors.add(e.getMessage());
            errorResponse.failedCount = 1;
            return errorResponse;
        }
    }

    /**
     * @description Build multipart form body
     */
    private static String buildMultipartBody(String fileName, String fileContent, FileMetadata metadata, String boundary) {
        String body = '';

        // Add file
        body += '--' + boundary + '\r\n';
        body += 'Content-Disposition: form-data; name="files"; filename="' + fileName + '"\r\n';
        body += 'Content-Type: application/octet-stream\r\n\r\n';
        body += fileContent + '\r\n';

        // Add metadata
        body += '--' + boundary + '\r\n';
        body += 'Content-Disposition: form-data; name="metadata_0"\r\n';
        body += 'Content-Type: application/json\r\n\r\n';
        body += serializeMetadata(metadata) + '\r\n';

        body += '--' + boundary + '--\r\n';

        return body;
    }

    /**
     * @description Serialize metadata to JSON
     */
    private static String serializeMetadata(FileMetadata metadata) {
        Map<String, Object> metadataMap = new Map<String, Object>();

        if (String.isNotBlank(metadata.title)) {
            metadataMap.put('title', metadata.title);
        }
        if (String.isNotBlank(metadata.author)) {
            metadataMap.put('author', metadata.author);
        }
        if (String.isNotBlank(metadata.source)) {
            metadataMap.put('source', metadata.source);
        }
        if (metadata.tags != null && !metadata.tags.isEmpty()) {
            metadataMap.put('tags', metadata.tags);
        }
        if (String.isNotBlank(metadata.category)) {
            metadataMap.put('category', metadata.category);
        }
        if (String.isNotBlank(metadata.documentType)) {
            metadataMap.put('documentType', metadata.documentType);
        }
        if (metadata.customFields != null && !metadata.customFields.isEmpty()) {
            metadataMap.putAll(metadata.customFields);
        }

        metadataMap.put('uploadedAt', System.now().format('yyyy-MM-dd\'T\'HH:mm:ss\'Z\''));

        return TribbleAPIClient.toJSON(metadataMap);
    }

    /**
     * @description Generate random boundary for multipart
     */
    private static String generateBoundary() {
        return String.valueOf(Crypto.getRandomLong());
    }

    /**
     * @description Detect document type from file extension
     */
    private static String detectDocumentType(String extension) {
        extension = extension.toLowerCase();

        if (extension == 'pdf') {
            return 'pdf';
        } else if (extension == 'html' || extension == 'htm') {
            return 'html';
        } else if (extension == 'txt' || extension == 'md') {
            return 'text';
        } else if (extension == 'csv') {
            return 'csv';
        } else if (extension == 'json') {
            return 'json';
        } else if (extension == 'xlsx' || extension == 'xls') {
            return 'spreadsheet';
        }

        return 'auto';
    }
}
