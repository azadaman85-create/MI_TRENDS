"use client";

import { AnimatePresence, Reorder, motion } from "framer-motion";
import { ImagePlus, Star, Trash2, UploadCloud } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/admin/ui/Button";

type UploadingFile = { id: string; name: string; progress: number };

/**
 * Drag-and-drop uploader with reordering, replace, delete and primary-image
 * selection. Files are read into data URLs — there is no media backend in this
 * project, so uploads live with the product record on the device.
 */
export function ProductImageUploader({
  images,
  onChange,
}: {
  images: string[];
  onChange: (images: string[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const replaceIndexRef = useRef<number | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState<UploadingFile[]>([]);

  const readFiles = (files: FileList | null) => {
    if (!files?.length) return;
    const accepted = Array.from(files).filter((file) => file.type.startsWith("image/"));
    if (!accepted.length) return;

    const pending: UploadingFile[] = accepted.map((file, index) => ({
      id: `${Date.now()}-${index}`,
      name: file.name,
      progress: 0,
    }));
    setUploading(pending);

    Promise.all(
      accepted.map(
        (file) =>
          new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onprogress = (event) => {
              if (!event.lengthComputable) return;
              const percent = Math.round((event.loaded / event.total) * 100);
              setUploading((current) =>
                current.map((entry) => (entry.name === file.name ? { ...entry, progress: percent } : entry)),
              );
            };
            reader.onloadend = () => resolve(String(reader.result));
            reader.readAsDataURL(file);
          }),
      ),
    ).then((dataUrls) => {
      const replaceAt = replaceIndexRef.current;
      if (replaceAt !== null) {
        const next = [...images];
        next[replaceAt] = dataUrls[0];
        onChange(next);
        replaceIndexRef.current = null;
      } else {
        onChange([...images, ...dataUrls]);
      }
      setUploading([]);
    });
  };

  return (
    <div className="a-uploader">
      <div
        className={`a-dropzone ${dragOver ? "is-over" : ""}`.trim()}
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragOver(false);
          readFiles(event.dataTransfer.files);
        }}
      >
        <motion.span animate={{ y: dragOver ? -3 : 0 }} transition={{ duration: 0.2 }}>
          <UploadCloud size={26} aria-hidden="true" />
        </motion.span>
        <strong>Drag & drop product images</strong>
        <p>PNG or JPG, 3:4 crop works best. The first image is what the storefront shows.</p>
        <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()} style={{ marginTop: 8 }}>
          <ImagePlus size={14} aria-hidden="true" />
          Browse files
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(event) => {
            readFiles(event.target.files);
            event.target.value = "";
          }}
        />
      </div>

      <AnimatePresence>
        {uploading.map((file) => (
          <motion.div
            key={file.id}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="a-row a-row--between" style={{ marginBottom: 5 }}>
              <span className="a-micro" style={{ textTransform: "none", letterSpacing: 0 }}>
                {file.name}
              </span>
              <span className="a-micro">{file.progress}%</span>
            </div>
            <div className="a-bar-track">
              <motion.div
                className="a-bar-fill"
                style={{ background: "var(--red)" }}
                animate={{ width: `${Math.max(8, file.progress)}%` }}
                transition={{ duration: 0.25 }}
              />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {images.length > 0 ? (
        <Reorder.Group axis="y" values={images} onReorder={onChange} className="a-upload-grid" as="div">
          <AnimatePresence initial={false}>
            {images.map((image, index) => (
              <Reorder.Item
                key={image.slice(0, 64) + index}
                value={image}
                as="div"
                className={`a-upload-tile ${index === 0 ? "is-primary" : ""}`.trim()}
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileDrag={{ scale: 1.05, zIndex: 3, boxShadow: "0 18px 40px rgb(0 0 0 / 0.22)" }}
                transition={{ duration: 0.2 }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image} alt={`Product image ${index + 1}`} draggable={false} />
                {index === 0 ? <span className="a-upload-tile__flag">Primary</span> : null}
                <div className="a-upload-tile__bar">
                  <button
                    className="a-upload-tile__action"
                    type="button"
                    title="Make primary"
                    aria-label="Make this the primary image"
                    onClick={() => onChange([image, ...images.filter((entry) => entry !== image)])}
                  >
                    <Star size={13} aria-hidden="true" />
                  </button>
                  <button
                    className="a-upload-tile__action"
                    type="button"
                    title="Replace"
                    aria-label="Replace this image"
                    onClick={() => {
                      replaceIndexRef.current = index;
                      inputRef.current?.click();
                    }}
                  >
                    <ImagePlus size={13} aria-hidden="true" />
                  </button>
                  <button
                    className="a-upload-tile__action a-upload-tile__action--danger"
                    type="button"
                    title="Remove"
                    aria-label="Remove this image"
                    onClick={() => onChange(images.filter((entry) => entry !== image))}
                  >
                    <Trash2 size={13} aria-hidden="true" />
                  </button>
                </div>
              </Reorder.Item>
            ))}
          </AnimatePresence>
        </Reorder.Group>
      ) : (
        <p className="a-muted" style={{ fontSize: "0.74rem" }}>
          No images yet. The storefront falls back to the generated collection artwork until you add one.
        </p>
      )}
    </div>
  );
}
