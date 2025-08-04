package com.ssafy.backend.plan.controller;

import com.ssafy.backend.common.dto.response.CommonResponse;
import com.ssafy.backend.plan.dto.response.CreateDayScheduleResponseDTO;
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

    @PostMapping("")
    public CommonResponse<CreateDayScheduleResponseDTO> createDaySchedule(@PathVariable Long planId, @RequestParam("title") String title, @AuthenticationPrincipal JwtUserInfo jwtUserInfo) {
        return new CommonResponse<>(dayScheduleService.createDaySchedule(planId, title, jwtUserInfo.getUserId()), HttpStatus.OK);
    }
}
