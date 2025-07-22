package com.ssafy.backend.plan.controller;

import com.ssafy.backend.common.dto.response.CommonResponse;
import com.ssafy.backend.common.dto.response.SuccessResponseDTO;
import com.ssafy.backend.plan.service.PlanParticipantService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/plan")
public class PlanParticipantController {

    private final PlanParticipantService planParticipantService;

    @PostMapping("{planId}/join")
    public CommonResponse<SuccessResponseDTO> joinRequest(@PathVariable("planId") Long planId, @RequestBody Long userId) {
        return new CommonResponse<>(new SuccessResponseDTO(planParticipantService.joinRequest(planId, userId)), HttpStatus.OK);
    }
}
