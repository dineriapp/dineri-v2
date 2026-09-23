"use client";

import { Progress } from "@/components/ui/progress";
import { cn, acceptedTypes as defaultAcceptedTypes } from "@/lib/utils";
import { AlertCircle, CheckCircle2, GripVertical, LoaderIcon, Upload, X } from "lucide-react";
import { ReactNode, useEffect, useReducer, useRef, useState } from "react";
import { toast } from "sonner";

import { deleteS3Objects } from "@/server/actions/delete-from-aws";
import { getSignedURL } from "@/server/actions/upload-to-aws";
import {
  closestCenter,
  defaultDropAnimationSideEffects,
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function isAwsS3Url(url?: string): boolean {
  if (!url) return false;
  try {
    const { hostname } = new URL(url);
    return (
      hostname.endsWith(".amazonaws.com") ||
      hostname === "amazonaws.com" ||
      hostname.includes(".s3.") ||
      hostname.startsWith("s3.") ||
      hostname.endsWith(".s3.amazonaws.com")
    );
  } catch {
    return false;
  }
}

// Types
export type UploadedFile = {
  url: string;
  key: string;
  order?: number;
  type?: "video" | "image";
};

type UploadFile = {
  id: string;
  file: File;
  progress: number;
  status: "idle" | "uploading" | "success" | "error" | "deleting";
  url?: string;
  key?: string;
  error?: string;
  order?: number;
  mediaType?: "video" | "image"; // NEW: store type for preview
};

type ImageUploaderProps = {
  maxFiles?: number;
  gridClassName?: string;
  PreviewItemClassName?: string;
  maxSizeMB?: number;
  value?: UploadedFile[];
  onChange?: (files: UploadedFile[]) => void;
  acceptTypes?: string[];
  className?: string;
  onUploadingChange?: (isUploading: boolean) => void;
  onDelete?: () => void;
  showLimit?: boolean;
  children?: ReactNode;
  triggerClassName?: string;
  sortable?: boolean;
  acceptVideos?: boolean; // NEW: enable video support
  videosOnly?: boolean; // NEW: enable video support
};

// Reducer
type State = { files: UploadFile[] };
type Action =
  | { type: "ADD_FILES"; payload: UploadFile[] }
  | { type: "UPLOAD_START"; payload: { id: string } }
  | { type: "UPDATE_PROGRESS"; payload: { id: string; progress: number } }
  | { type: "UPLOAD_SUCCESS"; payload: { id: string; url: string; key: string } }
  | { type: "UPLOAD_ERROR"; payload: { id: string; error: string } }
  | { type: "DELETE_START"; payload: { id: string } }
  | { type: "DELETE_SUCCESS"; payload: { id: string } }
  | { type: "DELETE_ERROR"; payload: { id: string } }
  | { type: "SYNC_FROM_VALUE"; payload: UploadedFile[] }
  | { type: "REORDER"; payload: { activeId: string; overId: string } };

function filesReducer(state: State, action: Action): State {
  switch (action.type) {
    case "ADD_FILES":
      return { files: [...state.files, ...action.payload] };
    case "UPLOAD_START":
      return {
        files: state.files.map((f) =>
          f.id === action.payload.id ? { ...f, status: "uploading", progress: 0 } : f,
        ),
      };
    case "UPDATE_PROGRESS":
      return {
        files: state.files.map((f) =>
          f.id === action.payload.id ? { ...f, progress: action.payload.progress } : f,
        ),
      };
    case "UPLOAD_SUCCESS":
      return {
        files: state.files.map((f) =>
          f.id === action.payload.id
            ? {
                ...f,
                status: "success",
                progress: 100,
                url: action.payload.url,
                key: action.payload.key,
              }
            : f,
        ),
      };
    case "UPLOAD_ERROR":
      return {
        files: state.files.map((f) =>
          f.id === action.payload.id ? { ...f, status: "error", error: action.payload.error } : f,
        ),
      };
    case "DELETE_START":
      return {
        files: state.files.map((f) =>
          f.id === action.payload.id ? { ...f, status: "deleting" } : f,
        ),
      };
    case "DELETE_SUCCESS":
      return {
        files: state.files.filter((f) => f.id !== action.payload.id),
      };
    case "DELETE_ERROR":
      return {
        files: state.files.map((f) =>
          f.id === action.payload.id ? { ...f, status: "success" } : f,
        ),
      };
    case "SYNC_FROM_VALUE": {
      const existingUrls = new Set(
        state.files.filter((f) => f.status === "success").map((f) => f.url),
      );
      const newUploaded = action.payload.filter((v) => !existingUrls.has(v.url));
      if (newUploaded.length === 0) return state;
      return {
        files: [
          ...state.files,
          ...newUploaded.map((v) => ({
            id: crypto.randomUUID(),
            file: new File([], ""),
            progress: 100,
            status: "success" as const,
            url: v.url,
            key: v.key,
            order: v.order,
            mediaType: v.type, // NEW: preserve type from value
          })),
        ],
      };
    }
    case "REORDER": {
      const { activeId, overId } = action.payload;
      const oldIndex = state.files.findIndex((f) => f.id === activeId);
      const newIndex = state.files.findIndex((f) => f.id === overId);
      if (oldIndex === -1 || newIndex === -1) return state;
      const newFiles = [...state.files];
      const [moved] = newFiles.splice(oldIndex, 1);
      newFiles.splice(newIndex, 0, moved);
      const updated = newFiles.map((f, idx) => {
        if (f.status === "success") return { ...f, order: idx };
        return f;
      });
      return { files: updated };
    }
    default:
      return state;
  }
}

// Helper: video preview component
const VideoPreview = ({ src, className }: { src: string; className?: string }) => (
  <video src={src} className={className} preload="metadata" muted playsInline controls={false} />
);

// Sortable grid item
const SortableImageItem = ({
  file,
  onDelete,
  PreviewItemClassName,
  isDragDisabled = false,
}: {
  file: UploadFile;
  onDelete: (id: string, key: string) => void;
  PreviewItemClassName?: string;
  isDragDisabled?: boolean;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging, over } =
    useSortable({
      id: file.id,
      disabled: isDragDisabled,
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const renderPreview = () => {
    const src = file.url || (file.file && URL.createObjectURL(file.file));
    if (!src) return <Upload className="w-8 h-8 text-[#6e6e6e]" />;

    if (file.mediaType === "video") {
      return <VideoPreview src={src} className="w-full h-full object-cover" />;
    }
    // image or fallback
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt="Preview"
        className="w-full h-full object-cover"
        onLoad={() => {
          if (file.file && !file.url) URL.revokeObjectURL(src);
        }}
      />
    );
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative touch-none border border-[#1e1e1e] rounded-none overflow-hidden bg-[#0a0a0a] transition-all",
        over?.id === file.id && !isDragging && "ring-2 ring-amber-500 bg-amber-500/10",
      )}
    >
      {!isDragDisabled && (
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="absolute top-1 left-1 z-10 cursor-grab active:cursor-grabbing bg-black/50 rounded p-0.5 text-white hover:text-[#ccc] touch-manipulation"
          aria-label="Drag to reorder"
        >
          <GripVertical size={14} />
        </button>
      )}

      <div
        className={cn(
          "aspect-square bg-[#111] flex items-center justify-center",
          PreviewItemClassName,
        )}
      >
        {renderPreview()}
      </div>

      {/* Status overlays (unchanged) */}
      {file.status === "uploading" && (
        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
          <LoaderIcon className="w-5 h-5 animate-spin text-white mb-2" />
          <Progress value={file.progress} className="w-3/4 h-1 bg-white text-green-500" />
          <span className="text-xs text-white mt-1">{file.progress}%</span>
        </div>
      )}

      {file.status === "error" && (
        <>
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center">
            <AlertCircle className="w-6 h-6 text-red-400 mb-1" />
            <span className="text-xs text-red-400 text-center px-2">{file.error || "Failed"}</span>
          </div>
          <div className="absolute top-1 right-1">
            <button
              type="button"
              onClick={() => onDelete(file.id, file.key!)}
              className="bg-red-500 cursor-pointer hover:bg-red-600 rounded-full p-1 shadow-md"
            >
              <X className="w-3 h-3 text-white" />
            </button>
          </div>
        </>
      )}

      {file.status === "deleting" && (
        <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center">
          <LoaderIcon className="w-6 h-6 animate-spin text-white" />
        </div>
      )}

      {file.status === "success" && file.key && (
        <div className="absolute top-1 right-1">
          <button
            type="button"
            onClick={() => onDelete(file.id, file.key!)}
            className="bg-red-500 cursor-pointer hover:bg-red-600 rounded-full p-1 shadow-md"
          >
            <X className="w-3 h-3 text-white" />
          </button>
        </div>
      )}

      {file.status === "success" && (
        <div className="absolute bottom-1 right-1">
          <CheckCircle2 className="w-4 h-4 text-green-400" />
        </div>
      )}
    </div>
  );
};

// Non-sortable item (original look)
const ImageItem = ({
  file,
  onDelete,
  PreviewItemClassName,
}: {
  file: UploadFile;
  onDelete: (id: string, key: string) => void;
  PreviewItemClassName?: string;
}) => {
  const renderPreview = () => {
    const src = file.url || (file.file && URL.createObjectURL(file.file));
    if (!src) return <Upload className="w-8 h-8 text-[#6e6e6e]" />;

    if (file.mediaType === "video") {
      return <VideoPreview src={src} className="w-full h-full object-cover" />;
    }
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt="Preview"
        className="w-full h-full object-cover"
        onLoad={() => {
          if (file.file && !file.url) URL.revokeObjectURL(src);
        }}
      />
    );
  };

  return (
    <div className="relative border border-[#1e1e1e] rounded-none overflow-hidden bg-[#0a0a0a]">
      <div
        className={cn(
          "aspect-square bg-[#111] flex items-center justify-center",
          PreviewItemClassName,
        )}
      >
        {renderPreview()}
      </div>

      {/* Status overlays (identical to SortableImageItem, omitted for brevity) */}
      {file.status === "uploading" && (
        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
          <LoaderIcon className="w-5 h-5 animate-spin text-white mb-2" />
          <Progress value={file.progress} className="w-3/4 h-1 bg-white text-green-500" />
          <span className="text-xs text-white mt-1">{file.progress}%</span>
        </div>
      )}
      {file.status === "error" && (
        <>
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center">
            <AlertCircle className="w-6 h-6 text-red-400 mb-1" />
            <span className="text-xs text-red-400 text-center px-2">{file.error || "Failed"}</span>
          </div>
          <div className="absolute top-1 right-1">
            <button
              type="button"
              onClick={() => onDelete(file.id, file.key!)}
              className="bg-red-500 cursor-pointer hover:bg-red-600 rounded-full p-1 shadow-md"
            >
              <X className="w-3 h-3 text-white" />
            </button>
          </div>
        </>
      )}
      {file.status === "deleting" && (
        <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center">
          <LoaderIcon className="w-6 h-6 animate-spin text-white" />
        </div>
      )}
      {file.status === "success" && file.key && (
        <div className="absolute top-1 right-1">
          <button
            type="button"
            onClick={() => onDelete(file.id, file.key!)}
            className="bg-red-500 cursor-pointer hover:bg-red-600 rounded-full p-1 shadow-md"
          >
            <X className="w-3 h-3 text-white" />
          </button>
        </div>
      )}
      {file.status === "success" && (
        <div className="absolute bottom-1 right-1">
          <CheckCircle2 className="w-4 h-4 text-green-400" />
        </div>
      )}
    </div>
  );
};

// Main component
export function MultiImageUploader({
  maxFiles = 5,
  maxSizeMB = 5,
  value = [],
  onChange,
  acceptTypes,
  className,
  gridClassName,
  PreviewItemClassName,
  onUploadingChange,
  showLimit = true,
  children,
  triggerClassName,
  sortable = false,
  acceptVideos = false,
  videosOnly = false,
  onDelete,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const deletedKeysRef = useRef<Set<string>>(new Set());
  const [dragging, setDragging] = useState(false);
  const [state, dispatch] = useReducer(filesReducer, { files: [] });
  const { files } = state;
  const [activeId, setActiveId] = useState<string | null>(null);

  const activeFile = activeId ? files.find((f) => f.id === activeId) : null;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // --- Video MIME types and final accept list ---
  const videoMimeTypes = ["video/mp4", "video/webm", "video/quicktime", "video/x-msvideo"];
  // Build the final accept list
  let finalAcceptTypes: string[] = [];
  if (videosOnly) {
    finalAcceptTypes = ["video/mp4", "video/webm", "video/quicktime", "video/x-msvideo"];
  } else if (acceptVideos) {
    finalAcceptTypes = acceptTypes
      ? [...acceptTypes, ...videoMimeTypes]
      : [...defaultAcceptedTypes, ...videoMimeTypes];
  } else {
    finalAcceptTypes = acceptTypes ? [...acceptTypes] : [...defaultAcceptedTypes];
  }
  // Remove duplicates (optional)
  finalAcceptTypes = [...new Set(finalAcceptTypes)];

  // Sync with controlled value
  useEffect(() => {
    dispatch({ type: "SYNC_FROM_VALUE", payload: value });
  }, [value]);

  // Notify parent of successful files (with order and type)
  useEffect(() => {
    const successful = files
      .filter((f) => f.status === "success" && f.url && f.key)
      .map((f) => ({
        url: f.url!,
        key: f.key!,
        order: f.order,
        type: f.mediaType, // include media type
      }));
    onChange?.(successful);
  }, [files, onChange]);

  const successCount = files.filter((f) => f.status === "success").length;
  const limitReached = successCount >= maxFiles;

  const generateId = () => crypto.randomUUID();

  function validateFile(file: File): string | null {
    if (videosOnly && !file.type.startsWith("video/")) {
      return "Only video files are allowed.";
    }
    if (!finalAcceptTypes.includes(file.type)) {
      return acceptVideos && file.type.startsWith("video/")
        ? "Invalid video format."
        : "Invalid file type. Only images are allowed.";
    }
    if (file.size > maxSizeMB * 1024 * 1024) return `File size exceeds ${maxSizeMB}MB limit.`;
    return null;
  }

  async function addFiles(selectedFiles: FileList | File[]) {
    const fileArray = Array.from(selectedFiles);
    const remainingSlots = maxFiles - successCount;
    if (remainingSlots <= 0) return;

    const newFiles: UploadFile[] = [];
    for (let i = 0; i < Math.min(fileArray.length, remainingSlots); i++) {
      const file = fileArray[i];
      const error = validateFile(file);
      if (error) {
        toast.error("Invalid file", { description: error });
        continue;
      }
      // Determine media type
      let mediaType: "video" | "image" | undefined;
      if (file.type.startsWith("image/")) mediaType = "image";
      else if (file.type.startsWith("video/")) mediaType = "video";

      newFiles.push({
        id: generateId(),
        file,
        progress: 0,
        status: "idle",
        order: sortable ? successCount + newFiles.length : undefined,
        mediaType,
      });
    }
    if (newFiles.length === 0) return;
    dispatch({ type: "ADD_FILES", payload: newFiles });
    newFiles.forEach((f) => uploadFile(f.id, f.file));
  }

  async function uploadFile(id: string, file: File) {
    dispatch({ type: "UPLOAD_START", payload: { id } });
    try {
      dispatch({ type: "UPDATE_PROGRESS", payload: { id, progress: 0 } });
      const checksum = await sha256(file);
      const signed = await getSignedURL(file.type, file.size, checksum, file.name);
      if (!signed.success || !signed.data)
        throw new Error(signed.error || "Failed to get signed URL");
      const { uploadUrl, publicUrl, key } = signed.data;

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", uploadUrl);
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100);
            dispatch({ type: "UPDATE_PROGRESS", payload: { id, progress: percent } });
          }
        };
        xhr.onload = () =>
          xhr.status >= 200 && xhr.status < 300
            ? resolve()
            : reject(new Error(`Upload failed: ${xhr.status}`));
        xhr.onerror = () => reject(new Error("Upload failed"));
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.send(file);
      });

      dispatch({ type: "UPLOAD_SUCCESS", payload: { id, url: publicUrl, key } });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Upload failed";
      dispatch({ type: "UPLOAD_ERROR", payload: { id, error: errorMessage } });
    }
  }

  async function deleteFile(fileId: string, key: string) {
    const file = files.find((f) => f.id === fileId);
    const isAws = isAwsS3Url(file?.url);
    if (!isAws) {
      dispatch({ type: "DELETE_SUCCESS", payload: { id: fileId } });
      onDelete?.();
      return;
    }
    deletedKeysRef.current.add(key);
    dispatch({ type: "DELETE_START", payload: { id: fileId } });
    try {
      const result = await deleteS3Objects([key]);
      if (!result.success) throw new Error("Failed to delete from S3");
      dispatch({ type: "DELETE_SUCCESS", payload: { id: fileId } });
      onDelete?.();
    } catch (error) {
      toast.error("Delete failed", {
        description: (
          <span className="text-xs text-muted-foreground">
            {error instanceof Error ? error.message : "Something went wrong while deleting."}
          </span>
        ),
      });
      dispatch({ type: "DELETE_ERROR", payload: { id: fileId } });
    }
  }

  async function sha256(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    if (limitReached) return;
    addFiles(e.dataTransfer.files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (limitReached) return;
    if (e.target.files?.length) addFiles(e.target.files);
    e.target.value = "";
  };

  const openFileDialog = () => {
    if (limitReached) return;
    inputRef.current?.click();
  };

  useEffect(() => {
    onUploadingChange?.(files.some((f) => f.status === "uploading" || f.status === "deleting"));
  }, [files, onUploadingChange]);

  const uploading = files.some((f) => f.status === "uploading" || f.status === "deleting");

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;
    dispatch({
      type: "REORDER",
      payload: { activeId: active.id as string, overId: over.id as string },
    });
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  const dropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: { active: { opacity: "0.4" } },
    }),
  };

  return (
    <div className={cn("space-y-3", className)}>
      {!limitReached && !uploading && (
        <div
          onClick={openFileDialog}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={cn(
            children
              ? "w-fit"
              : "cursor-pointer border-2 border-dashed rounded-lg p-6 text-center transition",
            dragging
              ? "border-amber-500 bg-amber-500/10"
              : "border-[#1e1e1e] bg-background hover:bg-[#1a1a1a]",
            triggerClassName,
          )}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            hidden
            accept={finalAcceptTypes.join(",")}
            onChange={handleFileSelect}
            disabled={limitReached}
          />
          {children ? (
            children
          ) : (
            <>
              <Upload className="mx-auto mb-2 text-[#6e6e6e]" />
              <p className="text-sm text-[#aaa]">Click or drag files to upload</p>
              <p className="text-xs text-[#6e6e6e]">
                {" "}
                {videosOnly ? "Only video files" : finalAcceptTypes.join(", ")} up to {maxSizeMB}MB
              </p>
            </>
          )}
        </div>
      )}

      {limitReached && showLimit && (
        <div className="text-[12px] text-amber-400 bg-amber-400/10 p-2 rounded-none text-center">
          Maximum upload limit of {maxFiles} file(s) reached
        </div>
      )}

      {files.length > 0 && (
        <div className={cn("grid", gridClassName)}>
          {sortable ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragCancel={handleDragCancel}
              autoScroll={false}
            >
              <SortableContext items={files.map((f) => f.id)} strategy={rectSortingStrategy}>
                {files.map((file) => (
                  <SortableImageItem
                    key={file.id}
                    file={file}
                    onDelete={deleteFile}
                    PreviewItemClassName={PreviewItemClassName}
                    isDragDisabled={file.status !== "success"}
                  />
                ))}
              </SortableContext>
              <DragOverlay dropAnimation={dropAnimation}>
                {activeFile && (
                  <div className="relative border border-amber-500 rounded-none overflow-hidden bg-[#0a0a0a] shadow-2xl scale-105">
                    <div
                      className={cn(
                        "aspect-square bg-[#111] flex items-center justify-center",
                        PreviewItemClassName,
                      )}
                    >
                      {activeFile.mediaType === "video" ? (
                        <VideoPreview
                          src={activeFile.url || URL.createObjectURL(activeFile.file)}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={activeFile.url || URL.createObjectURL(activeFile.file)}
                          alt="Dragging"
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                  </div>
                )}
              </DragOverlay>
            </DndContext>
          ) : (
            files.map((file) => (
              <ImageItem
                key={file.id}
                file={file}
                onDelete={deleteFile}
                PreviewItemClassName={PreviewItemClassName}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
