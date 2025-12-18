# Metadata Provider Adapters

Place provider adapters in this folder. Each provider should implement the `MetadataProvider` interface from `src/services/metadataService.ts` and register itself on import.

Example provider file:
- `src/features/metadata/providers/example.ts` — simple provider that returns deterministic data (useful for tests).