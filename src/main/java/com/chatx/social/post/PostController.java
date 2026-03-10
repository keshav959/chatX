package com.chatx.social.post;

import com.chatx.social.auth.AuthUser;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class PostController {

    private final PostService postService;
    private final LikeService likeService;
    private final CommentService commentService;

    public PostController(PostService postService, LikeService likeService, CommentService commentService) {
        this.postService = postService;
        this.likeService = likeService;
        this.commentService = commentService;
    }

    @PostMapping("/posts")
    public PostDto create(@AuthenticationPrincipal AuthUser authUser,
                          @Valid @RequestBody CreatePostRequest request) {
        return postService.create(authUser.getUserId(), request);
    }

    @GetMapping("/feed")
    public List<PostDto> feed(@AuthenticationPrincipal AuthUser authUser,
                              @RequestParam(defaultValue = "0") int page,
                              @RequestParam(defaultValue = "20") int size) {
        return postService.feed(authUser.getUserId(), page, Math.min(size, 100));
    }

    @PostMapping("/posts/{postId}/likes")
    @ResponseStatus(HttpStatus.CREATED)
    public void like(@AuthenticationPrincipal AuthUser authUser,
                     @PathVariable Long postId) {
        likeService.like(postId, authUser.getUserId());
    }

    @DeleteMapping("/posts/{postId}/likes")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unlike(@AuthenticationPrincipal AuthUser authUser,
                       @PathVariable Long postId) {
        likeService.unlike(postId, authUser.getUserId());
    }

    @PostMapping("/posts/{postId}/comments")
    public CommentDto comment(@AuthenticationPrincipal AuthUser authUser,
                              @PathVariable Long postId,
                              @Valid @RequestBody CreateCommentRequest request) {
        return commentService.createComment(postId, authUser.getUserId(), request);
    }

    @PostMapping("/posts/{postId}/comments/{commentId}/replies")
    public CommentDto reply(@AuthenticationPrincipal AuthUser authUser,
                            @PathVariable Long postId,
                            @PathVariable Long commentId,
                            @Valid @RequestBody CreateCommentRequest request) {
        return commentService.replyToComment(postId, commentId, authUser.getUserId(), request);
    }

    @GetMapping("/posts/{postId}/comments")
    public Page<CommentDto> comments(@AuthenticationPrincipal AuthUser authUser,
                                     @PathVariable Long postId,
                                     @RequestParam(defaultValue = "0") int page,
                                     @RequestParam(defaultValue = "20") int size) {
        int cappedSize = Math.min(size, 50);
        return commentService.getComments(postId, page, cappedSize);
    }

    @DeleteMapping("/comments/{commentId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteComment(@AuthenticationPrincipal AuthUser authUser,
                              @PathVariable Long commentId) {
        commentService.deleteComment(commentId, authUser.getUserId());
    }
}
