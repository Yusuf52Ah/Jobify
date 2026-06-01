"use client";

import Image from "next/image";
import { User } from "firebase/auth";
import { useMemo, useState } from "react";

type UserAvatarProps = {
  user: User;
  alt?: string;
  className?: string;
  size?: number;
};

const fallbackAvatar = "/avatar.svg";

function getGooglePhotoURL(user: User) {
  return (
    user.photoURL ||
    user.providerData.find((provider) => provider.providerId === "google.com" && provider.photoURL)
      ?.photoURL ||
    fallbackAvatar
  );
}

export function UserAvatar({ user, alt = "Profil rasmi", className = "", size = 80 }: UserAvatarProps) {
  const preferredSrc = useMemo(() => getGooglePhotoURL(user), [user]);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const src = failedSrc === preferredSrc ? fallbackAvatar : preferredSrc;

  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      referrerPolicy="no-referrer"
      onError={() => setFailedSrc(preferredSrc)}
      className={className}
    />
  );
}
