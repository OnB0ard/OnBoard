package com.ssafy.backend.plan.controller;

import com.ssafy.backend.common.dto.response.CommonResponse;
import com.ssafy.backend.common.dto.response.SuccessResponseDTO;
import com.ssafy.backend.plan.service.DayPlaceService;
import com.ssafy.backend.security.dto.JwtUserInfo;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/plan/{planId}/schedule")
public class DayPlaceController {

    private final DayPlaceService dayPlaceService;

    @PreAuthorize("permitAll()")
    @DeleteMapping("/{dayScheduleId}/{dayPlaceId}")
    public CommonResponse<SuccessResponseDTO> deleteDayPlace(@PathVariable Long planId, @PathVariable Long dayScheduleId, @PathVariable Long dayPlaceId, @AuthenticationPrincipal JwtUserInfo jwtUserInfo) {
        return new CommonResponse<>(new SuccessResponseDTO(dayPlaceService.deleteDayPlace(planId, dayScheduleId, dayPlaceId, jwtUserInfo.getUserId())), HttpStatus.OK);
    }


}
