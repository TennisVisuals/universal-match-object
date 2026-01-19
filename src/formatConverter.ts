// Format Converter Module
// Converts between UMO legacy format codes and Factory modern format codes

// @ts-ignore - tods-competition-factory has type issues with exports
import { matchUpFormatCode } from 'tods-competition-factory';

/**
 * Mapping from UMO legacy format codes to Factory format codes
 * 
 * UMO uses codes like:
 * - Match: '3_6a_7', '5_6a_7_long'
 * - Set: 'AdSetsTo6tb7', 'NoAdSetsTo6tb7'
 * 
 * Factory uses codes like:
 * - Match: 'SET3-S:6/TB7', 'SET5-S:6/TB7-F:6'
 */
export const LEGACY_TO_FACTORY_MAP: Record<string, string> = {
  // Match formats
  '3_6a_7': 'SET3-S:6/TB7',
  '3_6n_7': 'SET3-S:6NOAD/TB7',
  '3_4n_10': 'SET3-S:4NOAD/TB7-F:TB10',
  '1_4n_7': 'SET1-S:4NOAD/TB7@3',
  '3_6n_10': 'SET3-S:6NOAD/TB7-F:TB10',
  '5_6a_7': 'SET5-S:6/TB7',
  '5_6a_7_long': 'SET5-S:6/TB7-F:6',
  '3_6a_7_long': 'SET3-S:6/TB7-F:6',
  '1_8a_7': 'SET1-S:8/TB7',
};

/**
 * Reverse mapping: Factory format codes to UMO legacy codes
 * Used for backward compatibility
 */
export const FACTORY_TO_LEGACY_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(LEGACY_TO_FACTORY_MAP).map(([legacy, factory]) => [factory, legacy])
);

/**
 * Convert UMO legacy format code to Factory format code
 * 
 * @param legacyCode - UMO legacy format code (e.g., '3_6a_7')
 * @returns Factory format code (e.g., 'SET3-S:6/TB7') or undefined
 */
export function convertLegacyToFactory(legacyCode: string): string | undefined {
  return LEGACY_TO_FACTORY_MAP[legacyCode];
}

/**
 * Convert Factory format code to UMO legacy code
 * 
 * @param factoryCode - Factory format code (e.g., 'SET3-S:6/TB7')
 * @returns UMO legacy format code (e.g., '3_6a_7') or undefined
 */
export function convertFactoryToLegacy(factoryCode: string): string | undefined {
  return FACTORY_TO_LEGACY_MAP[factoryCode];
}

/**
 * Parse a format code (either legacy or factory)
 * 
 * @param code - Format code (legacy or factory)
 * @returns Parsed format object with metadata
 */
export function parseFormat(code: string) {
  // Try factory format first
  const factoryParsed = matchUpFormatCode.parse(code);
  if (factoryParsed) {
    // Add explicit gameFormat to setFormat (Option B2: Explicit Minimal)
    // Regular games get {}, No-AD games get { NoAD: true }
    if (factoryParsed.setFormat && !factoryParsed.setFormat.gameFormat) {
      factoryParsed.setFormat.gameFormat = factoryParsed.setFormat.NoAD 
        ? { NoAD: true } 
        : {};
    }
    
    // Add gameFormat to finalSetFormat if it's a regular set (not tiebreakSet)
    if (factoryParsed.finalSetFormat && !factoryParsed.finalSetFormat.tiebreakSet && !factoryParsed.finalSetFormat.gameFormat) {
      factoryParsed.finalSetFormat.gameFormat = factoryParsed.finalSetFormat.NoAD 
        ? { NoAD: true } 
        : {};
    }
    
    return {
      format: factoryParsed,
      type: 'factory' as const,
      code,
      isValid: true
    };
  }
  
  // Try legacy format conversion
  const factoryCode = convertLegacyToFactory(code);
  if (factoryCode) {
    const parsed = matchUpFormatCode.parse(factoryCode);
    if (parsed) {
      // Add explicit gameFormat for legacy formats too
      if (parsed.setFormat && !parsed.setFormat.gameFormat) {
        parsed.setFormat.gameFormat = parsed.setFormat.NoAD 
          ? { NoAD: true } 
          : {};
      }
      
      if (parsed.finalSetFormat && !parsed.finalSetFormat.tiebreakSet && !parsed.finalSetFormat.gameFormat) {
        parsed.finalSetFormat.gameFormat = parsed.finalSetFormat.NoAD 
          ? { NoAD: true } 
          : {};
      }
      
      return {
        format: parsed,
        type: 'legacy' as const,
        code,
        factoryCode,
        isValid: true
      };
    }
  }
  
  // Invalid format
  return {
    format: undefined,
    type: 'unknown' as const,
    code,
    isValid: false
  };
}

/**
 * Stringify a format object to Factory format code
 * 
 * @param formatObject - Parsed format object from Factory
 * @returns Factory format code string
 */
export function stringifyFormat(formatObject: any): string | undefined {
  return matchUpFormatCode.stringify(formatObject);
}

/**
 * Check if a code is a valid Factory format
 * 
 * @param code - Format code to check
 * @returns true if valid Factory format
 */
export function isFactoryFormat(code: string): boolean {
  return matchUpFormatCode.parse(code) !== undefined;
}

/**
 * Check if a code is a valid UMO legacy format
 * 
 * @param code - Format code to check
 * @returns true if valid legacy format
 */
export function isLegacyFormat(code: string): boolean {
  return code in LEGACY_TO_FACTORY_MAP;
}

/**
 * Validate a format code (either type)
 * 
 * @param code - Format code to validate
 * @returns true if valid (factory or legacy)
 */
export function isValidFormat(code: string): boolean {
  return isFactoryFormat(code) || isLegacyFormat(code);
}

/**
 * Extract format properties from parsed Factory format
 * Maps Factory structure to UMO-compatible properties
 * 
 * @param parsedFormat - Parsed format from Factory
 * @returns Object with UMO-compatible properties
 */
export function extractFormatProperties(parsedFormat: any) {
  const { bestOf, exactly, setFormat, finalSetFormat } = parsedFormat;
  
  return {
    // Match level
    bestOf,
    exactly,
    
    // Set level
    setThreshold: setFormat?.setTo,
    setMinDiff: setFormat?.noTiebreak ? 2 : 0,
    setHasDecider: !!setFormat?.tiebreakFormat || !!setFormat?.tiebreakSet,
    
    // Tiebreak level
    tiebreakAt: setFormat?.tiebreakAt || setFormat?.setTo,
    tiebreakTo: setFormat?.tiebreakFormat?.tiebreakTo || setFormat?.tiebreakSet?.tiebreakTo,
    tiebreakSet: setFormat?.tiebreakSet,
    noTiebreak: setFormat?.noTiebreak,
    
    // Scoring options
    noAd: setFormat?.NoAD || false,
    
    // Timed sets
    timed: setFormat?.timed || false,
    minutes: setFormat?.minutes,
    based: setFormat?.based,
    
    // Final set differences
    finalSetDiffers: !!finalSetFormat,
    finalSetThreshold: finalSetFormat?.setTo,
    finalSetTiebreakAt: finalSetFormat?.tiebreakAt,
    finalSetTiebreakTo: finalSetFormat?.tiebreakFormat?.tiebreakTo || finalSetFormat?.tiebreakSet?.tiebreakTo,
    finalSetNoTiebreak: finalSetFormat?.noTiebreak,
  };
}

/**
 * Get format description from code
 * 
 * @param code - Format code (legacy or factory)
 * @returns Human-readable description
 */
export function getFormatDescription(code: string): string | undefined {
  // If legacy, look up in UMO formats
  if (isLegacyFormat(code)) {
    // Would need access to UMO formats object
    return undefined;
  }
  
  // If factory, parse and describe
  const parsed = parseFormat(code);
  if (parsed.isValid && parsed.format) {
    const props = extractFormatProperties(parsed.format);
    
    let desc = '';
    if (props.bestOf) {
      desc += `Best of ${props.bestOf} sets, `;
    } else if (props.exactly) {
      desc += `Exactly ${props.exactly} sets, `;
    }
    
    if (props.noAd) {
      desc += 'No-Ad, ';
    } else {
      desc += 'Advantage, ';
    }
    
    desc += `${props.setThreshold} games for set`;
    
    if (props.tiebreakTo) {
      desc += `, Tiebreak to ${props.tiebreakTo}`;
    }
    
    if (props.finalSetDiffers) {
      desc += ', final set ';
      if (props.finalSetNoTiebreak) {
        desc += 'by 2 games';
      } else if (props.finalSetTiebreakTo) {
        desc += `tiebreak to ${props.finalSetTiebreakTo}`;
      }
    }
    
    return desc;
  }
  
  return undefined;
}

/**
 * Compare two format codes for equivalence
 * 
 * @param code1 - First format code
 * @param code2 - Second format code
 * @returns true if formats are equivalent
 */
export function areFormatsEquivalent(code1: string, code2: string): boolean {
  const parsed1 = parseFormat(code1);
  const parsed2 = parseFormat(code2);
  
  if (!parsed1.isValid || !parsed2.isValid) {
    return false;
  }
  
  // Compare the parsed structures
  const stringify1 = stringifyFormat(parsed1.format);
  const stringify2 = stringifyFormat(parsed2.format);
  
  return stringify1 === stringify2;
}
