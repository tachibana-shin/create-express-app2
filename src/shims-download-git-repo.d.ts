declare module "download-git-repo" {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const value: (
    template: string,
    dir: string,
    options: any,
    callback: (err?: any) => void
  ) => void

  export default value
}
