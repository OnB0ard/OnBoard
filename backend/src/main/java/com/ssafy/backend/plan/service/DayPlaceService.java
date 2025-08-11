package com.ssafy.backend.plan.service;

import com.ssafy.backend.plan.dto.request.CreateDayPlaceRequestDTO;
import com.ssafy.backend.plan.dto.request.RenameMemoRequestDTO;
import com.ssafy.backend.plan.dto.request.UpdateInnerPositionRequestDTO;
import com.ssafy.backend.plan.dto.request.UpdateOuterPositionRequestDTO;
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
import com.ssafy.backend.whiteBoard.entity.ObjectType;
import com.ssafy.backend.whiteBoard.entity.WhiteBoardObject;
import com.ssafy.backend.whiteBoard.exception.WhiteBoardObjectIsNotPlaceException;
import com.ssafy.backend.whiteBoard.repository.WhiteBoardRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DayPlaceService {
    private final DayPlaceRepository dayPlaceRepository;
    private final UserRepository userRepository;
    private final UserPlanRepository userPlanRepository;
    private final PlanRepository planRepository;
    private final WhiteBoardRepository whiteBoardRepository;
    private final DayScheduleRepository dayScheduleRepository;

    @Transactional
    public Long createDayPlace(Long planId, Long dayScheduleId, CreateDayPlaceRequestDTO createDayPlaceRequestDTO, Long userId) {
        User user = validateUserExistence(userId);
        Plan plan = validatePlanExistence(planId);

        UserPlan userPlan = userPlanRepository.findByPlanAndUser(plan, user)
                .orElseThrow(() -> new NotInThisRoomException("당신은 이 방의 참여자가 아닙니다."));
        if (userPlan.getUserStatus() == UserStatus.PENDING) {
            throw new NotInThisRoomException("당신은 이 방의 참여자가 아닙니다.");
        }

        DaySchedule daySchedule = dayScheduleRepository.findByIdForUpdate(dayScheduleId);
        if (!daySchedule.getPlan().getPlanId().equals(planId)) {
            throw new DayScheduleNotExistException("존재하지 않거나 해당 플랜에 속하지 않는 일정입니다.");
        }

        WhiteBoardObject whiteBoardObject = whiteBoardRepository.findByWhiteBoardObjectId(createDayPlaceRequestDTO.getWhiteBoardObjectId());
        if(whiteBoardObject == null || !whiteBoardObject.getObjectType().equals(ObjectType.PLACE))
        {
            throw new WhiteBoardObjectIsNotPlaceException("여행지 이외의 것은 넣을 수 없습니다.");
        }

        List<DayPlace> dayPlaces = dayPlaceRepository.getDayScheduleByDayScheduleIdAndPlanId(dayScheduleId, planId);
        dayPlaces.sort(Comparator.comparingInt(DayPlace::getIndexOrder));

        int insertIndex = createDayPlaceRequestDTO.getIndexOrder();

        if (insertIndex <= 0 || insertIndex > dayPlaces.size()) {
            throw new InvalidIndexOrderException("잘못된 위치 입력값 입니다.");
        }

        for (DayPlace dp : dayPlaces) {
            int idx = dp.getIndexOrder();
            if (idx >= insertIndex) {
                dp.setIndexOrder(idx + 1);
            }
        }

        DayPlace dayPlace = DayPlace.builder()
                .daySchedule(daySchedule)
                .whiteBoardObject(whiteBoardObject)
                .indexOrder(insertIndex)
                .build();

        dayPlaceRepository.save(dayPlace);

        return dayPlace.getDayPlaceId();
    }

    @Transactional
    public boolean renameMemo(Long planId, Long dayScheduleId, Long dayPlaceId, RenameMemoRequestDTO renameMemoRequestDTO, Long userId) {
        User user = validateUserExistence(userId);
        Plan plan = validatePlanExistence(planId);

        UserPlan userPlan = userPlanRepository.findByPlanAndUser(plan, user)
                .orElseThrow(() -> new NotInThisRoomException("당신은 이 방의 참여자가 아닙니다."));
        if (userPlan.getUserStatus() == UserStatus.PENDING) {
            throw new NotInThisRoomException("당신은 이 방의 참여자가 아닙니다.");
        }

        DayPlace dayPlace = dayPlaceRepository
                .findByPlanIdAndDayScheduleIdAndDayPlaceId(planId, dayScheduleId, dayPlaceId);
        if(dayPlace == null) {
            throw new DayPlaceNotExistException("해당 계획에 속하지 않은 여행지입니다.");
        }

        dayPlace.setMemo(renameMemoRequestDTO.getMemo());
        return true;
    }

    @Transactional
    public boolean updateInnerPosition(Long planId, Long dayScheduleId, UpdateInnerPositionRequestDTO updateInnerPositionRequestDTO, Long userId) {
        User user = validateUserExistence(userId);
        Plan plan = validatePlanExistence(planId);

        UserPlan userPlan = userPlanRepository.findByPlanAndUser(plan, user)
                .orElseThrow(() -> new NotInThisRoomException("당신은 이 방의 참여자가 아닙니다."));
        if (userPlan.getUserStatus() == UserStatus.PENDING) {
            throw new NotInThisRoomException("당신은 이 방의 참여자가 아닙니다.");
        }

        DaySchedule daySchedule = dayScheduleRepository.findByIdForUpdate(dayScheduleId);

        DayPlace dayPlace = dayPlaceRepository
                .findByPlanIdAndDayScheduleIdAndDayPlaceId(planId, dayScheduleId, updateInnerPositionRequestDTO.getDayPlaceId());
        if(dayPlace == null) {
            throw new DayPlaceNotExistException("해당 계획에 속하지 않은 여행지입니다.");
        }
        if (dayPlace.getIndexOrder() != updateInnerPositionRequestDTO.getIndexOrder()) {
            throw new ConflictException("기존 위치가 잘못되었거나, 다른 사용자가 작업중입니다.");
        }

        List<DayPlace> dayPlaces = dayPlaceRepository.getDayScheduleByDayScheduleIdAndPlanId(dayScheduleId, planId);

        dayPlaces.sort(Comparator.comparingInt(DayPlace::getIndexOrder));

        int oldIndex = updateInnerPositionRequestDTO.getIndexOrder();
        int newIndex = updateInnerPositionRequestDTO.getModifiedIndexOrder();

        if (oldIndex <= 0 || oldIndex > dayPlaces.size()) {
            throw new InvalidIndexOrderException("잘못된 위치 입력값 입니다.");
        }
        if (newIndex <= 0 || newIndex > dayPlaces.size()) {
            throw new InvalidIndexOrderException("잘못된 위치 입력값 입니다.");
        }

        if (newIndex < oldIndex) {
            for (DayPlace dp : dayPlaces) {
                int idx = dp.getIndexOrder();
                if (idx >= newIndex && idx < oldIndex) {
                    dp.setIndexOrder(idx + 1);
                }
            }
        } else if (newIndex > oldIndex) {
            for (DayPlace dp : dayPlaces) {
                int idx = dp.getIndexOrder();
                if (idx > oldIndex && idx <= newIndex) {
                    dp.setIndexOrder(idx - 1);
                }
            }
        }

        dayPlace.setIndexOrder(updateInnerPositionRequestDTO.getModifiedIndexOrder());
        return true;
    }

    @Transactional
    public boolean updateOuterPosition(Long planId, Long dayScheduleId, UpdateOuterPositionRequestDTO updateOuterPositionRequestDTO, Long userId) {
        User user = validateUserExistence(userId);
        Plan plan = validatePlanExistence(planId);

        UserPlan userPlan = userPlanRepository.findByPlanAndUser(plan, user)
                .orElseThrow(() -> new NotInThisRoomException("당신은 이 방의 참여자가 아닙니다."));
        if (userPlan.getUserStatus() == UserStatus.PENDING) {
            throw new NotInThisRoomException("당신은 이 방의 참여자가 아닙니다.");
        }

        DaySchedule daySchedule = dayScheduleRepository.findByIdForUpdate(dayScheduleId);
        DaySchedule modifiedDaySchedule = dayScheduleRepository.findByIdForUpdate(updateOuterPositionRequestDTO.getModifiedDayScheduleId());

        DayPlace dayPlace = dayPlaceRepository
                .findByPlanIdAndDayScheduleIdAndDayPlaceId(planId, dayScheduleId, updateOuterPositionRequestDTO.getDayPlaceId());
        if(dayPlace == null) {
            throw new DayPlaceNotExistException("해당 계획에 속하지 않은 여행지입니다.");
        }
        if (dayPlace.getIndexOrder() != updateOuterPositionRequestDTO.getIndexOrder()) {
            throw new ConflictException("기존 위치가 잘못되었거나, 다른 사용자가 작업중입니다.");
        }

        List<DayPlace> fromDayPlaces = dayPlaceRepository.getDayScheduleByDayScheduleIdAndPlanId(dayScheduleId, planId);
        fromDayPlaces.sort(Comparator.comparingInt(DayPlace::getIndexOrder));

        if (updateOuterPositionRequestDTO.getIndexOrder() <= 0 || updateOuterPositionRequestDTO.getIndexOrder() > fromDayPlaces.size()) {
            throw new InvalidIndexOrderException("잘못된 위치 입력값 입니다.");
        }

        for (DayPlace dp : fromDayPlaces) {
            if (dp.getIndexOrder() > dayPlace.getIndexOrder()) {
                dp.setIndexOrder(dp.getIndexOrder() - 1);
            }
        }

        List<DayPlace> toDayPlaces = dayPlaceRepository.getDayScheduleByDayScheduleIdAndPlanId(updateOuterPositionRequestDTO.getModifiedDayScheduleId(), planId);
        toDayPlaces.sort(Comparator.comparingInt(DayPlace::getIndexOrder));

        if (updateOuterPositionRequestDTO.getModifiedIndexOrder() <= 0 || updateOuterPositionRequestDTO.getModifiedIndexOrder() > toDayPlaces.size() + 1) {
            throw new InvalidIndexOrderException("잘못된 위치 입력값 입니다.");
        }

        for (DayPlace dp : toDayPlaces) {
            if (dp.getIndexOrder() >= updateOuterPositionRequestDTO.getModifiedIndexOrder()) {
                dp.setIndexOrder(dp.getIndexOrder() + 1);
            }
        }

        dayPlace.setDaySchedule(modifiedDaySchedule);
        dayPlace.setIndexOrder(updateOuterPositionRequestDTO.getModifiedIndexOrder());

        return true;
    }

    @Transactional
    public void deleteDayPlace(Long planId, Long dayScheduleId, Long dayPlaceId, Long userId) {
        User user = validateUserExistence(userId);
        Plan plan = validatePlanExistence(planId);

        UserPlan userPlan = userPlanRepository.findByPlanAndUser(plan, user)
                .orElseThrow(() -> new NotInThisRoomException("당신은 이 방의 참여자가 아닙니다."));
        if (userPlan.getUserStatus() == UserStatus.PENDING) {
            throw new NotInThisRoomException("당신은 이 방의 참여자가 아닙니다.");
        }

        DaySchedule daySchedule = dayScheduleRepository.findByIdForUpdate(dayScheduleId);

        DayPlace dayPlace = dayPlaceRepository
                .findByPlanIdAndDayScheduleIdAndDayPlaceId(planId, dayScheduleId, dayPlaceId);
        if(dayPlace == null) {
            throw new DayPlaceNotExistException("해당 계획에 속하지 않은 여행지입니다.");
        }

        List<DayPlace> dayPlaces = dayPlaceRepository.getDayScheduleByDayScheduleIdAndPlanId(dayScheduleId, planId);
        dayPlaces.sort(Comparator.comparingInt(DayPlace::getIndexOrder));

        for (DayPlace dp : dayPlaces) {
            int idx = dp.getIndexOrder();
            if (idx > dayPlace.getIndexOrder()) {
                dp.setIndexOrder(idx - 1);
            }
        }

        dayPlaceRepository.delete(dayPlace);
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
