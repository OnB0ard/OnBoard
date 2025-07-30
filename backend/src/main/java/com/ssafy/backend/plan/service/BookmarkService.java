package com.ssafy.backend.plan.service;

import com.ssafy.backend.plan.dto.request.CreatePlaceRequestDTO;
import com.ssafy.backend.plan.entity.Bookmark;
import com.ssafy.backend.plan.entity.Place;
import com.ssafy.backend.plan.entity.Plan;
import com.ssafy.backend.plan.exception.BookmarkExistException;
import com.ssafy.backend.plan.exception.PlanNotExistException;
import com.ssafy.backend.plan.repository.BookmarkRepository;
import com.ssafy.backend.place.repository.PlaceRepository;
import com.ssafy.backend.plan.repository.PlanRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BookmarkService {

    private final PlanRepository planRepository;
    private final BookmarkRepository bookmarkRepository;
    private final PlaceRepository placeRepository;

    @Transactional
    public boolean addBookmark(Long planId, CreatePlaceRequestDTO createPlaceRequestDTO) {
        Plan plan = validatePlanExistence(planId);
        Place place = placeRepository.findByGooglePlaceIdForUpdate(createPlaceRequestDTO.getGooglePlaceId())
                .orElseGet(() -> placeRepository.save(
                        Place.builder()
                                .googlePlaceId(createPlaceRequestDTO.getGooglePlaceId())
                                .placeName(createPlaceRequestDTO.getPlaceName())
                                .latitude(createPlaceRequestDTO.getLatitude())
                                .longitude(createPlaceRequestDTO.getLongitude())
                                .phoneNumber(createPlaceRequestDTO.getPhoneNumber())
                                .address(createPlaceRequestDTO.getAddress())
                                .rating(createPlaceRequestDTO.getRating())
                                .ratingCount(createPlaceRequestDTO.getRatingCount())
                                .googleUrl(createPlaceRequestDTO.getGoogleUrl())
                                .googleImg(createPlaceRequestDTO.getGoogleImg())
                                .build()
                ));

        if(bookmarkRepository.existsByPlanAndPlace(plan, place))
        {
            throw new BookmarkExistException("이미 북마크 되어있습니다.");
        }

        Bookmark bookmark = new Bookmark();
        bookmark.setPlan(plan);
        bookmark.setPlace(place);

        bookmarkRepository.save(bookmark);
        return true;
    }

    private Plan validatePlanExistence(Long planId) {
        return planRepository.findById(planId)
                .orElseThrow(() -> new PlanNotExistException("존재하지 않는 계획입니다. planId=" + planId));
    }
}
