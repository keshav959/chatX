package com.chatx.social.social;

import com.chatx.social.auth.AuthUser;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class SocialController {

    private final SocialService socialService;

    public SocialController(SocialService socialService) {
        this.socialService = socialService;
    }

    @PostMapping("/{id}/follow")
    public Map<String, Object> follow(@PathVariable Long id,
                                      @AuthenticationPrincipal AuthUser authUser) {
        return socialService.follow(authUser.getUserId(), id);
    }

    @DeleteMapping("/{id}/follow")
    public Map<String, Object> unfollow(@PathVariable Long id,
                                        @AuthenticationPrincipal AuthUser authUser) {
        return socialService.unfollow(authUser.getUserId(), id);
    }

    @GetMapping("/{id}/social")
    public Map<String, Object> socialStats(@PathVariable Long id,
                                           @AuthenticationPrincipal AuthUser authUser) {
        return socialService.stats(id, authUser.getUserId());
    }
}
