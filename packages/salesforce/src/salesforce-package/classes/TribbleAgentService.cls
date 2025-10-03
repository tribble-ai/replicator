/**
 * @description Service for Tribble Agent interactions (chat, streaming)
 * Provides methods to communicate with Tribble AI agents
 * @author Tribble SDK
 * @version 1.0
 */
public with sharing class TribbleAgentService {

    /**
     * @description Chat request payload
     */
    public class ChatRequest {
        public String conversationId;
        public String message;
        public String email;
        public Boolean streaming;

        public ChatRequest(String message) {
            this.message = message;
            this.email = TribbleAPIClient.getCurrentUserEmail();
            this.streaming = false;
        }
    }

    /**
     * @description Chat response
     */
    public class ChatResponse {
        public String conversationId;
        public String message;
        public Long timestamp;
        public Boolean success;
        public String errorMessage;

        public ChatResponse() {
            this.success = false;
        }
    }

    /**
     * @description Send chat message to Tribble agent
     * @param message User message
     * @param conversationId Optional conversation ID for continuing conversation
     * @return ChatResponse
     */
    public static ChatResponse sendMessage(String message, String conversationId) {
        ChatResponse chatResponse = new ChatResponse();

        try {
            // Build request
            ChatRequest chatRequest = new ChatRequest(message);
            chatRequest.conversationId = conversationId;

            // Prepare HTTP request
            TribbleAPIClient.HTTPRequestWrapper request = new TribbleAPIClient.HTTPRequestWrapper();
            request.endpoint = '/chat';
            request.method = 'POST';
            request.body = TribbleAPIClient.toJSON(chatRequest);

            // Add trace header
            request.headers.put('X-Tribble-Request-Id', TribbleAPIClient.generateRequestId());

            // Execute callout
            TribbleAPIClient.HTTPResponseWrapper response = TribbleAPIClient.executeCallout(request);

            if (response.success) {
                // Parse response
                Map<String, Object> responseData = TribbleAPIClient.parseJSON(response.body);

                if (responseData.containsKey('response')) {
                    Map<String, Object> responseObj = (Map<String, Object>) responseData.get('response');
                    chatResponse.conversationId = String.valueOf(responseObj.get('conversation_id'));
                    chatResponse.message = String.valueOf(responseObj.get('message'));
                    chatResponse.success = true;
                } else {
                    // Fallback format
                    chatResponse.conversationId = String.valueOf(responseData.get('conversationId'));
                    chatResponse.message = String.valueOf(responseData.get('message'));
                    chatResponse.success = true;
                }

                chatResponse.timestamp = System.now().getTime();
            } else {
                chatResponse.errorMessage = response.errorMessage;
            }

        } catch (Exception e) {
            chatResponse.errorMessage = e.getMessage();
            System.debug(LoggingLevel.ERROR, 'Chat Error: ' + e.getMessage());
        }

        return chatResponse;
    }

    /**
     * @description Send message with default conversation
     * @param message User message
     * @return ChatResponse
     */
    public static ChatResponse sendMessage(String message) {
        return sendMessage(message, null);
    }

    /**
     * @description Parse instructions for agent
     * @param payload Instruction payload
     * @param suffix Optional suffix to append
     * @return Formatted instructions
     */
    public static String formatInstructions(Object payload, String suffix) {
        String content = (payload instanceof String) ?
                         (String) payload :
                         TribbleAPIClient.toJSON(payload);

        if (String.isNotBlank(suffix)) {
            return content + '\n\n' + suffix;
        }
        return content;
    }

    /**
     * @description Extract JSON from agent response
     * @param text Response text
     * @return Parsed object
     */
    public static Map<String, Object> parseJSONFromText(String text) {
        // Find first JSON object in text
        Integer startIdx = text.indexOf('{');
        if (startIdx == -1) {
            startIdx = text.indexOf('[');
        }

        if (startIdx == -1) {
            throw new TribbleException('No JSON found in message');
        }

        // Try to parse from end backwards
        for (Integer endIdx = text.length(); endIdx > startIdx; endIdx--) {
            String chunk = text.substring(startIdx, endIdx);
            try {
                return TribbleAPIClient.parseJSON(chunk);
            } catch (Exception e) {
                // Continue trying
            }
        }

        throw new TribbleException('Failed to parse JSON from message');
    }

    /**
     * @description Get conversation history (if available)
     * @param conversationId Conversation ID
     * @return List of messages
     */
    public static List<Map<String, Object>> getConversationHistory(String conversationId) {
        List<Map<String, Object>> messages = new List<Map<String, Object>>();

        try {
            TribbleAPIClient.HTTPRequestWrapper request = new TribbleAPIClient.HTTPRequestWrapper();
            request.endpoint = '/conversations/' + conversationId;
            request.method = 'GET';

            TribbleAPIClient.HTTPResponseWrapper response = TribbleAPIClient.executeCallout(request);

            if (response.success) {
                Map<String, Object> data = TribbleAPIClient.parseJSON(response.body);
                if (data.containsKey('messages')) {
                    messages = (List<Map<String, Object>>) data.get('messages');
                }
            }
        } catch (Exception e) {
            System.debug(LoggingLevel.ERROR, 'Get Conversation Error: ' + e.getMessage());
        }

        return messages;
    }

    /**
     * @description Custom exception for Tribble operations
     */
    public class TribbleException extends Exception {}
}
