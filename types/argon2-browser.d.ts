declare module "argon2-browser" {
    export enum ArgonType {
      Argon2d = 0,
      Argon2i = 1,
      Argon2id = 2,
    }
  
    export interface HashOptions {
      pass: string
      salt: Uint8Array | Buffer | string
      time?: number
      mem?: number
      hashLen?: number
      parallelism?: number
      type?: ArgonType
    }
  
    export interface VerifyOptions {
      pass: string
      encoded: string
    }
  
    export interface HashResult {
      hash: Uint8Array
      encoded: string
    }
  
    export function hash(options: HashOptions): Promise<HashResult>
    export function verify(options: VerifyOptions): Promise<boolean>
  }
  
  
