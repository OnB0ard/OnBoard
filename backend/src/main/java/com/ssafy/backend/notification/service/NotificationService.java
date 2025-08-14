package com.ssafy.backend.notification.service;

import com.ssafy.backend.common.util.S3Util;
import com.ssafy.backend.notification.dto.NotificationResponseDTO;
import com.ssafy.backend.notification.entity.Notification;
import com.ssafy.backend.notification.exception.NotificationAccessDeniedException;
import com.ssafy.backend.notification.exception.NotificationNotFoundException;
import com.ssafy.backend.notification.repository.NotificationRepository;
import com.ssafy.backend.plan.exception.UserNotExistException;
import com.ssafy.backend.user.entity.User;
import com.ssafy.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NotificationService {
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;
    private final S3Util s3Util;
    @Transactional
    public void create(Long receiverUserId, Long imageUserId, String message) {
        User receiver = userRepository.getReferenceById(receiverUserId);
        notificationRepository.save(Notification.builder()
                .user(receiver)
                .imageUserId(imageUserId)
                .message(message)
                .build());
    }

    public List<NotificationResponseDTO> retrieveMessage(Long userId) {
        User user = validateUserExistence(userId);
        List<Notification> notifications  = notificationRepository.findRecent50ByUserId(user.getUserId());
        return notifications.stream()
                .map(n -> {
                    User imageUser = validateUserExistence(n.getImageUserId());
                    return NotificationResponseDTO.builder()
                            .notificationId(n.getNotificationId())
                            .message(n.getMessage())
                            .userImgUrl(s3Util.getUrl(imageUser.getProfileImage())) // User의 프로필 이미지
                            .isRead(n.isRead()) // 알림 읽음 여부
                            .build();
                })
                .toList();
    }
    @Transactional
    public void updateRead(Long notificationId, Long userId) {
        Notification notification = validateNotificationExistence(notificationId);

        // 본인 알림인지 확인
        if (!notification.getUser().getUserId().equals(userId)) {
            throw new NotificationAccessDeniedException(
                    "notificationId=" + notificationId + ", userId=" + userId);
        }

        notification.setReadTrue();
    }

    private User validateUserExistence(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new UserNotExistException("존재하지 않는 사용자입니다. userId=" + userId));
    }
    private Notification validateNotificationExistence(Long notificationId) {
        return notificationRepository.findById(notificationId)
                .orElseThrow(()-> new NotificationNotFoundException("알림이 존재하지 않습니다. id=" + notificationId));
    }
}
