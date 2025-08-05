package com.ssafy.backend.plan.exception;

public class DayScheduleNotInThisPlanException extends RuntimeException {
    public DayScheduleNotInThisPlanException(String message) {
        super(message);
    }
}
