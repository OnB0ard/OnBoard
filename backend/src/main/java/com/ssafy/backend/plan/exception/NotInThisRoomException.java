package com.ssafy.backend.plan.exception;

public class NotInThisRoomException extends RuntimeException {
    public NotInThisRoomException(String message) {
        super(message);
    }
}
