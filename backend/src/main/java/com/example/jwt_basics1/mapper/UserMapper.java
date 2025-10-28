package com.example.jwt_basics1.mapper;

import com.example.jwt_basics1.dto.UserDto;
import com.example.jwt_basics1.entity.Role;
import com.example.jwt_basics1.entity.User;
import com.example.jwt_basics1.service.RoleService;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.stream.Collectors;

@Component
@AllArgsConstructor
public class UserMapper {

    private final RoleService roleService;

    public User toEntity(UserDto dto) {
        if (dto == null) return null;

        return User.builder()
                .id(dto.getId())
                .username(dto.getUsername())
                .password(dto.getPassword())
                .roles(dto.getRoles().stream()
                        .map(roleName -> roleService.findByRoleName(roleName)
                                .orElseThrow(() -> new RuntimeException("Role not found: " + roleName)))
                        .collect(Collectors.toList()))
                .build();
    }

    public UserDto toDto(User entity) {
        if (entity == null) return null;

        return UserDto.builder()
                .id(entity.getId())
                .username(entity.getUsername())
                .password(entity.getPassword())
                .roles(entity.getRoles().stream()
                        .map(Role::getRoleName)
                        .collect(Collectors.toSet()))
                .build();
    }

    public void updateEntityFromDto(User entity, UserDto dto) {
        if (entity == null || dto == null) return;

        // update basic fields
        entity.setId(dto.getId());
        entity.setUsername(dto.getUsername());
        entity.setPassword(dto.getPassword());
        entity.setRoles(dto.getRoles().stream()
                .map(roleName -> roleService.findByRoleName(roleName)
                        .orElseThrow(() -> new RuntimeException("Role not found: " + roleName)))
                .collect(Collectors.toList()));
    }
}
