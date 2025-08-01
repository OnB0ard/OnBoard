package com.ssafy.backend.plan.repository;


import com.ssafy.backend.plan.entity.Bookmark;

import java.util.List;

public interface BookmarkQueryRepository {
    List<Bookmark> findBookmarksByPlanId(Long planId);
}
