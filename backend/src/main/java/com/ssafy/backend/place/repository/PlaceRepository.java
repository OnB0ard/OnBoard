package com.ssafy.backend.place.repository;

import com.ssafy.backend.plan.entity.Place;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PlaceRepository extends JpaRepository<Place,Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<Place> findByGooglePlaceIdForUpdate(String googlePlaceId);
}
