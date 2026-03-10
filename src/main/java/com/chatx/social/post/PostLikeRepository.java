package com.chatx.social.post;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PostLikeRepository extends JpaRepository<PostLike, Long> {

    boolean existsByPostIdAndUserId(Long postId, Long userId);

    List<PostLike> findByPostIdInAndUserId(List<Long> postIds, Long userId);

    @Modifying
    @Query("delete from PostLike pl where pl.post.id = :postId and pl.user.id = :userId")
    void deleteByPostIdAndUserId(@Param("postId") Long postId, @Param("userId") Long userId);

    @Query("select pl.post.id as postId, count(pl) as count from PostLike pl where pl.post.id in :postIds group by pl.post.id")
    List<PostLikeCount> countByPostIds(@Param("postIds") List<Long> postIds);

    interface PostLikeCount {
        Long getPostId();

        long getCount();
    }
}
