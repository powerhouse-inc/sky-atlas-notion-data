// globals.d.ts
namespace NodeJS {
  interface ProcessEnv {
    API_KEY: string;
    IMPORT_API_KEY: string;
    IMPORT_API_URL: string;
    GITHUB_TOKEN: string;
    USE_LOCAL_DATA: string;
    SKIP_IMPORT_API: string;
    SKIP_GITHUB_SNAPSHOT: string;
  }
}
