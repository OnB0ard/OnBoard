package com.ssafy.backend.notification.entity;

public enum NotificationType {
    JOIN_REQUEST,   // 방장에게: 입장요청 옴
    JOIN_ACCEPT,    // 요청자에게: 승인됨
    JOIN_REJECT     // 요청자에게: 거절됨
}
