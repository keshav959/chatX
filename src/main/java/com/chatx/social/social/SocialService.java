package com.chatx.social.social;

import com.chatx.social.user.User;
import com.chatx.social.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Service
public class SocialService {

    private final FollowRepository followRepository;
    private final UserRepository userRepository;

    public SocialService(FollowRepository followRepository, UserRepository userRepository) {
        this.followRepository = followRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public Map<String, Object> follow(Long authUserId, Long targetUserId) {
        if (authUserId.equals(targetUserId)) {
            throw new IllegalArgumentException("You cannot follow yourself");
        }

        followRepository.findByFollowerIdAndFollowingId(authUserId, targetUserId)
                .ifPresent(f -> {
                    throw new IllegalArgumentException("Already following user");
                });

        User follower = userRepository.findById(authUserId)
                .orElseThrow(() -> new IllegalArgumentException("Authenticated user not found"));
        User following = userRepository.findById(targetUserId)
                .orElseThrow(() -> new IllegalArgumentException("Target user not found"));

        Follow follow = new Follow();
        follow.setFollower(follower);
        follow.setFollowing(following);
        followRepository.save(follow);

        return stats(targetUserId, authUserId);
    }

    @Transactional
    public Map<String, Object> unfollow(Long authUserId, Long targetUserId) {
        Follow follow = followRepository.findByFollowerIdAndFollowingId(authUserId, targetUserId)
                .orElseThrow(() -> new IllegalArgumentException("Not following user"));

        followRepository.delete(follow);
        return stats(targetUserId, authUserId);
    }

    public Map<String, Object> stats(Long userId, Long authUserId) {
        boolean isFollowing = followRepository.findByFollowerIdAndFollowingId(authUserId, userId).isPresent();
        long followers = followRepository.countByFollowingId(userId);
        long following = followRepository.countByFollowerId(userId);

        return Map.of(
                "userId", userId,
                "followers", followers,
                "following", following,
                "isFollowing", isFollowing
        );
    }
}
