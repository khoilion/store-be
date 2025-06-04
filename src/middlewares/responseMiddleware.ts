import {Utils, wrap} from "@mikro-orm/core";

const responseMiddleware = ({set, response}: any) => {
  set.status = 200;
  return Utils.isEntity(response) ? wrap(response).toObject() : response;
}
export default responseMiddleware;