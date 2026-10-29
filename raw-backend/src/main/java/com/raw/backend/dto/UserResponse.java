package com.raw.backend.dto;

import com.raw.backend.entity.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {

    private Long id;
    private String name;
    private String email;
    private Role role;
    private String subscriptionQuality;
    private String subscriptionStatus;
    private String subscriptionPlanName;
    private String subscriptionPrice;
    private LocalDateTime subscriptionStartDate;
    private LocalDateTime subscriptionExpiryDate;
    private String subscriptionTransactionId;
    private LocalDateTime createdAt;
}
