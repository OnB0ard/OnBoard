package com.ssafy.backend.plan.exception;

public class DayScheduleNotExistException extends RuntimeException {
    public DayScheduleNotExistException(String message) {
        super(message);
    }
}
