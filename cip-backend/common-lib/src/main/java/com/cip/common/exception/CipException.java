package com.cip.common.exception;

public class CipException extends RuntimeException {
    private final int statusCode;

    public CipException(String message, int statusCode) {
        super(message);
        this.statusCode = statusCode;
    }

    public int getStatusCode() {
        return statusCode;
    }

    public static CipException notFound(String resource) {
        return new CipException(resource + " not found", 404);
    }

    public static CipException unauthorized(String message) {
        return new CipException(message, 401);
    }

    public static CipException badRequest(String message) {
        return new CipException(message, 400);
    }

    public static CipException forbidden(String message) {
        return new CipException(message, 403);
    }
}
