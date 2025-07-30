package com.ssafy.backend.plan.repository;

import com.ssafy.backend.plan.entity.Bookmark;
import com.ssafy.backend.plan.entity.Place;
import com.ssafy.backend.plan.entity.Plan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BookmarkRepository extends JpaRepository<Bookmark,Long> {

    boolean existsByPlanAndPlace(Plan plan, Place place);
}
