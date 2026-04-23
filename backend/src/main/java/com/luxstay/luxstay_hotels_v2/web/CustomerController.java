package com.luxstay.luxstay_hotels_v2.web;

import com.luxstay.luxstay_hotels_v2.domain.Customer;
import com.luxstay.luxstay_hotels_v2.domain.service.CustomerService;
import com.luxstay.luxstay_hotels_v2.web.dto.CustomerDtos;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v2/customers")
public class CustomerController {

    private final CustomerService service;

    public CustomerController(CustomerService service) {
        this.service = service;
    }

    @GetMapping
    public List<CustomerDtos.Response> list() {
        return service.list().stream().map(this::toDto).toList();
    }

    @GetMapping("/{id}")
    public CustomerDtos.Response get(@PathVariable Long id) {
        return toDto(service.get(id));
    }

    /**
     * Business-first endpoint:
     * Creates a customer IF they don't already exist by (idNumber + email), otherwise returns the existing one.
     */
    @PostMapping
    public CustomerDtos.Response create(@Valid @RequestBody CustomerDtos.CreateRequest req) {
        Customer saved = service.findOrCreate(
                req.fullName(),
                req.address(),
                req.dateOfBirth(),
                req.idNumber(),
                req.idType(),
                req.email()
        );

        return toDto(saved);
    }

    @PutMapping("/{id}")
    public CustomerDtos.Response update(@PathVariable Long id,
                                        @Valid @RequestBody CustomerDtos.UpdateRequest req) {
        Customer saved = service.update(id, req.fullName(), req.address(), req.email());
        return toDto(saved);
    }


    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }

    private CustomerDtos.Response toDto(Customer c) {
        return new CustomerDtos.Response(
                c.getId(),
                c.getFullName(),
                c.getAddress(),
                c.getDateOfBirth(),
                c.getIdNumber(),
                c.getIdType(),
                c.getEmail(),
                c.getRegistrationDate()
        );
    }

}
