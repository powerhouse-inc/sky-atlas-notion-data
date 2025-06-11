export interface UploadedFile {
  name: string;
  url: string;
  size: number;
}

export interface Manifest {
  version: string;
  uploadDate: string;
  latestBuild: string;
  totalFiles: number;
  files: UploadedFile[];
  previousBuilds: string[];
}
