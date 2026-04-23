package com.example.backend.Controller;

import com.example.backend.DTO.AddUserDto;
import com.example.backend.Entity.Abuturient;
import com.example.backend.Entity.AgentPath;
import com.example.backend.Entity.Role;
import com.example.backend.Entity.User;
import com.example.backend.Enums.UserRoles;
import com.example.backend.Repository.AbuturientRepo;
import com.example.backend.Repository.AgentPathRepo;
import com.example.backend.Repository.RoleRepo;
import com.example.backend.Repository.UserRepo;
import com.example.backend.Services.AuthService.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpEntity;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.concurrent.ThreadLocalRandom;

@RestController
@RequiredArgsConstructor
@CrossOrigin
@RequestMapping("/api/v1/ambassador")
public class AmbassadorController {

    private final AuthService service;

    private final UserRepo userRepo;
    private final RoleRepo roleRepo;
    private final PasswordEncoder passwordEncoder;
    private final AgentPathRepo agentPathRepo;
    private final AbuturientRepo abuturientRepo;

    @GetMapping
    public HttpEntity<?> getAllAgents() {
        List<AgentPath> users = agentPathRepo.findAll();

        // Filter only those whose agent has ROLE_OPERATOR
        List<AgentPath> filtered = users.stream()
                .filter(user -> user.getAgent() != null &&
                        user.getAgent().getRoles().stream()
                                .anyMatch(role -> role.getName().name().equals("ROLE_OPERATOR")))
                .toList();

        return ResponseEntity.ok(filtered);
    }


    @GetMapping("/me/{token}")
    public HttpEntity<?> getMeAgent(@PathVariable String token){
        User decode = service.decode(token);
        decode.setPassword("");
        return ResponseEntity.ok(decode);
    }
    @GetMapping("/agent-path/{token}")
    public HttpEntity<?> getMeAgentPath(@PathVariable String token){
        User decode = service.decode(token);
        decode.setPassword("");
        Optional<AgentPath> byAgentId = agentPathRepo.findByAgentId(decode.getId());
        if(byAgentId.isPresent()){
            return ResponseEntity.ok(byAgentId.get());
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/appeals/{token}")
    public HttpEntity<?> decode(@PathVariable String token) {
        User decode = service.decode(token);
        List<Abuturient> abuturients = abuturientRepo.findByAgentId(decode.getId());
        return ResponseEntity.ok(abuturients);
    }

    @PostMapping
    public HttpEntity<?> addAgent(@RequestBody AddUserDto agent) {
        Role byName = roleRepo.findByName(UserRoles.ROLE_OPERATOR);
        List<Role> roles = new ArrayList<>();
        roles.add(byName);
        User user = new User(agent.getLogin(), passwordEncoder.encode(agent.getPassword()), roles, agent.getName(), (agent.getCallCenterNumber()!=null?agent.getCallCenterNumber():null ));
        Optional<User> byPhone = userRepo.findByPhone(agent.getLogin());
        if (byPhone.isPresent()) {
            Optional<AgentPath> agentPath = agentPathRepo.findByAgentId(byPhone.get().getId());
            return ResponseEntity.ok(agentPath);
        }
        User savedUser = userRepo.save(user);
        AgentPath save = agentPathRepo.save(new AgentPath(agentNumber(), savedUser));

        return ResponseEntity.ok(save);
    }

    public Integer agentNumber(){
        Integer randomPathNumber = ThreadLocalRandom.current().nextInt(1000, 10000);
        Optional<AgentPath> byAgentNumber = agentPathRepo.findByAgentNumber(randomPathNumber);
        if (byAgentNumber.isPresent()) {
            agentNumber();
        }
        return randomPathNumber;
    }


    @PutMapping("/{id}")
    public HttpEntity<?> updateAgent(@RequestBody AddUserDto agent, @PathVariable UUID id){
        Optional<User> byId = userRepo.findById(id);
        if (byId.isPresent()){
            User user = byId.get();
            if (!Objects.equals(agent.getPassword(), "")){
                user.setPassword(passwordEncoder.encode(agent.getPassword()));
            }
            user.setPassword(passwordEncoder.encode(agent.getPassword()));
            user.setPhone(agent.getLogin());
            user.setName(agent.getName());
            userRepo.save(user);
        }
        return ResponseEntity.ok(null);
    }



    @DeleteMapping("/{id}")
    public HttpEntity<?> deleteAgent(@PathVariable UUID id){
        Optional<User> byId = userRepo.findById(id);
        if (byId.isPresent()){
            User user = byId.get();
            userRepo.delete(user);
            return ResponseEntity.ok(null);
        }
        return ResponseEntity.ok(null);
    }

}
