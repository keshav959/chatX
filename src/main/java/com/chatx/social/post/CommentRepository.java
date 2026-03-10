package com.chatx.social.post;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Long> {

    Page<Comment> findByPostIdAndParentIsNullOrderByCreatedAtDesc(Long postId, Pageable pageable);

    List<Comment> findTop2ByPostIdAndParentIsNullOrderByCreatedAtDesc(Long postId);

    List<Comment> findByParentIdOrderByCreatedAtDesc(Long parentId);

    List<Comment> findByParentIdOrderByCreatedAtDesc(Long parentId, Pageable pageable);

    List<Comment> findByParentIdInOrderByCreatedAtDesc(List<Long> parentIds);

    List<Comment> findTop1ByParentIdOrderByCreatedAtDesc(Long parentId);

    @Query("select c.post.id as postId, count(c) as count from Comment c where c.post.id in :postIds group by c.post.id")
    List<CommentCount> countByPostIds(@Param("postIds") List<Long> postIds);

    interface CommentCount {
        Long getPostId();

        long getCount();
    }
}
