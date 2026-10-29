package com.raw.backend.controller;

import com.raw.backend.entity.SubscriptionPlan;
import com.raw.backend.service.SubscriptionPlanService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/subscriptions")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SubscriptionPlanController {

    private final SubscriptionPlanService subscriptionPlanService;

    @GetMapping
    public ResponseEntity<List<SubscriptionPlan>> getAllPlans() {
        return ResponseEntity.ok(subscriptionPlanService.getAllPlans());
    }

    @GetMapping("/{id}")
    public ResponseEntity<SubscriptionPlan> getPlanById(@PathVariable Long id) {
        return ResponseEntity.ok(subscriptionPlanService.getPlanById(id));
    }

    @PostMapping
    public ResponseEntity<SubscriptionPlan> createPlan(@RequestBody SubscriptionPlan plan) {
        SubscriptionPlan created = subscriptionPlanService.createPlan(plan);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<SubscriptionPlan> updatePlan(@PathVariable Long id, @RequestBody SubscriptionPlan plan) {
        return ResponseEntity.ok(subscriptionPlanService.updatePlan(id, plan));
    }

    @GetMapping("/current")
    public ResponseEntity<java.util.Map<String, Object>> getCurrentSubscription(
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.raw.backend.entity.User currentUser,
            @RequestHeader(value = "X-User-Quality", required = false) String headerQuality) {
        String quality = "720P";
        String status = "ACTIVE";
        String planName = "720P Plan";
        String price = "₹149/mo";
        String txnId = "DEMO-TXN-720000";
        java.time.LocalDateTime expiry = java.time.LocalDateTime.now().plusDays(30);

        if (currentUser != null) {
            if (currentUser.getSubscriptionQuality() != null && !currentUser.getSubscriptionQuality().isBlank()) {
                quality = currentUser.getSubscriptionQuality();
            }
            if (currentUser.getSubscriptionStatus() != null) {
                status = currentUser.getSubscriptionStatus();
            }
            if (currentUser.getSubscriptionPlanName() != null) {
                planName = currentUser.getSubscriptionPlanName();
            }
            if (currentUser.getSubscriptionPrice() != null) {
                price = currentUser.getSubscriptionPrice();
            }
            if (currentUser.getSubscriptionExpiryDate() != null) {
                expiry = currentUser.getSubscriptionExpiryDate();
            }
            if (currentUser.getSubscriptionTransactionId() != null) {
                txnId = currentUser.getSubscriptionTransactionId();
            }
        } else if (headerQuality != null && !headerQuality.isBlank()) {
            quality = headerQuality;
        }

        java.util.Map<String, Object> res = new java.util.HashMap<>();
        res.put("quality", quality);
        res.put("maximumQuality", quality);
        res.put("status", status);
        res.put("subscriptionStatus", status);
        res.put("planName", planName);
        res.put("price", price);
        res.put("transactionId", txnId);
        res.put("expiryDate", expiry.toString());
        res.put("active", "ACTIVE".equalsIgnoreCase(status));
        return ResponseEntity.ok(res);
    }

    @GetMapping("/my-subscription")
    public ResponseEntity<java.util.Map<String, Object>> getMySubscription(
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.raw.backend.entity.User currentUser,
            @RequestHeader(value = "X-User-Quality", required = false) String headerQuality) {
        return getCurrentSubscription(currentUser, headerQuality);
    }

    @PostMapping("/activate")
    public ResponseEntity<java.util.Map<String, Object>> activateSubscription(
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.raw.backend.entity.User currentUser,
            @RequestBody com.raw.backend.dto.ActivationRequest req) {
        java.util.Map<String, Object> result = subscriptionPlanService.activateSubscription(currentUser, req);
        return ResponseEntity.ok(result);
    }

    @PutMapping("/pricing")
    public ResponseEntity<java.util.Map<String, Object>> updatePricing(
            @RequestBody java.util.Map<String, String> pricing) {
        java.util.Map<String, Object> result = subscriptionPlanService.updatePricing(pricing);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/upgrade")
    public ResponseEntity<java.util.Map<String, Object>> upgradeSubscription(
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.raw.backend.entity.User currentUser,
            @RequestBody(required = false) com.raw.backend.dto.UpgradeRequest body) {
        String targetQuality = (body != null && body.getQuality() != null) ? body.getQuality() : "1080P";
        String planName = (body != null && body.getPlanName() != null) ? body.getPlanName() : targetQuality + " Plan";
        java.util.Map<String, Object> result = subscriptionPlanService.upgradeUserSubscription(currentUser, targetQuality, planName);
        return ResponseEntity.ok(result);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePlan(@PathVariable Long id) {
        subscriptionPlanService.deletePlan(id);
        return ResponseEntity.noContent().build();
    }
}
