package com.example.backend.Controller;

import com.example.backend.Repository.ContractRepo;
import lombok.RequiredArgsConstructor;
import org.apache.hc.core5.http.HttpEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@CrossOrigin
@RequestMapping("/api/v1/contract")
public class ContractController {

    private final ContractRepo contractRepo;





}
