"use client";
import React from "react";
import { Button } from "./ui/button";
import { RiGoogleFill } from "@remixicon/react";
import { getGoogleOauthConsentUrl } from "@/app/authenticate/auth.action";
import { toast } from "sonner";

export const GoogleOAuthButton = () => {
  return (
    <Button
      onClick={async () => {
        const res = await getGoogleOauthConsentUrl();
        if (res?.url) {
          window.location.href = res.url;
        } else {
          toast.error("Something went wrong. Please try again later");
        }
        console.log("Google OAuth button clicked");
      }}
    >
      <RiGoogleFill className="w-4 h-4 mr-2" /> Continue with Google
    </Button>
  );
};
