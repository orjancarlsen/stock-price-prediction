declare module '*.svg' {
  import * as React from 'react';
  export const ReactComponent: React.FunctionComponent<
    React.SVGProps<SVGSVGElement> & { title?: string }
  >;
  export default content;
}

declare module "*.jpg" {

  const value: string;

  export default value;

}
