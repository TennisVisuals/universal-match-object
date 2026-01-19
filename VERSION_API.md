# UMO Version API

The Universal Match Object now includes a version API for logging and debugging purposes.

## Usage

### From UMO Package

```typescript
import matchObject from '@tennisvisuals/universal-match-object';

// Get version via UMO API
console.log('UMO version:', matchObject.version());
// Output: UMO version: 2.1.0
```

### From Formats Export

```typescript
import { version } from '@tennisvisuals/universal-match-object/formats';

console.log('UMO version:', version);
// Output: UMO version: 2.1.0
```

### In Mobile App (tennisvisuals-mobile)

```typescript
import matchObject from '@tennisvisuals/universal-match-object';

// During initialization
console.log('UMO version:', matchObject.version());
```

Example initialization logging:
```typescript
// src/config/initialState.ts
import { version } from './version';
import matchObject from '@tennisvisuals/universal-match-object';

console.log(`%cApp version: ${version}`, 'color: lightblue');
console.log(`%cUMO version: ${matchObject.version()}`, 'color: lightgreen');
```

## Build Process

The version is automatically injected during build:

1. `src/version.ts` contains `@VERSION@` placeholder
2. `pnpm build` runs `tsup` to compile
3. `postbuild` hook runs `./addVersion $npm_package_version`
4. `@VERSION@` is replaced with actual version from `package.json`

## Publishing

Use the provided release scripts:

```bash
# Patch release (2.1.0 → 2.1.1)
pnpm run release:patch

# Minor release (2.1.0 → 2.2.0)
pnpm run release:minor

# Major release (2.1.0 → 3.0.0)
pnpm run release:major
```

Each script:
1. Runs `pnpm run commits` to show changes since last tag
2. Bumps version using `semver`
3. Publishes to npm with `--tag latest`
