package com.raw.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActivationRequest {
    private String planName;
    private String quality;
    private String price;
    private String transactionId;
}
