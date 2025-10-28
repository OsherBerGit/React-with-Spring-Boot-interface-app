package com.example.jwt_basics1.repository;

import com.example.jwt_basics1.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findUserByUsername(String username);

    User findByUsername(String username);

    List<User> findAll();

    Optional<User> getUsersById(Long id);
}
