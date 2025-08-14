package com.ssafy.backend.plan.repository;


import com.ssafy.backend.plan.entity.Bookmark;

import java.util.List;
import java.util.Optional;

public interface BookmarkQueryRepository {
    // 한 개의 plan방 내부에 있는 모든 북마크 조회 (N+1 제거)
    List<Bookmark> findBookmarksByPlanId(Long planId);

    // 북마크가 이 plan에 속해있는지 확인
    Optional<Bookmark> findByBookmarkIdAndPlanId(Long bookmarkId, Long planId);
}
