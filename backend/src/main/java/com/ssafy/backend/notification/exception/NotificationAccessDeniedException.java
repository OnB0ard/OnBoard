// com/ssafy/backend/notification/exception/NotificationAccessDeniedException.java
package com.ssafy.backend.notification.exception;

public class NotificationAccessDeniedException extends RuntimeException {
    public NotificationAccessDeniedException(String message) {
        super(message);
    }
}
