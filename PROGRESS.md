# TODS Native Conversion Progress

## Session Goals
Convert UMO to use TODS format internally with extensibility focus.
Working independently for ~3 hours with high autonomy.

## Completed ✅

### Phase 1: Foundation (30 min)
- [x] Created refactor plan document
- [x] Established baseline (134/185 tests passing)
- [x] Designed TODSMetadata class architecture
- [x] Implemented src/metadata/todsMetadata.ts (330 lines)
  - TODS-native Participant storage with Map<string, Participant>
  - Side[] management
  - Legacy compatibility layer (auto-convert on input)
  - Service/receive order tracking
  - Match & tournament metadata
  - Extensibility via TODS extensions

## In Progress 🔄

### Phase 2: Integration (60 min)
- [ ] Import TODSMetadata into matchObject.ts
- [ ] Replace metadata object with TODSMetadata instance
- [ ] Update all metadata accessors
- [ ] Ensure tests pass incrementally

## Next Steps 📋

### Phase 3: API Modernization (60 min)
- [ ] Add direct TODS getters (match.matchUp, match.sides)
- [ ] Update toMatchUp() to use internal TODS
- [ ] Simplify fromMatchUp() (no conversion needed)
- [ ] Add TODS Score structure

### Phase 4: Testing & Polish (30 min)
- [ ] Run full test suite (target: 185/185)
- [ ] Add TODS-native tests
- [ ] Performance benchmarks
- [ ] Update documentation

## Key Design Decisions

1. **Participant Storage**: Map<string, Participant> for O(1) lookup by participantId
2. **Legacy Compatibility**: definePlayer() auto-converts to TODS via adapter
3. **Extensibility**: Use TODS extensions[] for custom metadata
4. **Zero Conversion**: Internal TODS = external TODS (no adapters needed)
5. **Backward Compat**: Legacy imports still work via conversion layer

## Architecture Benefits

- **Performance**: No conversion overhead
- **Extensibility**: Easy to add TODS properties
- **Interoperability**: Direct TODS integration with Factory
- **Clean API**: Direct access to TODS objects
- **Future-Proof**: Standards-based architecture

## Time Tracking
- Start: [timestamp]
- Phase 1 Complete: ~30 min
- Target Completion: ~3 hours
- Status: On track ✅
