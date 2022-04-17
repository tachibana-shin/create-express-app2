declare module "read-metadata" {
  const reader: {
    // eslint-disable-next-line functional/prefer-readonly-type, @typescript-eslint/no-explicit-any
    sync: (path: string) => any;
  };

  export default reader;
}
