package com.ssafy.backend.notification.entity;

import com.ssafy.backend.common.entity.DateEntity;
import com.ssafy.backend.user.entity.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Notification extends DateEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "notification_id")
    private Long notificationId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id") // 수신자
    private User user;

    private NotificationType type; // JOIN_REQUEST, JOIN_ACCEPT, JOIN_REJECT

    private String message; // 표시할 메시지

    @Column(name = "is_read")
    private boolean isRead = false; // 읽음 여부

    @Column(name = "plan_img_url", length = 1024)
    private String userImgUrl;

    public void setReadTrue() {
        this.isRead = true;
    }
}
