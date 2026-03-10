package com.chatx.social.post;

import com.chatx.social.social.Follow;
import com.chatx.social.social.FollowRepository;
import com.chatx.social.user.User;
import com.chatx.social.user.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class PostService {

    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final FollowRepository followRepository;
    private final PostLikeRepository postLikeRepository;
    private final CommentRepository commentRepository;
    private final CommentService commentService;

    public PostService(PostRepository postRepository,
                       UserRepository userRepository,
                       FollowRepository followRepository,
                       PostLikeRepository postLikeRepository,
                       CommentRepository commentRepository,
                       CommentService commentService) {
        this.postRepository = postRepository;
        this.userRepository = userRepository;
        this.followRepository = followRepository;
        this.postLikeRepository = postLikeRepository;
        this.commentRepository = commentRepository;
        this.commentService = commentService;
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

        List<Post> posts = postRepository.findByAuthorIdInOrderByCreatedAtDesc(authorIds, PageRequest.of(page, size))
                .toList();

        if (posts.isEmpty()) {
            return List.of();
        }

        List<Long> postIds = posts.stream().map(Post::getId).toList();

        Map<Long, Long> likeCounts = aggregateLikeCounts(postIds);
        Map<Long, Long> commentCounts = aggregateCommentCounts(postIds);
        Set<Long> likedByUser = postLikeRepository.findByPostIdInAndUserId(postIds, authUserId)
                .stream()
                .map(pl -> pl.getPost().getId())
                .collect(Collectors.toSet());

        Map<Long, List<CommentDto>> topCommentsByPost = new HashMap<>();
        for (Post post : posts) {
            List<CommentDto> topComments = commentService.topComments(post.getId(), 2, 1);
            topCommentsByPost.put(post.getId(), topComments);
        }

        List<PostDto> result = new ArrayList<>();
        for (Post post : posts) {
            long likeCount = likeCounts.getOrDefault(post.getId(), 0L);
            long commentCount = commentCounts.getOrDefault(post.getId(), 0L);
            boolean liked = likedByUser.contains(post.getId());
            List<CommentDto> topComments = topCommentsByPost.getOrDefault(post.getId(), List.of());
            result.add(PostDto.from(post, likeCount, commentCount, liked, topComments));
        }

        return result;
    }

    private Map<Long, Long> aggregateLikeCounts(List<Long> postIds) {
        Map<Long, Long> counts = new HashMap<>();
        List<PostLikeRepository.PostLikeCount> rows = postLikeRepository.countByPostIds(postIds);
        for (PostLikeRepository.PostLikeCount row : rows) {
            counts.put(row.getPostId(), row.getCount());
        }
        return counts;
    }

    private Map<Long, Long> aggregateCommentCounts(List<Long> postIds) {
        Map<Long, Long> counts = new HashMap<>();
        List<CommentRepository.CommentCount> rows = commentRepository.countByPostIds(postIds);
        for (CommentRepository.CommentCount row : rows) {
            counts.put(row.getPostId(), row.getCount());
        }
        return counts;
    }
}
