// import { handlers } from "@/lib/auth";

// export const {GET,POST} = handlers;

// app/api/auth/[...nextauth]/route.ts
// import NextAuth from "next-auth";
// import { authOptions } from "@/lib/auth";

// export const { GET, POST } = NextAuth(authOptions);

import NextAuth from "next-auth";
import authOptions from "@/lib/auth";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
