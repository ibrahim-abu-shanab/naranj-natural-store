"use client";
import Image, { type ImageProps } from "next/image";
import { useState } from "react";

export default function CatalogImage({
  src,
  alt,
  onError,
  ...props
}: ImageProps) {
  const [failed, setFailed] = useState<ImageProps["src"] | null>(null);
  return (
    <Image
      {...props}
      alt={alt}
      src={src === failed ? "/images/image-placeholder.svg" : src}
      onError={(event) => {
        setFailed(src);
        onError?.(event);
      }}
    />
  );
}
