// Custom type definitions for cloudinary
declare module "cloudinary" {
    export namespace v2 {
      export const config: (options: {
        cloud_name: string
        api_key: string
        api_secret: string
      }) => void
  
      export namespace uploader {
        export function upload(
          file: string,
          options: {
            folder?: string
            resource_type?: string
            [key: string]: any
          },
          callback: (error: any, result: any) => void,
        ): void
      }
    }
  }
  
  