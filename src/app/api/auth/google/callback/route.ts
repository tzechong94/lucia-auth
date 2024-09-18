import { googleOAuthClient } from "@/lib/googleOauth";
import { lucia } from "@/lib/lucia";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  console.log(req);

  const url = req.nextUrl;
  const code = url.searchParams.get("code");
  console.log(code, "code");
  const state = url.searchParams.get("state");
  console.log(state, "state");

  if (!code || !state) {
    console.error("no code or state");
    return new Response("invalid request", { status: 400 });
  }

  const codeVerifier = cookies().get("codeVerifier")?.value;
  const savedState = cookies().get("state")?.value;

  if (!codeVerifier || !savedState) {
    console.error("no code verifier or state");
    return new Response("invalid request", { status: 400 });
  }

  if (state !== savedState) {
    console.error("state mismatch");
    return new Response("invalid request", { status: 400 });
  }

  const { accessToken } = await googleOAuthClient.validateAuthorizationCode(
    code!,
    codeVerifier
  );

  const googleResponse = await fetch(
    "https://www.googleapis.com/oauth2/v1/userinfo",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  const googleData = (await googleResponse.json()) as {
    id: string;
    email: string;
    name: string;
    picture: string;
  };

  let userId: string = "";

  const existingUser = await prisma.user.findUnique({
    where: {
      email: googleData.email,
    },
  });

  if (existingUser) {
    userId = existingUser.id;
  } else {
    const user = await prisma.user.create({
      data: {
        email: googleData.email,
        name: googleData.name,
        picture: googleData.picture,
      },
    });
    userId = user.id;
  }

  const session = await lucia.createSession(userId, {});
  const sessionCookie = await lucia.createSessionCookie(session.id);
  cookies().set(
    sessionCookie.name,
    sessionCookie.value,
    sessionCookie.attributes
  );

  return redirect("/dashboard");
}
