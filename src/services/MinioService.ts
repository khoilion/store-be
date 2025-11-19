import Elysia from 'elysia';
import * as Minio from 'minio'

export class MinioService {
    private minioClient: Minio.Client;
    private static instance: MinioService;

    constructor() {
        this.minioClient = new Minio.Client({
            endPoint: process.env.MINIO_ENDPOINT!,
            useSSL: true,
            accessKey: process.env.MINIO_ACCESS_KEY,
            secretKey: process.env.MINIO_SECRET_KEY,
        });
    }

    public static getInstance(): MinioService {
        if (!MinioService.instance) {
            MinioService.instance = new MinioService();
        }
        return MinioService.instance;
    }

    public async getPresignedUrl(fileName: string, expiry: number = 24 * 60 * 60) {
        const objectName = fileName.replace(/\s/g, '_');
        const bucketName = process.env.MINIO_BUCKET_NAME || 'khoilion';
        const presignedUrl = await this.minioClient.presignedPutObject(bucketName, objectName, expiry);
        const fileUrl = `https://${process.env.MINIO_ENDPOINT || 's3.ducbinh203.tech'}/${bucketName}/${objectName}`;
        return {
            imageUrl: fileUrl,
            url: presignedUrl,
        }
    }
}

export default new Elysia().decorate('minioService', MinioService.getInstance());
