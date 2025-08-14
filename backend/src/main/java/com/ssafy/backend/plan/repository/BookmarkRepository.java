package com.ssafy.backend.plan.repository;

import com.ssafy.backend.plan.entity.Bookmark;
import com.ssafy.backend.place.entity.Place;
import com.ssafy.backend.plan.entity.Plan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BookmarkRepository extends JpaRepository<Bookmark,Long>, BookmarkQueryRepository {
    // createBookmark에서 Bookmark 되어 있는지 체크
    boolean existsByPlanAndPlace(Plan plan, Place place);
}
