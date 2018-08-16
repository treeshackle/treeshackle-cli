declare module "log-driver" {
  type LoggerInstance = {
    [level: string]: (...events: any[]) => void;
  };
  export default function(config: any): LoggerInstance;
}

declare module "esm" {
  type ModuleRequire = (path: string) => any;

  export default function(mod: NodeModule): ModuleRequire;
}
