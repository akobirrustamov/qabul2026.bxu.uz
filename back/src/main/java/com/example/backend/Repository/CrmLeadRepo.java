package com.example.backend.Repository;

import com.example.backend.Entity.CrmLead;
import com.example.backend.Entity.CrmLeadComment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CrmLeadRepo extends JpaRepository<CrmLead, UUID>, JpaSpecificationExecutor<CrmLead> {


    @Query("""
SELECT l FROM CrmLead l 
LEFT JOIN FETCH l.operator 
WHERE l.reminderTime IS NOT NULL 
AND (l.completed = false OR l.completed IS NULL)
AND l.reminderTime < :now 
ORDER BY l.reminderTime ASC
""")
    List<CrmLead> findAllFutureReminders(@Param("now") LocalDateTime now);
    @Query("""
SELECT l FROM CrmLead l 
LEFT JOIN FETCH l.operator 
WHERE l.operator.id = :operatorId
AND l.reminderTime IS NOT NULL 
AND (l.completed = false OR l.completed IS NULL)
AND l.reminderTime < :now
ORDER BY l.reminderTime ASC
""")
    List<CrmLead> findFutureRemindersByOperator(
            @Param("operatorId") UUID operatorId,
            @Param("now") LocalDateTime now
    );
    long countByCreatedAtAfter(LocalDateTime date);

    @Query("SELECT DATE(l.createdAt), COUNT(l) FROM CrmLead l GROUP BY DATE(l.createdAt)")
    List<Object[]> countGroupedByDate();

    long countByCrmSubCategory_Id(UUID subId);

    Optional<CrmLead> findByApplicantId(UUID id);

    @Query(value = "select * from crm_leads where crm_sub_category_id=:subCategoryId", nativeQuery = true)
    List<CrmLead> findBySubCategoryId(UUID subCategoryId);

    Page<CrmLead> findByCrmSubCategoryId(UUID crmSubCategoryId, Pageable pageable);

    @Query(value = """
            SELECT l.* FROM crm_leads l
            LEFT JOIN abuturient a ON l.applicant_id = a.id
            WHERE l.crm_sub_category_id = :subCategoryId
              AND (
                LOWER(l.phone) LIKE LOWER(CONCAT('%', :query, '%'))
                OR LOWER(a.phone) LIKE LOWER(CONCAT('%', :query, '%'))
                OR LOWER(a.first_name) LIKE LOWER(CONCAT('%', :query, '%'))
                OR LOWER(a.last_name) LIKE LOWER(CONCAT('%', :query, '%'))
              )
            ORDER BY l.created_at DESC
            """,
            countQuery = """
            SELECT COUNT(l.id) FROM crm_leads l
            LEFT JOIN abuturient a ON l.applicant_id = a.id
            WHERE l.crm_sub_category_id = :subCategoryId
              AND (
                LOWER(l.phone) LIKE LOWER(CONCAT('%', :query, '%'))
                OR LOWER(a.phone) LIKE LOWER(CONCAT('%', :query, '%'))
                OR LOWER(a.first_name) LIKE LOWER(CONCAT('%', :query, '%'))
                OR LOWER(a.last_name) LIKE LOWER(CONCAT('%', :query, '%'))
              )
            """,
            nativeQuery = true)
    Page<CrmLead> searchBySubCategory(UUID subCategoryId, String query, Pageable pageable);

    // CrmLeadRepository.java
    Optional<CrmLead> findTopByPhoneOrderByCreatedAtDesc(String phone);

    @Query(value = """
            SELECT * FROM crm_leads
            WHERE crm_sub_category_id = :subcategoryId
              AND (operator_id = :operatorId OR operator_id IS NULL)
            ORDER BY created_at DESC
            LIMIT :size OFFSET :offset
            """, nativeQuery = true)
    List<CrmLead> findBySubCategoryAndOperatorOrNull(UUID subcategoryId, UUID operatorId, int size, int offset);

    @Query(value = """
            SELECT COUNT(*) FROM crm_leads
            WHERE crm_sub_category_id = :subcategoryId
              AND (operator_id = :operatorId OR operator_id IS NULL)
            """, nativeQuery = true)
    long countBySubCategoryAndOperatorOrNull(UUID subcategoryId, UUID operatorId);

    @Query(value = """
            SELECT l.* FROM crm_leads l
            LEFT JOIN abuturient a ON l.applicant_id = a.id
            WHERE (l.operator_id = :operatorId OR l.operator_id IS NULL)
              AND (
                LOWER(l.phone) LIKE LOWER(CONCAT('%', :query, '%'))
                OR LOWER(a.phone) LIKE LOWER(CONCAT('%', :query, '%'))
                OR LOWER(a.first_name) LIKE LOWER(CONCAT('%', :query, '%'))
                OR LOWER(a.last_name) LIKE LOWER(CONCAT('%', :query, '%'))
              )
            ORDER BY l.created_at DESC
            """,
            countQuery = """
            SELECT COUNT(l.id) FROM crm_leads l
            LEFT JOIN abuturient a ON l.applicant_id = a.id
            WHERE (l.operator_id = :operatorId OR l.operator_id IS NULL)
              AND (
                LOWER(l.phone) LIKE LOWER(CONCAT('%', :query, '%'))
                OR LOWER(a.phone) LIKE LOWER(CONCAT('%', :query, '%'))
                OR LOWER(a.first_name) LIKE LOWER(CONCAT('%', :query, '%'))
                OR LOWER(a.last_name) LIKE LOWER(CONCAT('%', :query, '%'))
              )
            """,
            nativeQuery = true)
    Page<CrmLead> searchByOperator(UUID operatorId, String query, Pageable pageable);

    @Query(value = """
            SELECT * FROM crm_leads
            WHERE (operator_id = :operatorId OR operator_id IS NULL)
            ORDER BY created_at DESC
            """,
            countQuery = """
            SELECT COUNT(*) FROM crm_leads
            WHERE (operator_id = :operatorId OR operator_id IS NULL)
            """,
            nativeQuery = true)
    Page<CrmLead> findByOperatorOrNullPaged(UUID operatorId, Pageable pageable);

    @Query(value = """
            SELECT l.* FROM crm_leads l
            LEFT JOIN crm_sub_categories sc ON l.crm_sub_category_id = sc.id
            WHERE (l.operator_id = :operatorId OR l.operator_id IS NULL)
              AND sc.crm_category_id = :categoryId
            ORDER BY l.created_at DESC
            """,
            countQuery = """
            SELECT COUNT(l.id) FROM crm_leads l
            LEFT JOIN crm_sub_categories sc ON l.crm_sub_category_id = sc.id
            WHERE (l.operator_id = :operatorId OR l.operator_id IS NULL)
              AND sc.crm_category_id = :categoryId
            """,
            nativeQuery = true)
    Page<CrmLead> findByOperatorAndCategoryPaged(UUID operatorId, UUID categoryId, Pageable pageable);

    @Query(value = """
            SELECT l.* FROM crm_leads l
            LEFT JOIN abuturient a ON l.applicant_id = a.id
            LEFT JOIN crm_sub_categories sc ON l.crm_sub_category_id = sc.id
            WHERE (l.operator_id = :operatorId OR l.operator_id IS NULL)
              AND sc.crm_category_id = :categoryId
              AND (
                LOWER(l.phone) LIKE LOWER(CONCAT('%', :query, '%'))
                OR LOWER(a.phone) LIKE LOWER(CONCAT('%', :query, '%'))
                OR LOWER(a.first_name) LIKE LOWER(CONCAT('%', :query, '%'))
                OR LOWER(a.last_name) LIKE LOWER(CONCAT('%', :query, '%'))
              )
            ORDER BY l.created_at DESC
            """,
            countQuery = """
            SELECT COUNT(l.id) FROM crm_leads l
            LEFT JOIN abuturient a ON l.applicant_id = a.id
            LEFT JOIN crm_sub_categories sc ON l.crm_sub_category_id = sc.id
            WHERE (l.operator_id = :operatorId OR l.operator_id IS NULL)
              AND sc.crm_category_id = :categoryId
              AND (
                LOWER(l.phone) LIKE LOWER(CONCAT('%', :query, '%'))
                OR LOWER(a.phone) LIKE LOWER(CONCAT('%', :query, '%'))
                OR LOWER(a.first_name) LIKE LOWER(CONCAT('%', :query, '%'))
                OR LOWER(a.last_name) LIKE LOWER(CONCAT('%', :query, '%'))
              )
            """,
            nativeQuery = true)
    Page<CrmLead> searchByOperatorAndCategory(UUID operatorId, UUID categoryId, String query, Pageable pageable);

    @Query(value = """
            SELECT l.* FROM crm_leads l
            WHERE (l.operator_id = :operatorId OR l.operator_id IS NULL)
              AND l.crm_sub_category_id = :subCategoryId
            ORDER BY l.created_at DESC
            """,
            countQuery = """
            SELECT COUNT(l.id) FROM crm_leads l
            WHERE (l.operator_id = :operatorId OR l.operator_id IS NULL)
              AND l.crm_sub_category_id = :subCategoryId
            """,
            nativeQuery = true)
    Page<CrmLead> findByOperatorAndSubCategoryPaged(UUID operatorId, UUID subCategoryId, Pageable pageable);

    @Query(value = """
            SELECT l.* FROM crm_leads l
            LEFT JOIN abuturient a ON l.applicant_id = a.id
            WHERE (l.operator_id = :operatorId OR l.operator_id IS NULL)
              AND l.crm_sub_category_id = :subCategoryId
              AND (
                LOWER(l.phone) LIKE LOWER(CONCAT('%', :query, '%'))
                OR LOWER(a.phone) LIKE LOWER(CONCAT('%', :query, '%'))
                OR LOWER(a.first_name) LIKE LOWER(CONCAT('%', :query, '%'))
                OR LOWER(a.last_name) LIKE LOWER(CONCAT('%', :query, '%'))
              )
            ORDER BY l.created_at DESC
            """,
            countQuery = """
            SELECT COUNT(l.id) FROM crm_leads l
            LEFT JOIN abuturient a ON l.applicant_id = a.id
            WHERE (l.operator_id = :operatorId OR l.operator_id IS NULL)
              AND l.crm_sub_category_id = :subCategoryId
              AND (
                LOWER(l.phone) LIKE LOWER(CONCAT('%', :query, '%'))
                OR LOWER(a.phone) LIKE LOWER(CONCAT('%', :query, '%'))
                OR LOWER(a.first_name) LIKE LOWER(CONCAT('%', :query, '%'))
                OR LOWER(a.last_name) LIKE LOWER(CONCAT('%', :query, '%'))
              )
            """,
            nativeQuery = true)
    Page<CrmLead> searchByOperatorAndSubCategory(UUID operatorId, UUID subCategoryId, String query, Pageable pageable);

    Optional<CrmLead> findByPhone(String phone);

    @Query("select l.id from CrmLead l where l.crmSubCategory.id = :subCategoryId")
    List<UUID> findAllIdsBySubCategoryId(@Param("subCategoryId") UUID subCategoryId);

    @Query("""
SELECT l FROM CrmLead l
JOIN l.applicant a
WHERE l.crmSubCategory.id = :subCategoryId
AND (COALESCE(:operatorId, l.operator.id) = l.operator.id)
AND (COALESCE(:agentId, a.agent.id) = a.agent.id)
AND (:fromDate IS NULL OR l.createdAt >= :fromDate)
AND (:toDate IS NULL OR l.createdAt <= :toDate)
""")
    Page<CrmLead> filter(
            UUID subCategoryId,
            UUID operatorId,
            UUID agentId,
            LocalDateTime fromDate,
            LocalDateTime toDate,
            Pageable pageable
    );


}
