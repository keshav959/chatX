package com.chatx.social.user;

import com.chatx.social.auth.AuthUser;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/{id}")
    public UserDto getProfile(@PathVariable Long id) {
        return userService.getById(id);
    }

    @PutMapping("/{id}")
    public UserDto updateProfile(@PathVariable Long id,
                                 @AuthenticationPrincipal AuthUser authUser,
                                 @Valid @RequestBody UpdateProfileRequest request) {
        return userService.update(id, authUser.getUserId(), request);
    }
}
