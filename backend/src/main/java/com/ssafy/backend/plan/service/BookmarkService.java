package com.ssafy.backend.plan.service;

import com.ssafy.backend.plan.dto.request.CreateBookmarkRequestDTO;
import com.ssafy.backend.place.entity.Place;
import com.ssafy.backend.plan.dto.response.GetBookmarkResponseDTO;
import com.ssafy.backend.plan.dto.response.GetBookmarkListResponseDTO;
import com.ssafy.backend.plan.dto.response.CreateBookmarkResponseDTO;
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
    public CreateBookmarkResponseDTO createBookmark(Long planId, CreateBookmarkRequestDTO createBookmarkRequestDTO, Long userId) {
        Plan plan = validatePlanExistence(planId);
        User user = validateUserExistence(userId);

        UserPlan userPlan = userPlanRepository.findByPlanAndUser(plan, user)
                .orElseThrow(() -> new UserNotInPlanException("당신은 이 방의 참여자가 아닙니다."));
        if (userPlan.getUserStatus() == UserStatus.PENDING) {
            throw new PendingUserException("당신이 아직 초대되지 않은 방입니다.");
        }

        Place place = placeRepository.findByGooglePlaceIdForUpdate(createBookmarkRequestDTO.getGooglePlaceId())
                .orElseGet(() -> placeRepository.save(
                        Place.builder()
                                .googlePlaceId(createBookmarkRequestDTO.getGooglePlaceId())
                                .placeName(createBookmarkRequestDTO.getPlaceName())
                                .latitude(createBookmarkRequestDTO.getLatitude())
                                .longitude(createBookmarkRequestDTO.getLongitude())
                                .phoneNumber(createBookmarkRequestDTO.getPhoneNumber())
                                .address(createBookmarkRequestDTO.getAddress())
                                .rating(createBookmarkRequestDTO.getRating())
                                .ratingCount(createBookmarkRequestDTO.getRatingCount())
                                .placeUrl(createBookmarkRequestDTO.getPlaceUrl())
                                .imageUrl(createBookmarkRequestDTO.getImageUrl())
                                .siteUrl(createBookmarkRequestDTO.getSiteUrl())
                                .category(createBookmarkRequestDTO.getCategory())
                                .build()
                ));

        if(bookmarkRepository.existsByPlanAndPlace(plan, place))
        {
            throw new AlreadyBookmarkedException("이미 북마크 되어있습니다.");
        }

        Bookmark bookmark = Bookmark.builder()
                .plan(plan)
                .place(place)
                .build();

        bookmarkRepository.save(bookmark);

        return CreateBookmarkResponseDTO.builder()
                .placeId(place.getPlaceId())
                .bookmarkId(bookmark.getBookmarkId())
                .build();
    }

    public GetBookmarkListResponseDTO getBookmarkList(Long planId, Long userId) {
        Plan plan = validatePlanExistence(planId);
        User user = validateUserExistence(userId);

        UserPlan userPlan = userPlanRepository.findByPlanAndUser(plan, user)
                .orElseThrow(() -> new UserNotInPlanException("당신은 이 방의 참여자가 아닙니다."));
        if (userPlan.getUserStatus() == UserStatus.PENDING) {
            throw new PendingUserException("당신이 아직 초대되지 않은 방입니다.");
        }

        // Query (N+1 방지)
        List<Bookmark> bookmarks = bookmarkRepository.findBookmarksByPlanId(planId);

        List<GetBookmarkResponseDTO> bookmarkResponseDTOList = bookmarks.stream()
                .map(bookmark -> {
                    Place place = bookmark.getPlace();
                    return GetBookmarkResponseDTO.builder()
                            .bookmarkId(bookmark.getBookmarkId())
                            .placeId(place.getPlaceId())
                            .placeName(place.getPlaceName())
                            .latitude(place.getLatitude())
                            .longitude(place.getLongitude())
                            .address(place.getAddress())
                            .rating(place.getRating())
                            .ratingCount(place.getRatingCount())
                            .imageUrl(place.getImageUrl())
                            .build();
                }).toList();

        return GetBookmarkListResponseDTO.builder()
                .bookmarkList(bookmarkResponseDTOList)
                .build();
    }

    @Transactional
    public void deleteBookmark(Long planId, Long bookmarkId, Long userId) {
        Plan plan = validatePlanExistence(planId);
        User user = validateUserExistence(userId);

        UserPlan userPlan = userPlanRepository.findByPlanAndUser(plan, user)
                .orElseThrow(() -> new UserNotInPlanException("당신은 이 방의 참여자가 아닙니다."));
        if (userPlan.getUserStatus() == UserStatus.PENDING) {
            throw new PendingUserException("당신이 아직 초대되지 않은 방입니다.");
        }

        Bookmark bookmark = bookmarkRepository.findByBookmarkIdAndPlanId(bookmarkId, planId)
                .orElseThrow(() -> new BookmarkNotExistException("북마크 되어 있지 않습니다."));

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
}
