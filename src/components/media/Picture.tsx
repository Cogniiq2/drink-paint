import Image, { type ImageProps } from "next/image";

/**
 * Thin wrapper over next/image that enforces reserved dimensions (CLS 0),
 * sensible `sizes`, and the media-frame treatment.
 */
export function Picture({
  src,
  alt,
  width,
  height,
  sizes = "(min-width: 1024px) 50vw, 100vw",
  priority = false,
  className = "",
  frameClassName = "",
  hover = false,
  fill = false,
}: {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  sizes?: string;
  priority?: boolean;
  className?: string;
  frameClassName?: string;
  hover?: boolean;
  fill?: boolean;
}) {
  const common: Partial<ImageProps> = { sizes, priority, quality: 78, draggable: false };
  return (
    <div className={`media-frame ${hover ? "media-hover" : ""} ${frameClassName}`}>
      {fill ? (
        <Image src={src} alt={alt} fill className={className} {...common} />
      ) : (
        <Image src={src} alt={alt} width={width} height={height} className={className} {...common} />
      )}
    </div>
  );
}
