package com.ssafy.backend.plan.service;

import com.ssafy.backend.plan.dto.response.CreateDayScheduleResponseDTO;
import com.ssafy.backend.plan.entity.DaySchedule;
import com.ssafy.backend.plan.entity.Plan;
import com.ssafy.backend.plan.exception.NotInThisRoomException;
import com.ssafy.backend.plan.exception.PlanNotExistException;
import com.ssafy.backend.plan.exception.UserNotExistException;
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

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DayScheduleService {

    private final DayScheduleRepository dayScheduleRepository;
    private final UserRepository userRepository;
    private final PlanRepository planRepository;
    private final UserPlanRepository userPlanRepository;

    @Transactional
    public CreateDayScheduleResponseDTO createDaySchedule(Long planId, String title, Long userId) {
        User user = validateUserExistence(userId);
        Plan plan = validatePlanExistence(planId);

        UserPlan userPlan = userPlanRepository.findByPlanAndUser(plan, user)
                .orElseThrow(() -> new NotInThisRoomException("당신은 이 방의 참여자가 아닙니다."));
        if (userPlan.getUserStatus() == UserStatus.PENDING) {
            throw new NotInThisRoomException("당신은 이 방의 참여자가 아닙니다.");
        }

        Integer maxDayOrder = dayScheduleRepository.findMaxDayOrderByPlan(plan);

        DaySchedule daySchedule = DaySchedule.builder()
                .plan(plan)
                .dayOrder(maxDayOrder+1)
                .title(title)
                .build();

        dayScheduleRepository.save(daySchedule);

        return CreateDayScheduleResponseDTO.builder()
                .dayScheduleId(daySchedule.getDayScheduleId())
                .planId(plan.getPlanId())
                .dayOrder(daySchedule.getDayOrder())
                .title(daySchedule.getTitle())
                .build();
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
