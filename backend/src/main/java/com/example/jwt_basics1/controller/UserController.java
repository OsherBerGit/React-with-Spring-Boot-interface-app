package com.example.jwt_basics1.controller;

import com.example.jwt_basics1.dto.UserDto;
import com.example.jwt_basics1.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;


@RestController
@RequiredArgsConstructor
@RequestMapping("/api")
public class UserController {

    private final UserService userService;

    @GetMapping("/protected-message")
    public String home() {
        return "Welcome to the Backend Server home page";
    }

    @GetMapping("/protected-message-admin")
    public String adminHome() {
        return "Welcome to the Backend Server ADMIN home page";
    }

    @GetMapping
    public List<UserDto> getAllUsers() { // החזרת רשימת כל המשתמשים
        return userService.getAllUsers();
    }

    @GetMapping("/{id}")
    public UserDto getUserById(@PathVariable Long id) { // החזרת משתמש לפי ID
        return userService.getUserById(id);
    }

    @PostMapping
    public UserDto createUser(@RequestBody UserDto userDto) { // יצירת משתמש חדש
        return userService.createUser(userDto);
    }

    @PutMapping("/{id}")
    public UserDto updateUser(@PathVariable Long id, @RequestBody UserDto userDto) { // עדכון פרטי משתמש קיים
        return userService.updateUser(id, userDto);
    }

    @DeleteMapping("/{id}")
    public void deleteUser(@PathVariable Long id) { // מחיקת משתמש לפי ID
        userService.deleteUser(id);
    }
}
