package com.ssafy.backend.plan.service;

import com.ssafy.backend.plan.dto.request.TitleRequestDTO;
import com.ssafy.backend.plan.dto.request.UpdateSchedulePositionRequestDTO;
import com.ssafy.backend.plan.dto.response.CreateDayScheduleResponseDTO;
import com.ssafy.backend.plan.dto.response.DayPlaceResponseDTO;
import com.ssafy.backend.plan.dto.response.DayScheduleResponseDTO;
import com.ssafy.backend.plan.dto.response.PlanScheduleResponseDTO;
import com.ssafy.backend.plan.entity.DayPlace;
import com.ssafy.backend.plan.entity.DaySchedule;
import com.ssafy.backend.plan.entity.Plan;
import com.ssafy.backend.plan.exception.*;
import com.ssafy.backend.plan.repository.DayPlaceRepository;
import com.ssafy.backend.plan.repository.DayScheduleRepository;
import com.ssafy.backend.plan.repository.PlanRepository;
import com.ssafy.backend.plan.repository.UserPlanRepository;
import com.ssafy.backend.user.entity.User;
import com.ssafy.backend.user.entity.UserPlan;
import com.ssafy.backend.user.entity.UserStatus;
import com.ssafy.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DayScheduleService {

    private final DayScheduleRepository dayScheduleRepository;
    private final UserRepository userRepository;
    private final PlanRepository planRepository;
    private final UserPlanRepository userPlanRepository;
    private final DayPlaceRepository dayPlaceRepository;

    @Transactional
    public CreateDayScheduleResponseDTO createDaySchedule(Long planId, TitleRequestDTO titleRequestDTO, Long userId) {
        User user = validateUserExistence(userId);
        Plan plan = planRepository.findByIdForUpdate(planId);

        UserPlan userPlan = userPlanRepository.findByPlanAndUser(plan, user)
                .orElseThrow(() -> new NotInThisRoomException("당신은 이 방의 참여자가 아닙니다."));
        if (userPlan.getUserStatus() == UserStatus.PENDING) {
            throw new NotInThisRoomException("당신은 이 방의 참여자가 아닙니다.");
        }

        Integer maxDayOrder = dayScheduleRepository.findMaxDayOrderByPlan(plan);

        DaySchedule daySchedule = DaySchedule.builder()
                .plan(plan)
                .dayOrder(maxDayOrder+1)
                .title(titleRequestDTO.getTitle())
                .build();

        dayScheduleRepository.save(daySchedule);

        return CreateDayScheduleResponseDTO.builder()
                .dayScheduleId(daySchedule.getDayScheduleId())
                .planId(plan.getPlanId())
                .dayOrder(daySchedule.getDayOrder())
                .title(daySchedule.getTitle())
                .build();
    }

    public PlanScheduleResponseDTO getPlanSchedule(Long planId, Long userId) {
        User user = validateUserExistence(userId);
        Plan plan = validatePlanExistence(planId);

        UserPlan userPlan = userPlanRepository.findByPlanAndUser(plan, user)
                .orElseThrow(() -> new NotInThisRoomException("당신은 이 방의 참여자가 아닙니다."));
        if (userPlan.getUserStatus() == UserStatus.PENDING) {
                throw new NotInThisRoomException("당신은 이 방의 참여자가 아닙니다.");
        }

        List<DayPlace> dayPlaces = dayPlaceRepository.getPlanScheduleByPlanId(planId);

        Map<DaySchedule, List<DayPlaceResponseDTO>> daySchedule = dayPlaces.stream()
                .collect(Collectors.groupingBy(
                        DayPlace::getDaySchedule,
                        Collectors.mapping(dp -> DayPlaceResponseDTO.builder()
                                .dayPlaceId(dp.getDayPlaceId())
                                .indexOrder(dp.getIndexOrder())
                                .memo(dp.getMemo())
                                .whiteBoardObjectId(dp.getWhiteBoardObject().getWhiteBoardObjectId())
                                .placeId(dp.getWhiteBoardObject().getPlace().getPlaceId())
                                .googlePlaceId(dp.getWhiteBoardObject().getPlace().getGooglePlaceId())
                                .placeName(dp.getWhiteBoardObject().getPlace().getPlaceName())
                                .latitude(dp.getWhiteBoardObject().getPlace().getLatitude())
                                .longitude(dp.getWhiteBoardObject().getPlace().getLongitude())
                                .address(dp.getWhiteBoardObject().getPlace().getAddress())
                                .rating(dp.getWhiteBoardObject().getPlace().getRating())
                                .ratingCount(dp.getWhiteBoardObject().getPlace().getRatingCount())
                                .imageUrl(dp.getWhiteBoardObject().getPlace().getImageUrl())
                                .build(), Collectors.toList())
                ));

        List<DayScheduleResponseDTO> planSchedule = daySchedule.entrySet().stream()
                .map(entry -> DayScheduleResponseDTO.builder()
                        .dayScheduleId(entry.getKey().getDayScheduleId())
                        .dayOrder(entry.getKey().getDayOrder())
                        .title(entry.getKey().getTitle())
                        .daySchedule(entry.getValue())
                        .build()
                )
                .sorted(Comparator.comparing(DayScheduleResponseDTO::getDayOrder))
                .toList();

        return new PlanScheduleResponseDTO(planSchedule);
    }

    public DayScheduleResponseDTO getDaySchedule(Long planId, Long dayScheduleId, Long userId) {
        User user = validateUserExistence(userId);
        List<DayPlace> dayPlaces = dayPlaceRepository.getDayScheduleByDayScheduleIdAndPlanId(dayScheduleId, planId);

        if (dayPlaces.isEmpty()) {
            throw new DayScheduleNotExistException("존재하지 않거나 해당 플랜에 속하지 않는 일정입니다.");
        }

        Plan plan = dayPlaces.get(0).getDaySchedule().getPlan();

        UserPlan userPlan = userPlanRepository.findByPlanAndUser(plan, user)
                .orElseThrow(() -> new NotInThisRoomException("당신은 이 방의 참여자가 아닙니다."));
        if (userPlan.getUserStatus() == UserStatus.PENDING) {
            throw new NotInThisRoomException("당신은 이 방의 참여자가 아닙니다.");
        }

        DaySchedule daySchedule = dayPlaces.get(0).getDaySchedule();

        List<DayPlaceResponseDTO> dayPlaceResponseDTOS = dayPlaces.stream()
                .map(dp -> DayPlaceResponseDTO.builder()
                        .dayPlaceId(dp.getDayPlaceId())
                        .indexOrder(dp.getIndexOrder())
                        .memo(dp.getMemo())
                        .whiteBoardObjectId(dp.getWhiteBoardObject().getWhiteBoardObjectId())
                        .placeId(dp.getWhiteBoardObject().getPlace().getPlaceId())
                        .googlePlaceId(dp.getWhiteBoardObject().getPlace().getGooglePlaceId())
                        .placeName(dp.getWhiteBoardObject().getPlace().getPlaceName())
                        .latitude(dp.getWhiteBoardObject().getPlace().getLatitude())
                        .longitude(dp.getWhiteBoardObject().getPlace().getLongitude())
                        .address(dp.getWhiteBoardObject().getPlace().getAddress())
                        .rating(dp.getWhiteBoardObject().getPlace().getRating())
                        .ratingCount(dp.getWhiteBoardObject().getPlace().getRatingCount())
                        .imageUrl(dp.getWhiteBoardObject().getPlace().getImageUrl())
                        .build()
                )
                .sorted(Comparator.comparing(DayPlaceResponseDTO::getIndexOrder))
                .toList();

        return DayScheduleResponseDTO.builder()
                .dayScheduleId(daySchedule.getDayScheduleId())
                .dayOrder(daySchedule.getDayOrder())
                .title(daySchedule.getTitle())
                .daySchedule(dayPlaceResponseDTOS)
                .build();
    }

    @Transactional
    public boolean modifyTitle(Long planId, Long dayScheduleId, TitleRequestDTO titleRequestDTO, Long userId) {
        User user = validateUserExistence(userId);
        Plan plan = validatePlanExistence(planId);
        DaySchedule daySchedule = validateDaySchedule(dayScheduleId);

        UserPlan userPlan = userPlanRepository.findByPlanAndUser(plan, user)
                .orElseThrow(() -> new NotInThisRoomException("당신은 이 방의 참여자가 아닙니다."));
        if (userPlan.getUserStatus() == UserStatus.PENDING) {
            throw new NotInThisRoomException("당신은 이 방의 참여자가 아닙니다.");
        }

        if(daySchedule.getPlan().getPlanId() != planId)
        {
            throw new DayScheduleNotInThisPlanException("이 방의 일정이 아닙니다.");
        }

        daySchedule.setTitle(titleRequestDTO.getTitle());
        return true;
    }

    @Transactional
    public boolean updateSchedulePosition(Long planId, Long dayScheduleId, UpdateSchedulePositionRequestDTO updateSchedulePositionRequestDTO, Long userId) {
        User user = validateUserExistence(userId);
        Plan plan = planRepository.findByIdForUpdate(planId);

        UserPlan userPlan = userPlanRepository.findByPlanAndUser(plan, user)
                .orElseThrow(() -> new NotInThisRoomException("당신은 이 방의 참여자가 아닙니다."));
        if (userPlan.getUserStatus() == UserStatus.PENDING) {
            throw new NotInThisRoomException("당신은 이 방의 참여자가 아닙니다.");
        }

        DaySchedule daySchedule = dayScheduleRepository.findByPlanIdAndDayScheduleId(planId, dayScheduleId);
        if(daySchedule == null) {
            throw new DayScheduleNotExistException("존재하지 않거나 해당 플랜에 속하지 않는 일정입니다.");
        }
        if (daySchedule.getDayOrder() != updateSchedulePositionRequestDTO.getDayOrder()) {
            throw new ConflictException("기존 위치가 잘못되었거나, 다른 사용자가 작업중입니다.");
        }

        List<DaySchedule> daySchedules = dayScheduleRepository.findByPlanId(planId);
        daySchedules.sort(Comparator.comparingInt(DaySchedule::getDayOrder));

        int oldIndex = updateSchedulePositionRequestDTO.getDayOrder();
        int newIndex = updateSchedulePositionRequestDTO.getModifiedDayOrder();

        if (oldIndex <= 0 || oldIndex > daySchedules.size()) {
            throw new InvalidIndexOrderException("잘못된 위치 입력값 입니다.");
        }
        if (newIndex <= 0 || newIndex > daySchedules.size()) {
            throw new InvalidIndexOrderException("잘못된 위치 입력값 입니다.");
        }

        if (newIndex < oldIndex) {
            for (DaySchedule ds : daySchedules) {
                int idx = ds.getDayOrder();
                if (idx >= newIndex && idx < oldIndex) {
                    ds.setDayOrder(idx + 1);
                }
            }
        } else if (newIndex > oldIndex) {
            for (DaySchedule ds : daySchedules) {
                int idx = ds.getDayOrder();
                if (idx > oldIndex && idx <= newIndex) {
                    ds.setDayOrder(idx - 1);
                }
            }
        }

        daySchedule.setDayOrder(updateSchedulePositionRequestDTO.getModifiedDayOrder());
        return true;
    }

    @Transactional
    public boolean removeDaySchedule(Long planId, Long dayScheduleId, Long userId) {
        User user = validateUserExistence(userId);
        Plan plan = planRepository.findByIdForUpdate(planId);

        UserPlan userPlan = userPlanRepository.findByPlanAndUser(plan, user)
                .orElseThrow(() -> new NotInThisRoomException("당신은 이 방의 참여자가 아닙니다."));
        if (userPlan.getUserStatus() == UserStatus.PENDING) {
            throw new NotInThisRoomException("당신은 이 방의 참여자가 아닙니다.");
        }

        DaySchedule daySchedule = dayScheduleRepository.findByIdForUpdate(dayScheduleId);
        if(daySchedule == null) {
            throw new DayScheduleNotExistException("존재하지 않는 일정입니다.");
        }
        if(daySchedule.getPlan().getPlanId() != planId)
        {
            throw new DayScheduleNotInThisPlanException("이 방의 일정이 아닙니다.");
        }

        List<DaySchedule> daySchedules = dayScheduleRepository.findByPlanId(planId);
        daySchedules.sort(Comparator.comparingInt(DaySchedule::getDayOrder));

        for (DaySchedule ds : daySchedules) {
            int idx = ds.getDayOrder();
            if (idx > daySchedule.getDayOrder()) {
                ds.setDayOrder(idx - 1);
            }
        }

        dayScheduleRepository.delete(daySchedule);
        return true;
    }

    private User validateUserExistence(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new UserNotExistException("존재하지 않는 사용자입니다. userId=" + userId));
    }

    private Plan validatePlanExistence(Long planId) {
        return planRepository.findById(planId)
                .orElseThrow(() -> new PlanNotExistException("존재하지 않는 계획입니다. planId=" + planId));
    }

    private DaySchedule validateDaySchedule(Long dayScheduleId) {
        return dayScheduleRepository.findById(dayScheduleId)
                .orElseThrow(() -> new DayScheduleNotExistException("존재하지 않는 일정입니다. dayScheduleId=" + dayScheduleId));
    }
}
