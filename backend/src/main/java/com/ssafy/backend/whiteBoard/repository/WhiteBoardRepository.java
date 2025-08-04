package com.ssafy.backend.whiteBoard.repository;


import com.ssafy.backend.plan.entity.Plan;
import com.ssafy.backend.user.entity.User;
import com.ssafy.backend.whiteBoard.entity.WhiteBoardObject;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WhiteBoardRepository extends JpaRepository<WhiteBoardObject, Long> {
    @Query("SELECT w FROM WhiteBoardObject w LEFT JOIN FETCH w.place WHERE w.plan = :plan")
    List<WhiteBoardObject> findByPlanWithPlace(@Param("plan") Plan plan);
}
