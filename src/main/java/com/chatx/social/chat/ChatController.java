package com.chatx.social.chat;

import com.chatx.social.auth.AuthUser;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chats")
public class ChatController {

    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    @PostMapping("/{chatId}/messages")
    public ChatMessageDto sendMessage(@PathVariable String chatId,
                                      @AuthenticationPrincipal AuthUser authUser,
                                      @Valid @RequestBody SendChatMessageRequest request) {
        return chatService.send(chatId, authUser.getUserId(), request.content());
    }

    @GetMapping("/{chatId}/messages")
    public List<ChatMessageDto> getMessages(@PathVariable String chatId,
                                            @RequestParam(defaultValue = "50") int size) {
        return chatService.latest(chatId, size);
    }
}
