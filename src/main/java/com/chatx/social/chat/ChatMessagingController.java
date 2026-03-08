package com.chatx.social.chat;

import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
public class ChatMessagingController {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;

    public ChatMessagingController(ChatService chatService, SimpMessagingTemplate messagingTemplate) {
        this.chatService = chatService;
        this.messagingTemplate = messagingTemplate;
    }

    @MessageMapping("/chat.send.{chatId}")
    public void send(@DestinationVariable String chatId, @Payload ChatSocketMessage message) {
        ChatMessageDto saved = chatService.send(chatId, message.senderId(), message.content());
        messagingTemplate.convertAndSend("/topic/chat." + chatId, saved);
    }
}
