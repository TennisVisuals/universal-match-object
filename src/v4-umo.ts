/**
 * v4 UMO Entry Point
 * 
 * Export v4 adapter as drop-in replacement for v3 matchObject
 * This allows existing tests to run against v4 by changing imports
 */

import { createV3Adapter } from './v4/adapter/v3Adapter';

// Create and export adapter as default
const umo = createV3Adapter();

export default umo;

// Also export individual methods for named imports
export const {
  Match,
} = umo;
