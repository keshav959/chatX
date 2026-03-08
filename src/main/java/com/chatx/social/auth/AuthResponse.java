package com.chatx.social.auth;

public record AuthResponse(
        String accessToken,
        String refreshToken,
        Long userId,
        String email,
        String displayName
) {
}
