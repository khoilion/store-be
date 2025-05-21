import {Elysia} from "elysia";
import jwt from "jsonwebtoken";
import {initORM} from "../db";

const authMacro = new Elysia()
    .macro({
        checkAuth(roles: string[]) {
            return {
                async resolve({headers, error}) {
                    const token = headers.authorization;
                    if (!token) {
                        throw new Error('Token not found');
                    }

                    const jwtToken = token.split(" ")[1];
                    const decoded = jwt.verify(jwtToken, process.env.JWT_SECRET ?? "") as {
                        _id: string, // Ensure this matches your User entity
                        role: string
                    };
                    const db = await initORM(); // Initialize ORM
                    const user = await db.user.findOne({_id: decoded._id});
                    if (!user) {
                        throw new Error('User not found');
                    }
                    if (!roles.includes(user.role)) {
                        throw new Error('Permission denied');
                    }
                    return {user};
                }
            };
        },
    });

export default authMacro;