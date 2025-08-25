/// <reference types="react-scripts" />

declare module 'react' {
  import * as React from 'react';
  export = React;
  export as namespace React;
}

declare module 'react/jsx-runtime' {
  export * from 'react/jsx-runtime';
}