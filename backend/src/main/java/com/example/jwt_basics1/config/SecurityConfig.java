package com.example.jwt_basics1.config;

import com.example.jwt_basics1.service.CustomLogoutHandler;
import com.example.jwt_basics1.service.CustomUserDetailsService;
import com.example.jwt_basics1.service.TokenBlacklistService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;

import java.util.List;


@Configuration
@EnableWebSecurity(debug = true) // enable debug mode to see the security filter chain in action
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtUtil jwtUtil;
    private final CustomUserDetailsService userDetailsService;
    private final TokenBlacklistService tokenBlacklistService;
    private final CustomLogoutHandler customLogoutHandler;

    @Bean
    public static PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        // we don't need csrf protection in jwt
        http
                .csrf(AbstractHttpConfigurer::disable)
                // add cors corsConfigurer
                .cors(cors -> {
                    // register cors configuration source, React app is running on localhost:5173
                    cors.configurationSource(request -> {
                        var corsConfig = new CorsConfiguration();
                        corsConfig.setAllowedOrigins(List.of("http://localhost:5173")); // vite dev server
                        corsConfig.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
                        corsConfig.setAllowedHeaders(List.of("*"));
                        return corsConfig;
                    });
                })


                // adding a custom JWT authentication filter
                .addFilterBefore(new JwtAuthenticationFilter(jwtUtil, userDetailsService, tokenBlacklistService),
                        UsernamePasswordAuthenticationFilter.class)

                // The SessionCreationPolicy.STATELESS setting means that the application will not create or use HTTP sessions.
                // This is a common configuration in RESTful APIs, especially when using token-based authentication like JWT (JSON Web Token).
                .sessionManagement(sess -> sess.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // הוספת מנגנון ה-Logout
                .logout(logout -> logout
                        .logoutUrl("/logout")
                        .logoutSuccessHandler(customLogoutHandler) // מחלקת לוגאוט מותאמת אישית
                        .invalidateHttpSession(true) // איבוד תקפות של הסשן
                        .clearAuthentication(true)
                        .permitAll())

                // Configuring authorization for HTTP requests
                .authorizeHttpRequests(auth -> auth
                        // Public endpoints
                        .antMatchers("/login", "/register").permitAll()
                
                        // User endpoints - accessible by authenticated users
                        .antMatchers(HttpMethod.GET, "/users/**").hasAnyRole("USER", "ADMIN")
                
                        // Admin-only endpoints
                        .antMatchers(HttpMethod.POST, "/users/**").hasRole("ADMIN")
                        .antMatchers(HttpMethod.PUT, "/users/**").hasRole("ADMIN")
                        .antMatchers(HttpMethod.DELETE, "/users/**").hasRole("ADMIN")

                        .requestMatchers("api/login/**").permitAll()
                        .requestMatchers("api/refresh-token/**").permitAll() // Refresh token path

                        .requestMatchers("api/protected-message-admin").hasAnyRole("ADMIN")
                        .requestMatchers("api/protected-message").hasAnyRole("USER", "ADMIN")

                        // All other requests must be authenticated
                        .anyRequest().authenticated());

        return http.build();
    }
}
