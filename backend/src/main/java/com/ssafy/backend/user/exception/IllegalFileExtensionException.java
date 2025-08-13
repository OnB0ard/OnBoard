package com.ssafy.backend.user.exception;

public class IllegalFileExtensionException extends RuntimeException {
    public IllegalFileExtensionException(String message) {
        super(message);
    }
}
