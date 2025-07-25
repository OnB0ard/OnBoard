package com.ssafy.backend.user.service;

import com.ssafy.backend.common.exception.S3UploadFailedException;
import com.ssafy.backend.common.util.S3Util;
import com.ssafy.backend.plan.exception.UserNotExistException;
import com.ssafy.backend.security.dto.JwtUserInfo;
import com.ssafy.backend.user.dto.request.ModifyProfileRequestDTO;
import com.ssafy.backend.user.dto.response.ModifyProfileResponseDTO;
import com.ssafy.backend.user.entity.User;
import com.ssafy.backend.user.exception.NotYourAccountException;
import com.ssafy.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService {
    private final UserRepository userRepository;
    private final S3Util s3Util;
    @Transactional
    public ModifyProfileResponseDTO modifyProfile(Long userId, @RequestPart ModifyProfileRequestDTO modifyProfileRequestDTO, @RequestPart MultipartFile image) throws IOException {
        User user = validateUserExistence(userId);

        String imageKey = user.getProfileImage();
        if (modifyProfileRequestDTO.isImageModified()) {
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
                .profileImage(user.getProfileImage())
                .build();
    }

    @Transactional
    public boolean deleteUser(JwtUserInfo jwtUserInfo, Long userId) {
        if(jwtUserInfo.getUserId() != userId){
            throw new NotYourAccountException("본인 계정이 아닙니다.");
        }
        User user = validateUserExistence(userId);

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
}
