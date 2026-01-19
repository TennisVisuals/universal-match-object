// Type shim for tods-competition-factory
// This resolves the DTS build error when tods-competition-factory types aren't properly exported

declare module 'tods-competition-factory' {
  export const utilities: {
    UUID: () => string;
    generateRange: (start: number, end: number) => number[];
    [key: string]: any;
  };
  
  export const scoreGovernor: {
    generateScoreString: (params: {
      sets: any[];
      reversed?: boolean;
    }) => string;
    [key: string]: any;
  };
  
  export const matchUpFormatCode: {
    parse: (code: string) => any;
    [key: string]: any;
  };
}
