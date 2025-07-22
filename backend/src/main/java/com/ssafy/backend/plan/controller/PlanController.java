package com.ssafy.backend.plan.controller;

import com.ssafy.backend.common.dto.response.CommonResponse;
import com.ssafy.backend.common.dto.response.SuccessResponseDTO;
import com.ssafy.backend.plan.dto.request.CreatePlanRequestDTO;
import com.ssafy.backend.plan.dto.request.UpdatePlanRequestDTO;
import com.ssafy.backend.plan.dto.response.CreatePlanResponseDTO;
import com.ssafy.backend.plan.dto.response.UpdatePlanResponseDTO;
import com.ssafy.backend.plan.service.PlanService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@Controller
@RequiredArgsConstructor
@RequestMapping("/api/v1/plan")
public class PlanController {
    private final PlanService planService;
    @PostMapping("/create")
    public CommonResponse<CreatePlanResponseDTO> createPlan(@RequestPart CreatePlanRequestDTO createPlanRequestDTO, @RequestPart(value = "image",required = false) MultipartFile image) throws IOException {

        return new CommonResponse<>(planService.createPlan(createPlanRequestDTO,image), HttpStatus.OK);
    }

    @PutMapping("/{planId}")
    public CommonResponse<UpdatePlanResponseDTO> updatePlan(
            @PathVariable Long planId,
            @RequestPart UpdatePlanRequestDTO updatePlanRequestDTO,
            @RequestPart(value = "image", required = false) MultipartFile image) throws IOException {

        return new CommonResponse<>(planService.updatePlan(planId, updatePlanRequestDTO, image), HttpStatus.OK);
    }
    @DeleteMapping("/{planId}")
    public CommonResponse<SuccessResponseDTO> deletePlan(@PathVariable Long planId) {
        planService.deletePlan(planId);
        return new CommonResponse<>(new SuccessResponseDTO(true),HttpStatus.OK);
    }
}
