# MedConnect Compliance Roadmap (Post-Pilot)

This roadmap defines the work required before handling regulated patient data.

## Stage 1: Security foundation
- Enforce least-privilege access for operators and infrastructure
- Centralized structured logging with retention policy
- Vulnerability scanning in CI for Python and Node dependencies
- Secret rotation policy and managed secret store

## Stage 2: HIPAA readiness track
- Select only vendors that can sign BAAs
- Implement immutable audit logs for data access and admin actions
- Encrypt data in transit and at rest with key management policy
- Formal incident response and breach notification procedures
- Role-based access controls and periodic access reviews

## Stage 3: GDPR readiness track
- Define lawful basis per data category
- Data retention and deletion policy with automated enforcement
- DSAR workflow (export, correction, deletion)
- Privacy notice and consent records management
- Data processing agreements with all subprocessors

## Stage 4: Clinical interoperability (FHIR)
- Add FHIR only when integration with external EHR/hospital systems is required
- Prioritize:
  - Patient (de-identified where appropriate)
  - Observation
  - Condition
  - MedicationRequest
  - Encounter
- Add consent and provenance resources for data lineage and sharing controls

## Go-live gates for regulated data
- Independent security review completed
- Compliance counsel review completed
- BAA/DPA contracts in place
- Audit logging and DSAR processes tested end-to-end
- Disaster recovery and restore drills passed
