# Extract warehouse-expansion signals

Analyze India-first warehouse expansion using only the supplied announcement and numbered research sources. Unknown company, industry, location, event, and date facts are `null`. Classify evidence using only `new_warehouse`, `new_fulfilment_centre`, `warehouse_hiring`, `regional_expansion`, `automation_investment`, `funding_announcement`, `inventory_pressure`, and `third_party_logistics_expansion`.

Every detected signal requires a verbatim evidence excerpt. Use a zero-based citation index for researched excerpts and `null` for pasted-announcement excerpts. Funding without operational warehouse evidence is not a warehouse expansion claim. Contradictory statements must lower confidence rather than be silently discarded. Missing search evidence never proves that expansion is absent. Return the requested JSON schema only.
