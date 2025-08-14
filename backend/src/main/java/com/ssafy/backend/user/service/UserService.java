package com.ssafy.backend.user.service;

import com.ssafy.backend.common.exception.S3UploadFailedException;
import com.ssafy.backend.common.util.S3Util;
import com.ssafy.backend.notification.repository.NotificationRepository;
import com.ssafy.backend.plan.entity.Plan;
import com.ssafy.backend.plan.exception.UserNotExistException;
import com.ssafy.backend.plan.repository.PlanRepository;
import com.ssafy.backend.plan.repository.UserPlanRepository;
import com.ssafy.backend.user.dto.request.ModifyProfileRequestDTO;
import com.ssafy.backend.user.dto.response.ModifyProfileResponseDTO;
import com.ssafy.backend.user.dto.response.RetrieveProfileResponseDTO;
import com.ssafy.backend.user.entity.User;
import com.ssafy.backend.user.entity.UserPlan;
import com.ssafy.backend.user.entity.UserType;
import com.ssafy.backend.user.repository.UserRepository;
import com.ssafy.backend.user.util.ImageValidatorUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService {
    private final UserRepository userRepository;
    private final UserPlanRepository userPlanRepository;
    private final NotificationRepository notificationRepository;
    private final S3Util s3Util;
    private final ImageValidatorUtil imageValidatorUtil;
    private final PlanRepository planRepository;

    @Transactional
    public ModifyProfileResponseDTO modifyProfile(Long userId, @RequestPart ModifyProfileRequestDTO modifyProfileRequestDTO, @RequestPart MultipartFile image) throws IOException {
        User user = validateUserExistence(userId);

        String imageKey = user.getProfileImage();
        if (modifyProfileRequestDTO.isImageModified()) {
            if (image != null && !image.isEmpty())
            {
                imageValidatorUtil.checkFileExtension(image);
            }

            // 기존 이미지가 있으면 삭제
            if (imageKey != null && !imageKey.isEmpty()) {
                s3Util.deleteObject(imageKey);
                imageKey = null; // 초기화
            }

            // 새 이미지가 들어온 경우 업로드
            if (image != null && !image.isEmpty()) {
                String newFileName = "users/" + System.currentTimeMillis() + "_" + image.getOriginalFilename();

                boolean uploaded = s3Util.putObject(newFileName, image.getInputStream(), image.getContentType());

                if (!uploaded) {
                    throw new S3UploadFailedException("S3 업로드 실패");
                }

                imageKey = newFileName;
            }
            user.setProfileImage(imageKey);
        }
        user.setUserName(modifyProfileRequestDTO.getName());

        return ModifyProfileResponseDTO.builder()
                .userName(user.getUserName())
                .profileImage(imageKey != null ? s3Util.getUrl(imageKey) : null)
                .build();
    }

    @Transactional
    public boolean deleteUser(Long userId) {
        // User 곧 삭제됩니다. user 관련 모든 행 들은 LOCK
        User user = userRepository.lockUser(userId)
                .orElseThrow(() -> new UserNotExistException("존재하지 않는 사용자입니다."));

        // 내가 Creator인 plan방 Id
        List<Long> planIds = userPlanRepository.findCreatorPlanIdsByUserId(userId);

        for (Long planId : planIds) {
            // plan Lock
            Plan plan = planRepository.lockPlan(planId);

            // USERPLAN 역시 LOCK
            Optional<UserPlan> candidate = userPlanRepository.findCandidate(planId);

            if (candidate.isEmpty()) {
                planRepository.deleteById(planId);
                continue;
            }

            candidate.get().setUserType(UserType.CREATOR);
        }

        notificationRepository.deleteByImageUserId(userId);

        String imageKey = user.getProfileImage();
        if (imageKey != null && !imageKey.isEmpty() && !imageKey.equals("placeholder.png")) {
            s3Util.deleteObject(imageKey);
        }

        userRepository.delete(user);
        return true;
    }

    private User validateUserExistence(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new UserNotExistException("존재하지 않는 사용자입니다. userId=" + userId));
    }

    public RetrieveProfileResponseDTO getUserProfile(Long userId) {
        User user = validateUserExistence(userId);
        return RetrieveProfileResponseDTO.builder()
                .userId(user.getUserId())
                .googleEmail(user.getGoogleEmail())
                .userName(user.getUserName())
                .profileImageUrl(user.getProfileImage() != null ? s3Util.getUrl(user.getProfileImage()) : null)
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}
