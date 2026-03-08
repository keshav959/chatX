package com.chatx.social.post;

import java.time.Instant;

public record PostDto(
        Long id,
        Long authorId,
        String authorDisplayName,
        String content,
        Instant createdAt
) {
    public static PostDto from(Post post) {
        return new PostDto(
                post.getId(),
                post.getAuthor().getId(),
                post.getAuthor().getDisplayName(),
                post.getContent(),
                post.getCreatedAt()
        );
    }
}
