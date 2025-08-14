package com.ssafy.backend.place.repository;

import com.ssafy.backend.place.entity.Place;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PlaceRepository extends JpaRepository<Place,Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Place p WHERE p.googlePlaceId = :googlePlaceId")
    Optional<Place> findByGooglePlaceIdForUpdate(String googlePlaceId);
}
