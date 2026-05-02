package com.cip.auth.service;

import com.cip.auth.dto.AuthDtos;
import com.cip.auth.entity.User;
import com.cip.auth.repository.UserRepository;
import com.cip.common.exception.CipException;
import com.cip.common.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final StringRedisTemplate redisTemplate;

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expiration:86400000}")
    private long jwtExpiration;

    public AuthDtos.AuthResponse signup(AuthDtos.SignupRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw CipException.badRequest("Email already registered");
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole() != null ? request.getRole() : User.Role.STUDENT)
                .build();

        user = userRepository.save(user);
        log.info("New user registered: {} with role {}", user.getEmail(), user.getRole());

        return buildAuthResponse(user);
    }

    public AuthDtos.AuthResponse login(AuthDtos.LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> CipException.unauthorized("Invalid email or password"));

        if (!user.isActive()) {
            throw CipException.unauthorized("Account is deactivated");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw CipException.unauthorized("Invalid email or password");
        }

        log.info("User logged in: {}", user.getEmail());
        return buildAuthResponse(user);
    }

    public AuthDtos.UserProfile getProfile(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> CipException.notFound("User"));

        return AuthDtos.UserProfile.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .active(user.isActive())
                .build();
    }

    public void logout(String token) {
        // Blacklist the token in Redis
        JwtUtil jwtUtil = new JwtUtil(jwtSecret, jwtExpiration);
        try {
            long remaining = jwtUtil.extractAllClaims(token).getExpiration().getTime()
                    - System.currentTimeMillis();
            if (remaining > 0) {
                redisTemplate.opsForValue().set("blacklist:" + token, "1",
                        remaining, TimeUnit.MILLISECONDS);
            }
        } catch (Exception e) {
            log.warn("Error blacklisting token: {}", e.getMessage());
        }
    }

    private AuthDtos.AuthResponse buildAuthResponse(User user) {
        JwtUtil jwtUtil = new JwtUtil(jwtSecret, jwtExpiration);
        String token = jwtUtil.generateToken(user.getEmail(), Map.of(
                "userId", user.getId(),
                "role", user.getRole().name(),
                "name", user.getName()
        ));

        return AuthDtos.AuthResponse.builder()
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .token(token)
                .expiresIn(jwtExpiration / 1000)
                .build();
    }
}
