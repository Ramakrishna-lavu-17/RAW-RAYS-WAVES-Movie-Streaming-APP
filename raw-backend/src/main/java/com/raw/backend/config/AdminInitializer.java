package com.raw.backend.config;

import com.raw.backend.entity.Role;
import com.raw.backend.entity.User;
import com.raw.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AdminInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.findByRole(Role.ADMIN).isEmpty()) {
            User admin = new User();
            admin.setName("System Admin");
            admin.setEmail("admin@raw.com");
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setRole(Role.ADMIN);
            admin.setActive(true);
            userRepository.save(admin);
            System.out.println("=== INITIAL ADMIN ACCOUNT CREATED: admin@raw.com / admin123 ===");
        }
    }
}
