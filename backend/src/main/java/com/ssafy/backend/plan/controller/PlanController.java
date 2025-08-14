package com.ssafy.backend.plan.controller;

import com.ssafy.backend.common.dto.response.CommonResponse;
import com.ssafy.backend.common.dto.response.SuccessResponseDTO;
import com.ssafy.backend.plan.dto.request.CreatePlanRequestDTO;
import com.ssafy.backend.plan.dto.request.UpdatePlanRequestDTO;
import com.ssafy.backend.plan.dto.response.CreatePlanResponseDTO;
import com.ssafy.backend.plan.dto.response.RetrievePlanResponse;
import com.ssafy.backend.plan.dto.response.UpdatePlanResponseDTO;
import com.ssafy.backend.plan.service.PlanService;
import com.ssafy.backend.security.dto.JwtUserInfo;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@Controller
@RequiredArgsConstructor
@RequestMapping("/api/v1/plan")
public class PlanController {
    private final PlanService planService;
    @PreAuthorize("permitAll()")
    @PostMapping("/create")
    public CommonResponse<CreatePlanResponseDTO> createPlan(@AuthenticationPrincipal JwtUserInfo jwtUserInfo,@RequestPart CreatePlanRequestDTO createPlanRequestDTO, @RequestPart(value = "image",required = false) MultipartFile image) throws IOException {

        return new CommonResponse<>(planService.createPlan(jwtUserInfo.getUserId(),createPlanRequestDTO,image), HttpStatus.OK);
    }
    @PreAuthorize("permitAll()")
    @PutMapping("/{planId}")
    public CommonResponse<UpdatePlanResponseDTO> updatePlan(
            @AuthenticationPrincipal JwtUserInfo jwtUserInfo,
            @PathVariable Long planId,
            @RequestPart UpdatePlanRequestDTO updatePlanRequestDTO,
            @RequestPart(value = "image", required = false) MultipartFile image) throws IOException {

        return new CommonResponse<>(planService.updatePlan(jwtUserInfo.getUserId(), planId, updatePlanRequestDTO, image), HttpStatus.OK);
    }
    @PreAuthorize("permitAll()")
    @DeleteMapping("/{planId}")
    public CommonResponse<SuccessResponseDTO> deletePlan(@AuthenticationPrincipal JwtUserInfo jwtUserInfo, @PathVariable Long planId) {
        planService.deletePlan(jwtUserInfo.getUserId(),planId);
        return new CommonResponse<>(new SuccessResponseDTO(true),HttpStatus.OK);
    }
    @PreAuthorize("permitAll()")
    @GetMapping("/list")
    public CommonResponse<List<RetrievePlanResponse>> retrievePlanList(@AuthenticationPrincipal JwtUserInfo jwtUserInfo) {

        return new CommonResponse<>(planService.retrievePlanList(jwtUserInfo.getUserId()),HttpStatus.OK);
    }
    @PreAuthorize("permitAll()")
    @PostMapping("/{planId}/leave")
    public CommonResponse<SuccessResponseDTO> leavePlan(@PathVariable Long planId,@AuthenticationPrincipal JwtUserInfo jwtUserInfo) {
        planService.leavePlan(jwtUserInfo.getUserId(),planId);
        return new CommonResponse<>(new SuccessResponseDTO(true),HttpStatus.OK);
    }

}
