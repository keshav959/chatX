package com.chatx.social.chat;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ChatSocketMessage(
        @NotNull Long senderId,
        @NotBlank @Size(min = 1, max = 2000) String content
) {
}
