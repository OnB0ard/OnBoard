package com.ssafy.backend.plan.controller;

import com.ssafy.backend.common.dto.response.CommonResponse;
import com.ssafy.backend.plan.dto.response.DayScheduleResponseDTO;
import com.ssafy.backend.plan.dto.response.PlanScheduleResponseDTO;
import com.ssafy.backend.plan.service.DayScheduleService;
import com.ssafy.backend.security.dto.JwtUserInfo;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/plan/{planId}/schedule")
public class DayScheduleController {

    private final DayScheduleService dayScheduleService;

    @GetMapping("")
    public CommonResponse<PlanScheduleResponseDTO> getPlanSchedule(@PathVariable Long planId, @AuthenticationPrincipal JwtUserInfo jwtUserInfo) {
        return new CommonResponse<>(dayScheduleService.getPlanSchedule(planId, jwtUserInfo.getUserId()), HttpStatus.OK);
    }

    @GetMapping("/{dayScheduleId}")
    public CommonResponse<DayScheduleResponseDTO> getDaySchedule(@PathVariable Long planId, @PathVariable Long dayScheduleId, @AuthenticationPrincipal JwtUserInfo jwtUserInfo) {
        return new CommonResponse<>(dayScheduleService.getDaySchedule(planId, dayScheduleId, jwtUserInfo.getUserId()), HttpStatus.OK);
    }
}
