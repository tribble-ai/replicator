/**
 * ServiceNow UI Components for Tribble integration
 * Service Portal widgets and UI Pages
 */

export const TRIBBLE_CHAT_WIDGET = {
  id: 'tribble_chat_widget',
  name: 'Tribble AI Chat',
  description: 'Interactive chat widget powered by Tribble AI agents',

  template: `
<div class="tribble-chat-widget">
  <div class="tribble-chat-header">
    <h3>{{::data.title}}</h3>
    <button ng-click="c.toggleChat()" class="btn-icon">
      <i class="fa" ng-class="c.isExpanded ? 'fa-minus' : 'fa-plus'"></i>
    </button>
  </div>

  <div class="tribble-chat-body" ng-show="c.isExpanded">
    <div class="tribble-chat-messages" id="tribble-messages">
      <div ng-repeat="msg in c.messages track by $index"
           class="tribble-message"
           ng-class="{'tribble-message-user': msg.isUser, 'tribble-message-bot': !msg.isUser}">
        <div class="tribble-message-avatar">
          <i class="fa" ng-class="msg.isUser ? 'fa-user' : 'fa-robot'"></i>
        </div>
        <div class="tribble-message-content">
          <div class="tribble-message-text" ng-bind-html="msg.text"></div>
          <div class="tribble-message-time">{{msg.timestamp | date:'short'}}</div>
        </div>
      </div>
      <div ng-show="c.isLoading" class="tribble-message tribble-message-bot">
        <div class="tribble-message-avatar">
          <i class="fa fa-robot"></i>
        </div>
        <div class="tribble-message-content">
          <div class="tribble-typing-indicator">
            <span></span><span></span><span></span>
          </div>
        </div>
      </div>
    </div>

    <div class="tribble-chat-input">
      <input type="text"
             ng-model="c.messageText"
             ng-keypress="c.handleKeyPress($event)"
             placeholder="Type your message..."
             class="form-control"
             ng-disabled="c.isLoading">
      <button ng-click="c.sendMessage()"
              class="btn btn-primary"
              ng-disabled="!c.messageText || c.isLoading">
        <i class="fa fa-paper-plane"></i>
      </button>
    </div>
  </div>
</div>
  `,

  clientScript: `
function TribbleChatWidget() {
  var c = this;

  c.isExpanded = true;
  c.isLoading = false;
  c.messageText = '';
  c.messages = [];
  c.sessionId = null;

  c.$onInit = function() {
    c.sessionId = c.generateSessionId();
    c.addBotMessage(c.options.welcomeMessage || 'Hello! How can I help you today?');
  };

  c.toggleChat = function() {
    c.isExpanded = !c.isExpanded;
  };

  c.sendMessage = function() {
    if (!c.messageText.trim()) return;

    var userMessage = c.messageText;
    c.addUserMessage(userMessage);
    c.messageText = '';
    c.isLoading = true;

    c.server.get({
      message: userMessage,
      sessionId: c.sessionId,
      agentId: c.options.agentId
    }).then(function(response) {
      c.isLoading = false;
      if (response.data && response.data.reply) {
        c.addBotMessage(response.data.reply);
      } else {
        c.addBotMessage('Sorry, I encountered an error. Please try again.');
      }
      c.scrollToBottom();
    }, function(error) {
      c.isLoading = false;
      c.addBotMessage('Sorry, I encountered an error. Please try again.');
      c.scrollToBottom();
    });
  };

  c.handleKeyPress = function(event) {
    if (event.keyCode === 13) {
      c.sendMessage();
    }
  };

  c.addUserMessage = function(text) {
    c.messages.push({
      text: text,
      isUser: true,
      timestamp: new Date()
    });
    c.scrollToBottom();
  };

  c.addBotMessage = function(text) {
    c.messages.push({
      text: text,
      isUser: false,
      timestamp: new Date()
    });
    c.scrollToBottom();
  };

  c.scrollToBottom = function() {
    setTimeout(function() {
      var elem = document.getElementById('tribble-messages');
      if (elem) {
        elem.scrollTop = elem.scrollHeight;
      }
    }, 100);
  };

  c.generateSessionId = function() {
    return 'session-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  };
}
  `,

  serverScript: `
(function() {
  var tribbleClient = new TribbleAPIClient();

  var message = input.message;
  var sessionId = input.sessionId;
  var agentId = input.agentId;

  if (!message) {
    data.error = 'Message is required';
    return;
  }

  var result = tribbleClient.sendChatMessage(message, sessionId, agentId);

  if (result.success) {
    data.reply = result.data.message || result.data.reply;
    data.sessionId = sessionId;
  } else {
    data.error = result.error;
  }
})();
  `,

  css: `
.tribble-chat-widget {
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
  background: white;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.tribble-chat-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tribble-chat-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.tribble-chat-header .btn-icon {
  background: rgba(255,255,255,0.2);
  border: none;
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  transition: background 0.2s;
}

.tribble-chat-header .btn-icon:hover {
  background: rgba(255,255,255,0.3);
}

.tribble-chat-body {
  display: flex;
  flex-direction: column;
  height: 400px;
}

.tribble-chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: #f8f9fa;
}

.tribble-message {
  display: flex;
  margin-bottom: 15px;
  animation: fadeIn 0.3s;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.tribble-message-user {
  flex-direction: row-reverse;
}

.tribble-message-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
}

.tribble-message-user .tribble-message-avatar {
  background: #667eea;
  color: white;
  margin-left: 10px;
}

.tribble-message-bot .tribble-message-avatar {
  background: #e9ecef;
  color: #495057;
  margin-right: 10px;
}

.tribble-message-content {
  max-width: 70%;
}

.tribble-message-text {
  background: white;
  padding: 12px 16px;
  border-radius: 18px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
  word-wrap: break-word;
}

.tribble-message-user .tribble-message-text {
  background: #667eea;
  color: white;
}

.tribble-message-time {
  font-size: 11px;
  color: #6c757d;
  margin-top: 4px;
  padding: 0 8px;
}

.tribble-typing-indicator {
  background: white;
  padding: 12px 20px;
  border-radius: 18px;
  display: inline-block;
}

.tribble-typing-indicator span {
  height: 8px;
  width: 8px;
  background: #6c757d;
  border-radius: 50%;
  display: inline-block;
  margin: 0 2px;
  animation: typing 1.4s infinite;
}

.tribble-typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.tribble-typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-10px); }
}

.tribble-chat-input {
  display: flex;
  padding: 15px;
  background: white;
  border-top: 1px solid #ddd;
  gap: 10px;
}

.tribble-chat-input input {
  flex: 1;
  border-radius: 24px;
  border: 1px solid #ddd;
  padding: 10px 16px;
}

.tribble-chat-input button {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: none;
  background: #667eea;
  color: white;
  cursor: pointer;
  transition: background 0.2s;
}

.tribble-chat-input button:hover:not(:disabled) {
  background: #5568d3;
}

.tribble-chat-input button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
  `,

  optionSchema: [
    {
      name: 'title',
      label: 'Chat Title',
      type: 'string',
      defaultValue: 'AI Assistant',
    },
    {
      name: 'welcomeMessage',
      label: 'Welcome Message',
      type: 'string',
      defaultValue: 'Hello! How can I help you today?',
    },
    {
      name: 'agentId',
      label: 'Tribble Agent ID',
      type: 'string',
      defaultValue: '',
    },
  ],
};

export const TRIBBLE_UPLOAD_WIDGET = {
  id: 'tribble_upload_widget',
  name: 'Tribble Document Upload',
  description: 'Upload and ingest documents into Tribble',

  template: `
<div class="tribble-upload-widget">
  <div class="tribble-upload-header">
    <h3>{{::data.title}}</h3>
  </div>

  <div class="tribble-upload-body">
    <div class="tribble-upload-dropzone"
         ng-class="{'tribble-dragover': c.isDragOver}"
         ng-drag-enter="c.handleDragEnter($event)"
         ng-drag-leave="c.handleDragLeave($event)"
         ng-drop="c.handleDrop($event)">
      <i class="fa fa-cloud-upload fa-3x"></i>
      <p>Drag and drop files here or click to browse</p>
      <input type="file"
             id="tribble-file-input"
             multiple
             ng-change="c.handleFileSelect($event)"
             style="display: none;">
      <button class="btn btn-primary" onclick="document.getElementById('tribble-file-input').click()">
        Choose Files
      </button>
    </div>

    <div ng-show="c.files.length > 0" class="tribble-upload-list">
      <h4>Files to Upload</h4>
      <div ng-repeat="file in c.files track by $index" class="tribble-upload-item">
        <div class="tribble-upload-item-info">
          <i class="fa fa-file"></i>
          <span class="tribble-upload-item-name">{{file.name}}</span>
          <span class="tribble-upload-item-size">{{c.formatFileSize(file.size)}}</span>
        </div>
        <div class="tribble-upload-item-actions">
          <button ng-if="!file.uploading && !file.uploaded"
                  ng-click="c.removeFile($index)"
                  class="btn btn-sm btn-link">
            <i class="fa fa-times"></i>
          </button>
          <i ng-if="file.uploading" class="fa fa-spinner fa-spin"></i>
          <i ng-if="file.uploaded" class="fa fa-check text-success"></i>
        </div>
      </div>

      <button ng-click="c.uploadFiles()"
              class="btn btn-success"
              ng-disabled="c.isUploading || !c.hasFilesToUpload()">
        <i class="fa fa-upload"></i> Upload All
      </button>
    </div>
  </div>
</div>
  `,

  clientScript: `
function TribbleUploadWidget() {
  var c = this;

  c.files = [];
  c.isDragOver = false;
  c.isUploading = false;

  c.handleDragEnter = function(event) {
    event.preventDefault();
    c.isDragOver = true;
  };

  c.handleDragLeave = function(event) {
    event.preventDefault();
    c.isDragOver = false;
  };

  c.handleDrop = function(event) {
    event.preventDefault();
    c.isDragOver = false;
    var files = event.dataTransfer.files;
    c.addFiles(files);
  };

  c.handleFileSelect = function(event) {
    var files = event.target.files;
    c.addFiles(files);
  };

  c.addFiles = function(fileList) {
    for (var i = 0; i < fileList.length; i++) {
      c.files.push({
        file: fileList[i],
        name: fileList[i].name,
        size: fileList[i].size,
        uploading: false,
        uploaded: false
      });
    }
    $scope.$apply();
  };

  c.removeFile = function(index) {
    c.files.splice(index, 1);
  };

  c.hasFilesToUpload = function() {
    return c.files.some(function(f) { return !f.uploaded; });
  };

  c.uploadFiles = function() {
    c.isUploading = true;

    var promises = c.files.filter(function(f) {
      return !f.uploaded;
    }).map(function(fileObj) {
      fileObj.uploading = true;
      return c.uploadFile(fileObj);
    });

    Promise.all(promises).then(function() {
      c.isUploading = false;
      $scope.$apply();
    });
  };

  c.uploadFile = function(fileObj) {
    return new Promise(function(resolve, reject) {
      var reader = new FileReader();
      reader.onload = function(e) {
        var base64Content = btoa(e.target.result);

        c.server.get({
          fileName: fileObj.name,
          fileContent: base64Content,
          fileSize: fileObj.size
        }).then(function(response) {
          fileObj.uploading = false;
          fileObj.uploaded = true;
          fileObj.documentId = response.data.documentId;
          resolve();
        }, function(error) {
          fileObj.uploading = false;
          fileObj.error = true;
          reject(error);
        });
      };
      reader.readAsBinaryString(fileObj.file);
    });
  };

  c.formatFileSize = function(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };
}
  `,

  serverScript: `
(function() {
  var ingestService = new TribbleIngestService();

  var fileName = input.fileName;
  var fileContent = input.fileContent;
  var fileSize = input.fileSize;

  if (!fileName || !fileContent) {
    data.error = 'File name and content are required';
    return;
  }

  var metadata = {
    fileName: fileName,
    fileSize: fileSize,
    uploadedBy: gs.getUserName(),
    uploadedAt: new GlideDateTime().toString()
  };

  var tribbleClient = new TribbleAPIClient();
  var result = tribbleClient.ingestDocument(fileName, fileContent, metadata);

  if (result.success) {
    data.documentId = result.documentId;
  } else {
    data.error = result.error;
  }
})();
  `,

  css: `
.tribble-upload-widget {
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
  background: white;
}

.tribble-upload-header {
  background: #f8f9fa;
  padding: 15px;
  border-bottom: 1px solid #ddd;
}

.tribble-upload-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.tribble-upload-body {
  padding: 20px;
}

.tribble-upload-dropzone {
  border: 2px dashed #ddd;
  border-radius: 8px;
  padding: 40px;
  text-align: center;
  transition: all 0.3s;
  cursor: pointer;
}

.tribble-upload-dropzone:hover {
  border-color: #667eea;
  background: #f8f9fa;
}

.tribble-upload-dropzone.tribble-dragover {
  border-color: #667eea;
  background: #e7f5ff;
}

.tribble-upload-dropzone i {
  color: #6c757d;
  margin-bottom: 15px;
}

.tribble-upload-dropzone p {
  color: #6c757d;
  margin: 15px 0;
}

.tribble-upload-list {
  margin-top: 30px;
}

.tribble-upload-list h4 {
  font-size: 16px;
  margin-bottom: 15px;
}

.tribble-upload-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-bottom: 10px;
}

.tribble-upload-item-info {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
}

.tribble-upload-item-name {
  font-weight: 500;
}

.tribble-upload-item-size {
  color: #6c757d;
  font-size: 13px;
}

.tribble-upload-item-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}
  `,

  optionSchema: [
    {
      name: 'title',
      label: 'Widget Title',
      type: 'string',
      defaultValue: 'Upload Documents',
    },
  ],
};

export * from './widgets';
