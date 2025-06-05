import {Client} from "minio";

class MinioService {
  private readonly minioClient: Client
  private readonly expiry = 60 * 60 * 24 * 7 // 7 days
  private static instance: MinioService;

  constructor() {
    this.minioClient = new Client({
      endPoint: "khoi-upload.fcstoys.cloud",
      port: 80,
      useSSL: false,
      accessKey: "BW8tkr3nfzLFZgfX0M1K",
      secretKey: "MDzKfeyRpWZc0e33DUByP6cJMXRBohgshlz7izNp"
    });
  }

  public static getInstance() {
    if (!MinioService.instance) {
      MinioService.instance = new MinioService();
    }
    return MinioService.instance;
  }

  public async getPreSignedUrl(objectName: string) {
    return new Promise((resolve, reject) => {
      this.minioClient.presignedPutObject("store", objectName, this.expiry, function (e, preSignedUrl) {
        if (e) {
          console.log(e)
          reject(e)
        }
        resolve(preSignedUrl.replace("http://", "https://"));
      })
    })
  }
}

export default MinioService