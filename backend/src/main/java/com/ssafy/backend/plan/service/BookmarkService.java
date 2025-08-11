package com.ssafy.backend.plan.service;

import com.ssafy.backend.plan.dto.request.CreatePlaceRequestDTO;
import com.ssafy.backend.place.entity.Place;
import com.ssafy.backend.plan.dto.response.BookmarkResponseDTO;
import com.ssafy.backend.plan.dto.response.BookmarkListResponseDTO;
import com.ssafy.backend.plan.entity.Bookmark;
import com.ssafy.backend.plan.entity.Plan;
import com.ssafy.backend.plan.exception.*;
import com.ssafy.backend.plan.repository.BookmarkRepository;
import com.ssafy.backend.place.repository.PlaceRepository;
import com.ssafy.backend.plan.repository.PlanRepository;
import com.ssafy.backend.plan.repository.UserPlanRepository;
import com.ssafy.backend.user.entity.User;
import com.ssafy.backend.user.entity.UserPlan;
import com.ssafy.backend.user.entity.UserStatus;
import com.ssafy.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BookmarkService {

    private final UserRepository userRepository;
    private final PlanRepository planRepository;
    private final BookmarkRepository bookmarkRepository;
    private final PlaceRepository placeRepository;
    private final UserPlanRepository userPlanRepository;

    @Transactional
    public Long createBookmark(Long planId, CreatePlaceRequestDTO createPlaceRequestDTO, Long userId) {
        Plan plan = validatePlanExistence(planId);
        User user = validateUserExistence(userId);

        if(!userPlanRepository.existsByPlanAndUser(plan, user)) {
            throw new NotInThisRoomException("당신은 이 방의 참여자가 아닙니다.");
        }
        UserPlan userPlan = userPlanRepository.getUserPlanByPlanAndUser(plan, user);
        if (userPlan.getUserStatus() == UserStatus.PENDING) {
            throw new NotInThisRoomException("당신은 이 방의 참여자가 아닙니다.");
        }

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
                                .placeUrl(createPlaceRequestDTO.getPlaceUrl())
                                .imageUrl(createPlaceRequestDTO.getImageUrl())
                                .siteUrl(createPlaceRequestDTO.getSiteUrl())
                                .category(createPlaceRequestDTO.getCategory())
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
        return place.getPlaceId();
    }

    public BookmarkListResponseDTO showBookmark(Long planId, Long userId) {
        Plan plan = validatePlanExistence(planId);
        User user = validateUserExistence(userId);

        UserPlan userPlan = userPlanRepository.findByPlanAndUser(plan, user)
                .orElseThrow(() -> new NotInThisRoomException("당신은 이 방의 참여자가 아닙니다."));

        if (userPlan.getUserStatus() == UserStatus.PENDING) {
            throw new NotInThisRoomException("당신은 이 방의 참여자가 아닙니다.");
        }

        List<Bookmark> bookmarks = bookmarkRepository.findBookmarksByPlanId(planId);

        List<BookmarkResponseDTO> bookmarkResponseDTOS = bookmarks.stream()
                .map(bookmark -> {
                    Place place = bookmark.getPlace();
                    return new BookmarkResponseDTO(
                            place.getPlaceId(),
                            place.getPlaceName(),
                            place.getLatitude(),
                            place.getLongitude(),
                            place.getAddress(),
                            place.getRating(),
                            place.getImageUrl());
                }).toList();

        return BookmarkListResponseDTO.builder()
                .bookmarkList(bookmarkResponseDTOS)
                .build();
    }

    @Transactional
    public void deleteBookmark(Long planId, Long bookmarkId, Long userId) {
        Plan plan = validatePlanExistence(planId);
        User user = validateUserExistence(userId);
        Bookmark bookmark = validateBookmarkExistence(bookmarkId);

        if(!userPlanRepository.existsByPlanAndUser(plan, user)) {
            throw new NotInThisRoomException("당신은 이 방의 참여자가 아닙니다.");
        }
        UserPlan userPlan = userPlanRepository.getUserPlanByPlanAndUser(plan, user);
        if (userPlan.getUserStatus() == UserStatus.PENDING) {
            throw new NotInThisRoomException("당신은 이 방의 참여자가 아닙니다.");
        }

        if(bookmark.getPlan().getPlanId() != planId) {
            throw new BookmarkNotExistException("북마크 되어 있지 않습니다.");
        }

        bookmarkRepository.delete(bookmark);
    }

    private User validateUserExistence(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new UserNotExistException("존재하지 않는 사용자입니다. userId=" + userId));
    }

    private Plan validatePlanExistence(Long planId) {
        return planRepository.findById(planId)
                .orElseThrow(() -> new PlanNotExistException("존재하지 않는 계획입니다. planId=" + planId));
    }

    private Bookmark validateBookmarkExistence(Long bookmarkId) {
        return bookmarkRepository.findById(bookmarkId)
                .orElseThrow(() -> new BookmarkNotExistException("북마크 되어 있지 않습니다. bookmarkId=" + bookmarkId));
    }
}
