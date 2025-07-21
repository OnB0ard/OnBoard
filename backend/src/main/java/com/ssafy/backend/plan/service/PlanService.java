package com.ssafy.backend.plan.service;

import com.ssafy.backend.common.util.S3Util;
import com.ssafy.backend.plan.dto.request.CreatePlanRequestDTO;
import com.ssafy.backend.plan.dto.response.CreatePlanResponseDTO;
import com.ssafy.backend.plan.entity.Plan;
import com.ssafy.backend.plan.repository.PlanRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@Service
@RequiredArgsConstructor
public class PlanService {
    private final S3Util s3Util;
    private final PlanRepository planRepository;

    public CreatePlanResponseDTO createPlan(CreatePlanRequestDTO createPlanRequestDTO, MultipartFile image) throws IOException {
        String imageKey = null;

        if (image != null && !image.isEmpty()) {

            String fileName = "plans/" + System.currentTimeMillis() + "_" + image.getOriginalFilename();
            boolean uploaded = s3Util.putObject(fileName, image.getInputStream(), image.getContentType());

            if (uploaded) {
                imageKey = fileName;
            } else {
                throw new RuntimeException("S3 업로드 실패");
            }
        }
        Plan plan = Plan.builder()
                .planName(createPlanRequestDTO.getName())
                .planDescription(createPlanRequestDTO.getDescription())
                .startDate(createPlanRequestDTO.getStartDate())
                .endDate(createPlanRequestDTO.getEndDate())
                .planImage(imageKey)
                .hashTage(createPlanRequestDTO.getHashTag())
                .build();

        planRepository.save(plan);

        return CreatePlanResponseDTO.builder()
                .planId(plan.getPlanId())
                .name(plan.getPlanName())
                .description(plan.getPlanDescription())
                .startDate(plan.getStartDate().toString())
                .endDate(plan.getEndDate().toString())
                .hashTag(plan.getHashTage())
                .imageUrl(imageKey != null ? s3Util.getUrl(imageKey) : null)
                .build();
    }
}
