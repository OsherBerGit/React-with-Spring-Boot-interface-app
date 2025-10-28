package com.example.jwt_basics1.service;

import com.example.jwt_basics1.mapper.UserMapper;
import com.example.jwt_basics1.dto.UserDto;
import com.example.jwt_basics1.entity.User;
import com.example.jwt_basics1.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;

    @Transactional
    public List<UserDto> getAllUsers() {
        return userRepository.findAll().stream()
                .map(userMapper::toDto)
                .toList();
    }

    @Transactional
    public UserDto getUserById(Long id) {
        return userMapper.toDto(userRepository.getUsersById(id).orElse(null));
    }

    @Transactional
    public UserDto createUser(UserDto userDto) {
        return userMapper.toDto(userRepository.save(userMapper.toEntity(userDto)));
    }

    @Transactional
    public UserDto updateUser(Long id, UserDto userDto) {
        if (userDto.getId() != null && !userDto.getId().equals(id))
            throw new IllegalArgumentException(("Path ID " + id + " does not match body ID " + userDto.getId()));

        User existingUser = userRepository.getUsersById(id)
                .orElseThrow(() -> new RuntimeException("User not found with ID " + id));

        userRepository.findUserByUsername(userDto.getUsername())
                .ifPresent(foundUser -> {
                    if (!foundUser.getId().equals(id))
                        throw new IllegalArgumentException("Username is already taken");
                });

        userMapper.updateEntityFromDto(existingUser, userDto);

        User updatedUser = userRepository.save(existingUser);
        return userMapper.toDto(updatedUser);
    }

    @Transactional
    public void deleteUser(Long id) {
        if (!userRepository.existsById(id))
            throw new IllegalArgumentException("Student with id " + id + " does not exist");

        userRepository.deleteById(id);
    }
}
