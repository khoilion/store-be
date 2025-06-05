import { Elysia, t } from "elysia";
import userService from "../services/UserService";
import authMacro from "../macros/auth";
import MinioService from "../services/MinioService";

const uploadController = new Elysia()
  .group("/upload", group =>
    group
      .get("/presigned-url", async ({ query }) => {
        const url = await MinioService.getInstance().getPreSignedUrl(query.objectName)
        return {
          url,
          imageUrl: `https://khoi-upload.fcstoys.cloud/store/${query.objectName}`
        }
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