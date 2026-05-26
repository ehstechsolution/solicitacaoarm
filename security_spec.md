# Security Specification - ARM Som e Luz Orçamentos

## 1. Data Invariants
- **Public Create Only**: Unauthenticated users can only create quotes. They cannot update or delete any quote document.
- **Strict Read Prevention**: To protect PII (Name, Documents, WhatsApp, Event Addresses), listing (`list` queries) is strictly disabled (`allow list: if false;`). Singular document reads (`get`) are allowed using highly-secure, unpredictable Firestore auto-generated document IDs (UUIDs).
- **Immutability of Key Fields**: Because updates are blocked for public users, all fields are effectively immutable once created.
- **Validation Strictness**: Created documents must contain all required fields with exact sizes, correct types, and match enum boundaries for `tipoCliente` ("PF", "PJ"), and `status` ("proposta_solicitada").
- **Timestamp Integrity**: `createdAt` must exactly match the server timestamp (`request.time`).

---

## 2. The "Dirty Dozen" Payloads (Adversarial Test Suite)
The following payloads attempt to violate security boundaries and must be rejected with `PERMISSION_DENIED`.

1. **The Ghost Field (Shadow Update)**: Attempting to create a document with an unmapped field `isApproved: true`.
2. **Identity Spoofing**: Setting `id` or other fields as massive strings (1MB) to consume resources (Value Poisoning / Denial of Wallet).
3. **Invalid Email/Phone Formats**: Providing an invalid Phone or CEP format in the quote.
4. **Invalid Client Type**: Creating with `tipoCliente: "UNKNOWN"` (violating enum boundary).
5. **Illegal Status State**: Requesting with `status: "aprovado"` instead of `"proposta_solicitada"`.
6. **Client-Controlled Timestamp**: Forcing `createdAt` to a hardcoded client date instead of `request.time`.
7. **Incomplete Required Fields**: Omitting mandatory contractor details (e.g., omitting `whatsapp`).
8. **Malicious Document ID (ID Poisoning)**: Writing to `/orcamentos/SOME_POISON_PATH_!!_###_$$`.
9. **Global Collection Read (PII Data Leak)**: Attempting to query `db.collection('orcamentos').get()` (list query).
10. **Unauthorized Update**: Attempting to edit/update an existing quote to change its status or details.
11. **Unauthorized Delete**: Attempting to delete a submitted quote.
12. **Mismatched Numeric Values**: Submitting negative values for `subtotal`, `taxaDeslocamento`, or `valorTotal`.

---

## 3. Test Runner Design
Any test runner verifying these payloads will assert `assertFails()` for all operations listed above.
The final rules will prevent all 12 adversarial attacks through a strict, clean schematic blueprint.
