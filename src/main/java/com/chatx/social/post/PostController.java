package com.chatx.social.post;

import com.chatx.social.auth.AuthUser;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class PostController {

    private final PostService postService;

    public PostController(PostService postService) {
        this.postService = postService;
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
}
