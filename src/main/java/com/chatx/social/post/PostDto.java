package com.chatx.social.post;

import java.time.Instant;
import java.util.Collections;
import java.util.List;

public record PostDto(
        Long id,
        Long authorId,
        String authorDisplayName,
        String content,
        Instant createdAt,
        long likeCount,
        long commentCount,
        boolean likedByMe,
        List<CommentDto> topComments
) {
    public static PostDto from(Post post) {
        return from(post, 0, 0, false, Collections.emptyList());
    }

    public static PostDto from(Post post,
                               long likeCount,
                               long commentCount,
                               boolean likedByMe,
                               List<CommentDto> topComments) {
        return new PostDto(post.getId(),
                post.getAuthor().getId(),
                post.getAuthor().getDisplayName(),
                post.getContent(),
                post.getCreatedAt(),
                likeCount,
                commentCount,
                likedByMe,
                topComments);
    }
}
