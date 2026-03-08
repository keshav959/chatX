package com.chatx.social.post;

import com.chatx.social.social.Follow;
import com.chatx.social.social.FollowRepository;
import com.chatx.social.user.User;
import com.chatx.social.user.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
public class PostService {

    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final FollowRepository followRepository;

    public PostService(PostRepository postRepository,
                       UserRepository userRepository,
                       FollowRepository followRepository) {
        this.postRepository = postRepository;
        this.userRepository = userRepository;
        this.followRepository = followRepository;
    }

    @Transactional
    public PostDto create(Long authUserId, CreatePostRequest request) {
        User author = userRepository.findById(authUserId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Post post = new Post();
        post.setAuthor(author);
        post.setContent(request.content().trim());

        return PostDto.from(postRepository.save(post));
    }

    public List<PostDto> feed(Long authUserId, int page, int size) {
        List<Long> authorIds = new ArrayList<>();
        authorIds.add(authUserId);

        List<Follow> follows = followRepository.findAllByFollowerId(authUserId);
        for (Follow follow : follows) {
            authorIds.add(follow.getFollowing().getId());
        }

        return postRepository.findByAuthorIdInOrderByCreatedAtDesc(authorIds, PageRequest.of(page, size))
                .map(PostDto::from)
                .toList();
    }
}
