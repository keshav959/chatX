package com.chatx.social.post;

import com.chatx.social.user.User;
import com.chatx.social.user.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class CommentService {

    private final CommentRepository commentRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;

    public CommentService(CommentRepository commentRepository,
                          PostRepository postRepository,
                          UserRepository userRepository) {
        this.commentRepository = commentRepository;
        this.postRepository = postRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public CommentDto createComment(Long postId, Long authorId, CreateCommentRequest request) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found"));
        User author = userRepository.findById(authorId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Comment comment = new Comment();
        comment.setPost(post);
        comment.setAuthor(author);
        comment.setContent(request.content().trim());

        return CommentDto.from(commentRepository.save(comment));
    }

    @Transactional
    public CommentDto replyToComment(Long postId, Long parentCommentId, Long authorId, CreateCommentRequest request) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found"));
        Comment parent = commentRepository.findById(parentCommentId)
                .orElseThrow(() -> new IllegalArgumentException("Parent comment not found"));

        if (parent.getParent() != null) {
            throw new IllegalArgumentException("Only one-level replies are allowed");
        }
        if (!parent.getPost().getId().equals(post.getId())) {
            throw new IllegalArgumentException("Comment does not belong to this post");
        }

        User author = userRepository.findById(authorId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Comment reply = new Comment();
        reply.setPost(post);
        reply.setAuthor(author);
        reply.setParent(parent);
        reply.setContent(request.content().trim());

        return CommentDto.from(commentRepository.save(reply));
    }

    public Page<CommentDto> getComments(Long postId, int page, int size) {
        if (!postRepository.existsById(postId)) {
            throw new IllegalArgumentException("Post not found");
        }
        Page<Comment> roots = commentRepository.findByPostIdAndParentIsNullOrderByCreatedAtDesc(postId, PageRequest.of(page, size));
        List<Long> rootIds = roots.stream().map(Comment::getId).toList();
        Map<Long, List<CommentDto>> repliesByParent = fetchReplies(rootIds);

        return roots.map(root -> CommentDto.withChildren(root, repliesByParent.getOrDefault(root.getId(), List.of())));
    }

    @Transactional
    public void deleteComment(Long commentId, Long requesterId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("Comment not found"));
        if (!comment.getAuthor().getId().equals(requesterId)) {
            throw new IllegalArgumentException("Cannot delete another user's comment");
        }
        commentRepository.delete(comment);
    }

    public List<CommentDto> topComments(Long postId, int rootsLimit, int repliesLimit) {
        List<Comment> roots = commentRepository
                .findByPostIdAndParentIsNullOrderByCreatedAtDesc(postId, PageRequest.of(0, rootsLimit))
                .getContent();
        List<Long> rootIds = roots.stream().map(Comment::getId).toList();
        Map<Long, List<CommentDto>> repliesByParent = fetchRepliesLimited(rootIds, repliesLimit);

        List<CommentDto> result = new ArrayList<>();
        for (Comment root : roots) {
            List<CommentDto> children = repliesByParent.getOrDefault(root.getId(), List.of());
            result.add(CommentDto.withChildren(root, children));
        }
        return result;
    }

    private Map<Long, List<CommentDto>> fetchReplies(List<Long> parentIds) {
        if (parentIds.isEmpty()) {
            return Map.of();
        }
        List<Comment> replies = commentRepository.findByParentIdInOrderByCreatedAtDesc(parentIds);
        return replies.stream()
                .collect(Collectors.groupingBy(reply -> reply.getParent().getId(),
                        Collectors.mapping(CommentDto::from, Collectors.toList())));
    }

    private Map<Long, List<CommentDto>> fetchRepliesLimited(List<Long> parentIds, int repliesLimit) {
        if (parentIds.isEmpty()) {
            return Map.of();
        }
        List<Comment> replies = new ArrayList<>();
        for (Long parentId : parentIds) {
            List<Comment> topReplies = commentRepository.findByParentIdOrderByCreatedAtDesc(parentId, PageRequest.of(0, repliesLimit));
            replies.addAll(topReplies);
        }
        return replies.stream()
                .collect(Collectors.groupingBy(reply -> reply.getParent().getId(),
                        Collectors.mapping(CommentDto::from, Collectors.toList())));
    }
}
