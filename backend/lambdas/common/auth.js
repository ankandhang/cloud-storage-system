export const getUserId = (event) => {
  return event.requestContext.authorizer.claims.sub;
};

export const getUserEmail = (event) => {
  return event.requestContext.authorizer.claims.email;
};
