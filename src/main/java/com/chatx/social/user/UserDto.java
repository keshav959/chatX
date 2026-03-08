package com.chatx.social.user;

import java.time.Instant;

public record UserDto(
        Long id,
        String email,
        String displayName,
        String bio,
        Instant createdAt
) {
    public static UserDto from(User user) {
        return new UserDto(user.getId(), user.getEmail(), user.getDisplayName(), user.getBio(), user.getCreatedAt());
    }
}
