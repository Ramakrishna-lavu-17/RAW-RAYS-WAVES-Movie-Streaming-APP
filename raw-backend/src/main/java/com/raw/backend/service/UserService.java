package com.raw.backend.service;

import com.raw.backend.dto.*;
import com.raw.backend.entity.Role;
import com.raw.backend.entity.User;
import com.raw.backend.repository.UserRepository;
import com.raw.backend.security.JwtUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email is already registered!");
        }

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(Role.USER);
        user.setActive(true);

        User savedUser = userRepository.save(user);
        String token = jwtUtils.generateToken(savedUser.getEmail());

        return AuthResponse.builder()
                .token(token)
                .user(mapToResponse(savedUser))
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password!"));

        if (!Boolean.TRUE.equals(user.getActive())) {
            throw new IllegalArgumentException("Account is deactivated. Please contact support.");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Invalid email or password!");
        }

        String token = jwtUtils.generateToken(user.getEmail());

        return AuthResponse.builder()
                .token(token)
                .user(mapToResponse(user))
                .build();
    }

    @Transactional
    public UserResponse createAdmin(CreateAdminRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email is already registered!");
        }

        User admin = new User();
        admin.setName(request.getName());
        admin.setEmail(request.getEmail());
        admin.setPassword(passwordEncoder.encode(request.getPassword()));
        admin.setRole(Role.ADMIN);
        admin.setActive(true);

        User savedAdmin = userRepository.save(admin);
        return mapToResponse(savedAdmin);
    }

    @Transactional
    public UserResponse updateUserStatus(Long userId, Boolean active) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + userId));
        user.setActive(active);
        return mapToResponse(userRepository.save(user));
    }

    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public UserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + id));
        return mapToResponse(user);
    }

    @Transactional
    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + id));
        userRepository.delete(user);
    }

    public UserResponse mapToResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .subscriptionQuality(user.getSubscriptionQuality())
                .subscriptionStatus(user.getSubscriptionStatus() != null ? user.getSubscriptionStatus() : "ACTIVE")
                .subscriptionPlanName(user.getSubscriptionPlanName() != null ? user.getSubscriptionPlanName() : (user.getSubscriptionQuality() != null ? user.getSubscriptionQuality() + " Plan" : "None"))
                .subscriptionPrice(user.getSubscriptionPrice())
                .subscriptionStartDate(user.getSubscriptionStartDate())
                .subscriptionExpiryDate(user.getSubscriptionExpiryDate())
                .subscriptionTransactionId(user.getSubscriptionTransactionId())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
