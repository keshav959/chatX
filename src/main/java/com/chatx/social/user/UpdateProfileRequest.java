package com.chatx.social.user;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
        @NotBlank @Size(min = 2, max = 60) String displayName,
        @Size(max = 300) String bio
) {
}
