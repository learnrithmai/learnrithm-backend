declare module "common-es" {
  export function getGlobals(url: string): {
    __dirname: string;
    __filename: string;
  };
}
