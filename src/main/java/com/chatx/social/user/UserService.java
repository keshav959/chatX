package com.chatx.social.user;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public UserDto getById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return UserDto.from(user);
    }

    public Page<UserDto> list(int page, int size) {
        return userRepository.findAll(PageRequest.of(page, Math.min(size, 100)))
                .map(UserDto::from);
    }

    @Transactional
    public UserDto update(Long id, Long authUserId, UpdateProfileRequest request) {
        if (!id.equals(authUserId)) {
            throw new IllegalArgumentException("You can only edit your own profile");
        }

        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        user.setDisplayName(request.displayName().trim());
        user.setBio(request.bio() == null ? null : request.bio().trim());
        return UserDto.from(user);
    }
}
