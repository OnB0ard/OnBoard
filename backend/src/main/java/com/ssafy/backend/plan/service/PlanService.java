package com.ssafy.backend.plan.service;

import com.ssafy.backend.common.util.S3Util;
import com.ssafy.backend.plan.dto.request.CreatePlanRequestDTO;
import com.ssafy.backend.plan.dto.request.UpdatePlanRequestDTO;
import com.ssafy.backend.plan.dto.response.CreatePlanResponseDTO;
import com.ssafy.backend.plan.dto.response.UpdatePlanResponseDTO;
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

    public UpdatePlanResponseDTO updatePlan(Long planId, UpdatePlanRequestDTO updatePlanReq, MultipartFile image) throws IOException{
        Plan plan = planRepository.findById(planId)
                .orElseThrow(() -> new IllegalArgumentException("해당 계획이 존재하지 않습니다."));
        String imageKey = plan.getPlanImage();
        if (updatePlanReq.isImageModified()) {
            // 기존 이미지가 있으면 삭제
            if (imageKey != null && !imageKey.isEmpty()) {
                s3Util.deleteObject(imageKey);
                imageKey = null; // 초기화
            }

            // 새 이미지가 들어온 경우 업로드
            if (image != null && !image.isEmpty()) {
                String newFileName = "plans/" + System.currentTimeMillis() + "_" + image.getOriginalFilename();
                boolean uploaded = s3Util.putObject(newFileName, image.getInputStream(), image.getContentType());

                if (!uploaded) {
                    throw new RuntimeException("S3 업로드 실패");
                }

                imageKey = newFileName;
            }

            plan.setPlanImage(imageKey); // 새 키 or null
        }

        plan.setPlanName(updatePlanReq.getName());
        plan.setPlanDescription(updatePlanReq.getDescription());
        plan.setStartDate(updatePlanReq.getStartDate());
        plan.setEndDate(updatePlanReq.getEndDate());
        plan.setHashTage(updatePlanReq.getHashTag());

        return UpdatePlanResponseDTO.builder()
                .planId(plan.getPlanId())
                .name(plan.getPlanName())
                .description(plan.getPlanDescription())
                .startDate(plan.getStartDate())
                .endDate(plan.getEndDate())
                .hashTag(plan.getHashTage())
                .imageUrl(imageKey != null ? s3Util.getUrl(imageKey) : null)
                .build();
    }
}
