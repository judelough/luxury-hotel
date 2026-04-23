package com.luxstay.luxstay_hotels_v2.domain.service;

import com.luxstay.luxstay_hotels_v2.domain.HotelChain;
import com.luxstay.luxstay_hotels_v2.domain.repo.HotelChainRepository;
import com.luxstay.luxstay_hotels_v2.web.exception.ResourceNotFoundException;
import jakarta.persistence.EntityManager;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class HotelChainService {
    private final HotelChainRepository repo;
    private final EntityManager em;

    public HotelChainService(HotelChainRepository repo, EntityManager em) {
        this.repo = repo;
        this.em = em;
    }

    public List<HotelChain> list() {
        return repo.findAll();
    }

    public HotelChain get(Long id) {
        return repo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("HotelChain not found: " + id));
    }

    public HotelChain create(String name) {
        HotelChain chain = HotelChain.builder().name(name).build();
        return repo.save(chain);
    }

    public HotelChain update(Long id, String name) {
        HotelChain chain = get(id);
        chain.setName(name);
        return repo.save(chain);
    }

    public void delete(Long id) {
        if (!repo.existsById(id)) throw new ResourceNotFoundException("HotelChain not found: " + id);
        repo.deleteById(id);
    }

    public List<HotelChain> seedDefaultChains() {
        List<String> names = List.of(
                "Delta",
                "Fairmont Hotels",
                "Sheraton",
                "Hampton Inn",
                "Hilton",
                "Westin",
                "Marriott",
                "Four Seasons Hotels",
                "Quality Inn",
                "Hyatt Place",
                "Ramada"
        );

        // idempotent: only insert missing
        for (String name : names) {
            if (!repo.existsByNameIgnoreCase(name)) {
                repo.save(HotelChain.builder().name(name).build());
            }
        }

        // return in requested order
        return names.stream()
                .map(n -> repo.findByNameIgnoreCase(n)
                        .orElseThrow(() -> new ResourceNotFoundException("Seed failed for chain: " + n)))
                .toList();
    }

    public List<HotelChain> resetAndSeedDefaultChains() {
        // WARNING: This will wipe hotel_chain and (with CASCADE) dependent tables (e.g., hotel)
        em.createNativeQuery("TRUNCATE TABLE hotel_chain RESTART IDENTITY CASCADE")
                .executeUpdate();

        List<HotelChain> chains = List.of(
                HotelChain.builder().name("Delta").build(),
                HotelChain.builder().name("Fairmont Hotels").build(),
                HotelChain.builder().name("Sheraton").build(),
                HotelChain.builder().name("Hampton Inn").build(),
                HotelChain.builder().name("Hilton").build(),
                HotelChain.builder().name("Westin").build(),
                HotelChain.builder().name("Marriott").build(),
                HotelChain.builder().name("Four Seasons Hotels").build(),
                HotelChain.builder().name("Quality Inn").build(),
                HotelChain.builder().name("Hyatt Place").build(),
                HotelChain.builder().name("Ramada").build()
        );

        repo.saveAll(chains);

        return repo.findAll(Sort.by(Sort.Direction.ASC, "id"));
    }
}
