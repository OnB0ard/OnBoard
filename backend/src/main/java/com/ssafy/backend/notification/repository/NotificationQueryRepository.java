package com.ssafy.backend.notification.repository;

import com.ssafy.backend.notification.entity.Notification;

import java.util.List;

public interface NotificationQueryRepository {
    List<Notification> findRecent50ByUserId(Long userId);
}
