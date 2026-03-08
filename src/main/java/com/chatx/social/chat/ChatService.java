package com.chatx.social.chat;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ChatService {

    private final ChatMessageRepository chatMessageRepository;

    public ChatService(ChatMessageRepository chatMessageRepository) {
        this.chatMessageRepository = chatMessageRepository;
    }

    public ChatMessageDto send(String chatId, Long senderId, String content) {
        ChatMessage message = new ChatMessage();
        message.setChatId(chatId);
        message.setSenderId(senderId);
        message.setContent(content.trim());
        return ChatMessageDto.from(chatMessageRepository.save(message));
    }

    public List<ChatMessageDto> latest(String chatId, int size) {
        return chatMessageRepository
                .findByChatIdOrderByCreatedAtDesc(chatId, PageRequest.of(0, Math.min(size, 100)))
                .stream()
                .map(ChatMessageDto::from)
                .toList();
    }
}
