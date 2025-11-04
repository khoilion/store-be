import {Elysia, t} from "elysia";
import minioService from "../services/MinioService";

const uploadController = new Elysia()
    .group("/upload", group =>
        group
            .use(minioService)
            .get("/presigned-url", async ({query, minioService}) => {
                return await minioService.getPresignedUrl(query.objectName)
            }, {
                query: t.Object({
                    objectName: t.String(),
                }),
                detail: {
                    tags: ["Upload"],
                }
            })
    )

export default uploadController