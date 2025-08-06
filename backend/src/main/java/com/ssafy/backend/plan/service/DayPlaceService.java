package com.ssafy.backend.plan.service;

import com.ssafy.backend.plan.entity.DayPlace;
import com.ssafy.backend.plan.entity.DaySchedule;
import com.ssafy.backend.plan.entity.Plan;
import com.ssafy.backend.plan.exception.DayPlaceNotExistException;
import com.ssafy.backend.plan.exception.DayScheduleNotExistException;
import com.ssafy.backend.plan.exception.PlanNotExistException;
import com.ssafy.backend.plan.exception.UserNotExistException;
import com.ssafy.backend.plan.repository.DayPlaceRepository;
import com.ssafy.backend.plan.repository.DayScheduleRepository;
import com.ssafy.backend.plan.repository.PlanRepository;
import com.ssafy.backend.user.entity.User;
import com.ssafy.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DayPlaceService {
    private final DayPlaceRepository dayPlaceRepository;
    private final UserRepository userRepository;

    @Transactional
    public boolean deleteDayPlace(Long planId, Long dayScheduleId, Long dayPlaceId, Long userId) {
        User user = validateUserExistence(userId);
        DayPlace dayPlace = dayPlaceRepository
                .findByPlanIdAndDayScheduleIdAndDayPlaceId(planId, dayScheduleId, dayPlaceId);

        if(dayPlace == null) {
            throw new DayPlaceNotExistException("해당 계획에 속하지 않은 여행지입니다.");
        }

        dayPlaceRepository.delete(dayPlace);
        return true;
    }

    private User validateUserExistence(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new UserNotExistException("존재하지 않는 사용자입니다. userId=" + userId));
    }
}
