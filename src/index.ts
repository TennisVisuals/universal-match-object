// Universal Match Object - Main Exports

// Version
export { version } from './version';

// Core - default export
export { default } from './matchObject';

// Format Converter (bidirectional legacy ↔ factory conversion)
export {
  parseFormat,
  convertLegacyToFactory,
  convertFactoryToLegacy,
  extractFormatProperties,
  areFormatsEquivalent,
  isFactoryFormat,
  isLegacyFormat,
  isValidFormat,
  stringifyFormat,
  getFormatDescription,
  LEGACY_TO_FACTORY_MAP,
  FACTORY_TO_LEGACY_MAP
} from './formatConverter';

// TODS Participant Adapter (v3.1.0+)
export { ParticipantAdapter, isTODSParticipant, isLegacyPlayer } from './participantAdapter';
export type { LegacyPlayer, ParticipantFormat } from './participantAdapter';

// TODS MatchUp Adapter (v3.2.0+)
export { MatchUpAdapter, isTODSMatchUp } from './matchUpAdapter';

// Type exports (TODS types - more complete than legacy types)
export type * from './types/tods';
