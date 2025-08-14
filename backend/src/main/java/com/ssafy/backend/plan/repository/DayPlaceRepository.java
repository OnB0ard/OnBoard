package com.ssafy.backend.plan.repository;

import com.ssafy.backend.plan.entity.DayPlace;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DayPlaceRepository extends JpaRepository<DayPlace, Long>, DayPlaceQueryRepository {
}
