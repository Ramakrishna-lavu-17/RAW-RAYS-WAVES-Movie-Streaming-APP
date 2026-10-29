package com.raw.backend.service;

import com.raw.backend.entity.SubscriptionPlan;
import com.raw.backend.entity.User;
import com.raw.backend.repository.SubscriptionPlanRepository;
import com.raw.backend.repository.UserRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SubscriptionPlanService {

    private final SubscriptionPlanRepository subscriptionPlanRepository;
    private final UserRepository userRepository;

    public static int parseQuality(String qualityStr) {
        if (qualityStr == null || qualityStr.isBlank()) return 720;
        String clean = qualityStr.replaceAll("[^0-9]", "");
        if (clean.isBlank()) return 720;
        try {
            return Integer.parseInt(clean);
        } catch (NumberFormatException e) {
            return 720;
        }
    }

    @Transactional
    public Map<String, Object> upgradeUserSubscription(User user, String targetQuality, String planName) {
        int targetRes = parseQuality(targetQuality);
        String cleanQuality = targetRes >= 1080 ? "1080P" : (targetRes >= 720 ? "720P" : "480P");

        if (user != null) {
            user.setSubscriptionQuality(cleanQuality);
            userRepository.save(user);
        }

        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("status", "ACTIVE");
        res.put("subscriptionQuality", cleanQuality);
        res.put("planName", planName != null ? planName : cleanQuality + " Plan");
        res.put("message", "Successfully upgraded to " + cleanQuality + " subscription tier!");
        return res;
    }

    @Transactional
    public Map<String, Object> activateSubscription(User user, com.raw.backend.dto.ActivationRequest req) {
        String reqQuality = req != null && req.getQuality() != null ? req.getQuality() : "720P";
        int res = parseQuality(reqQuality);
        String cleanQuality = res >= 1080 ? "1080P" : (res >= 720 ? "720P" : "480P");
        String planName = req != null && req.getPlanName() != null ? req.getPlanName() : cleanQuality + " Plan";
        String price = req != null && req.getPrice() != null ? req.getPrice() : "₹149/mo";
        String txnId = req != null && req.getTransactionId() != null && !req.getTransactionId().isBlank()
                ? req.getTransactionId()
                : "DEMO-TXN-" + (100000 + new java.util.Random().nextInt(900000));

        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        java.time.LocalDateTime expiry = now.plusDays(30);

        if (user != null) {
            user.setSubscriptionQuality(cleanQuality);
            user.setSubscriptionPlanName(planName);
            user.setSubscriptionPrice(price);
            user.setSubscriptionStatus("ACTIVE");
            user.setSubscriptionStartDate(now);
            user.setSubscriptionExpiryDate(expiry);
            user.setSubscriptionTransactionId(txnId);
            userRepository.save(user);
        }

        Map<String, Object> resMap = new HashMap<>();
        resMap.put("success", true);
        resMap.put("userId", user != null ? user.getId() : 1L);
        resMap.put("plan", planName);
        resMap.put("price", price);
        resMap.put("maximumQuality", cleanQuality);
        resMap.put("startDate", now.toString());
        resMap.put("expiryDate", expiry.toString());
        resMap.put("subscriptionStatus", "ACTIVE");
        resMap.put("transactionId", txnId);
        resMap.put("message", "Subscription activated successfully for " + cleanQuality + "!");
        return resMap;
    }

    @Transactional
    public Map<String, Object> updatePricing(Map<String, String> pricing) {
        List<SubscriptionPlan> allPlans = subscriptionPlanRepository.findAll();
        for (SubscriptionPlan plan : allPlans) {
            int q = parseQuality(plan.getMaxQuality());
            String key = q >= 1080 ? "1080P" : (q >= 720 ? "720P" : "480P");
            if (pricing.containsKey(key)) {
                String newPrice = pricing.get(key);
                if (newPrice != null && !newPrice.isBlank()) {
                    plan.setPrice(newPrice.startsWith("₹") ? newPrice : "₹" + newPrice);
                    subscriptionPlanRepository.save(plan);
                }
            }
        }
        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("message", "Subscription plan prices updated successfully!");
        res.put("plans", getAllPlans());
        return res;
    }

    @PostConstruct
    public void initPlans() {
        if (subscriptionPlanRepository.count() == 0) {
            SubscriptionPlan p480 = new SubscriptionPlan();
            p480.setName("480P Plan");
            p480.setPrice("₹99");
            p480.setMaxQuality("480P");
            p480.setScreens(1);
            p480.setDescription("Standard mobile SD streaming with basic features.");
            p480.setActive(true);
            p480.setIsDefault(false);
            p480.setBadge("SD QUALITY");
            subscriptionPlanRepository.save(p480);

            SubscriptionPlan p720 = new SubscriptionPlan();
            p720.setName("720P Plan");
            p720.setPrice("₹149");
            p720.setMaxQuality("720P");
            p720.setScreens(2);
            p720.setDescription("HD 720P high clarity streaming on up to 2 devices.");
            p720.setActive(true);
            p720.setIsDefault(true);
            p720.setBadge("POPULAR");
            subscriptionPlanRepository.save(p720);

            SubscriptionPlan p1080 = new SubscriptionPlan();
            p1080.setName("1080P Plan");
            p1080.setPrice("₹199");
            p1080.setMaxQuality("1080P");
            p1080.setScreens(4);
            p1080.setDescription("Full HD 1080P Cinema playback with Enhanced Bitrate & Dolby Audio.");
            p1080.setActive(true);
            p1080.setIsDefault(false);
            p1080.setBadge("FULL HD CINEMA");
            subscriptionPlanRepository.save(p1080);
        } else {
            // Ensure quality strings are cleanly formatted as 480P, 720P, 1080P
            List<SubscriptionPlan> existing = subscriptionPlanRepository.findAll();
            for (SubscriptionPlan plan : existing) {
                int q = parseQuality(plan.getMaxQuality());
                if (q >= 1080) {
                    plan.setMaxQuality("1080P");
                    if (plan.getName().contains("RAW Pro") || plan.getName().contains("4K Ultra")) {
                        plan.setName("1080P Plan");
                    }
                } else if (q >= 720) {
                    plan.setMaxQuality("720P");
                    if (plan.getName().contains("Standard")) {
                        plan.setName("720P Plan");
                    }
                } else {
                    plan.setMaxQuality("480P");
                    if (plan.getName().contains("Free")) {
                        plan.setName("480P Plan");
                        if ("Free".equalsIgnoreCase(plan.getPrice())) plan.setPrice("₹99");
                    }
                }
                subscriptionPlanRepository.save(plan);
            }
        }
    }

    public List<SubscriptionPlan> getAllPlans() {
        return subscriptionPlanRepository.findByActiveTrueOrderByIdAsc();
    }

    public SubscriptionPlan getPlanById(Long id) {
        return subscriptionPlanRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Plan not found with id: " + id));
    }

    @Transactional
    public SubscriptionPlan createPlan(SubscriptionPlan plan) {
        plan.setId(null);
        if (plan.getActive() == null) plan.setActive(true);
        if (plan.getIsDefault() == null) plan.setIsDefault(false);
        return subscriptionPlanRepository.save(plan);
    }

    @Transactional
    public SubscriptionPlan updatePlan(Long id, SubscriptionPlan updated) {
        SubscriptionPlan plan = getPlanById(id);
        if (updated.getName() != null) plan.setName(updated.getName());
        if (updated.getPrice() != null) plan.setPrice(updated.getPrice());
        if (updated.getMaxQuality() != null) plan.setMaxQuality(updated.getMaxQuality());
        if (updated.getScreens() != null) plan.setScreens(updated.getScreens());
        if (updated.getDescription() != null) plan.setDescription(updated.getDescription());
        if (updated.getBadge() != null) plan.setBadge(updated.getBadge());
        if (updated.getActive() != null) plan.setActive(updated.getActive());
        if (updated.getIsDefault() != null) plan.setIsDefault(updated.getIsDefault());
        return subscriptionPlanRepository.save(plan);
    }

    @Transactional
    public void deletePlan(Long id) {
        SubscriptionPlan plan = getPlanById(id);
        subscriptionPlanRepository.delete(plan);
    }
}
