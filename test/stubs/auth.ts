// Stub for @/server/auth so tests don't load the full next-auth chain.
export const auth = async () => null;
export const signIn = async () => undefined;
export const signOut = async () => undefined;
export const handlers = {
  GET: async () => new Response(null),
  POST: async () => new Response(null),
};
