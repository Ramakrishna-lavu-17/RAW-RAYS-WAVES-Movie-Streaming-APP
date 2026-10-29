package com.raw.backend.entity;

public enum MovieProcessingStatus {
    UPLOADING,
    PROCESSING,
    TRANSCODING,
    GENERATING_HLS,
    UPLOADING_TO_STORAGE,
    READY,
    PROCESSING_FAILED
}
