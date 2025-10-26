package com.example.jwt_basics1.service;

import com.example.jwt_basics1.config.JwtUtil;
import com.example.jwt_basics1.dto.AuthenticationResponse;
import com.example.jwt_basics1.dto.RefreshTokenRequest;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {
    private final CustomUserDetailsService customUserDetailsService;
    private final JwtUtil jwtUtil;
    private final TokenBlacklistService tokenBlacklistService;

    private final Map<String,String> refreshTokenIps = new ConcurrentHashMap<>();

    public AuthenticationResponse refreshAccessToken(RefreshTokenRequest refreshTokenRequest) {

        String refreshToken = refreshTokenRequest.getRefreshToken();

        // get the id from refresh token for the new access token
        String jwtID = jwtUtil.extractJWTID(refreshToken);

        // check if the refresh token's id is blacklisted
        if (tokenBlacklistService.isTokenBlacklisted(jwtID)) {
            throw new RuntimeException("Token is blacklisted");
        }

        // load the user details from the refresh token
        String username = jwtUtil.extractUsername(refreshToken);
        UserDetails userDetails = customUserDetailsService.loadUserByUsername(username);

        String clientIP = refreshTokenRequest.getIp();
        String storedIP = refreshTokenIps.get(jwtID);
        if (!storedIP.equals(clientIP)) {
            throw new RuntimeException("Invalid IP address for this refresh token");
        }

        // check if the refresh token is valid
        if (!jwtUtil.validateToken(refreshToken, userDetails)) {
            throw new RuntimeException("Invalid or expired refresh token");
        }

        // create a new access token
        String newAccessToken = jwtUtil.generateToken(null, userDetails, jwtID);
        String newRefreshToken = jwtUtil.generateRefreshToken(userDetails, jwtID);

        // returns the new access token along with the refresh token
        return new AuthenticationResponse(newAccessToken, newRefreshToken);
    }

    public void storeRefreshTokenIp(String jwtId, String ip) { refreshTokenIps.put(jwtId, ip); }
}
