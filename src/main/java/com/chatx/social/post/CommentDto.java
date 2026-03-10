package com.chatx.social.post;

import java.time.Instant;
import java.util.Collections;
import java.util.List;

public record CommentDto(
        Long id,
        Long postId,
        Long authorId,
        String authorDisplayName,
        Long parentId,
        String content,
        Instant createdAt,
        List<CommentDto> children
) {
    public static CommentDto from(Comment comment) {
        return new CommentDto(
                comment.getId(),
                comment.getPost().getId(),
                comment.getAuthor().getId(),
                comment.getAuthor().getDisplayName(),
                comment.getParent() != null ? comment.getParent().getId() : null,
                comment.getContent(),
                comment.getCreatedAt(),
                Collections.emptyList()
        );
    }

    public static CommentDto withChildren(Comment comment, List<CommentDto> children) {
        return new CommentDto(
                comment.getId(),
                comment.getPost().getId(),
                comment.getAuthor().getId(),
                comment.getAuthor().getDisplayName(),
                comment.getParent() != null ? comment.getParent().getId() : null,
                comment.getContent(),
                comment.getCreatedAt(),
                children
        );
    }
}
