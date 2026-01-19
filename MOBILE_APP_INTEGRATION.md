# Mobile App Integration - UMO Version Logging

## Recommended Integration

Add UMO version logging to mobile app initialization:

```typescript
// src/config/initialState.ts
import { version } from './version';
import matchObject from '@tennisvisuals/universal-match-object';

export function setInitialState() {
  // Log app version
  console.log(`%cApp version: ${version}`, 'color: lightblue');
  
  // Log UMO version
  console.log(`%cUMO version: ${matchObject.version()}`, 'color: lightgreen');
  
  // ... rest of initialization
}
```

## Alternative: Combined Logging

```typescript
export function setInitialState() {
  console.log(
    `%cApp: ${version} | UMO: ${matchObject.version()}`,
    'color: lightblue'
  );
  
  // ... rest of initialization
}
```

## Console Output Example

```
App version: 2.0.2
UMO version: 2.1.0
```

## Benefits

1. **Debugging**: Quickly identify which UMO version is in use
2. **Support**: Users can report both app and UMO versions
3. **Development**: Track UMO updates during development
4. **Compatibility**: Verify correct UMO version is linked

## Development Workflow

When UMO is linked locally:

```bash
# In UMO directory
pnpm build

# Mobile app automatically picks up new version
# Refresh browser to see updated UMO version in console
```

## Production

After publishing UMO:

```bash
# In mobile app
pnpm unlink @tennisvisuals/universal-match-object
pnpm install

# Verify correct version
node -e "console.log(require('@tennisvisuals/universal-match-object').default.version())"
```
