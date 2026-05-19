import { useEffect, useState } from "react";

export default function AnimeImage({ alt, src, variant = "thumbnail" }) {
  const [hasError, setHasError] = useState(false);
  const isPoster = variant === "poster";

  useEffect(() => {
    setHasError(false);
  }, [src]);

  if (!src || hasError) {
    return (
      <div
        aria-label={`${alt} image unavailable`}
        className={isPoster ? "poster-placeholder" : "result-thumbnail-placeholder"}
        role="img"
      >
        {isPoster ? "AniSwipe" : ""}
      </div>
    );
  }

  return (
    <img
      alt={alt}
      draggable={isPoster ? "false" : undefined}
      onDragStart={isPoster ? (event) => event.preventDefault() : undefined}
      onError={() => setHasError(true)}
      src={src}
    />
  );
}
