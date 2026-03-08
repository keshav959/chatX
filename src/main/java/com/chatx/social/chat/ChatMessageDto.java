package com.chatx.social.chat;

import java.time.Instant;

public record ChatMessageDto(
        String id,
        String chatId,
        Long senderId,
        String content,
        Instant createdAt
) {
    public static ChatMessageDto from(ChatMessage message) {
        return new ChatMessageDto(
                message.getId(),
                message.getChatId(),
                message.getSenderId(),
                message.getContent(),
                message.getCreatedAt()
        );
    }
}
