import { useRef } from "react";
import { Upload, X } from "lucide-react";
import { fileToBase64 } from "@/lib/image";
import { useI18n } from "@/i18n";

export const ImageUpload = ({ value, onChange, testId = "image-upload", shape = "square" }) => {
  const ref = useRef();
  const { t } = useI18n();
  const handle = async (e) => {
    const f = e.target.files?.[0];
    if (f) onChange(await fileToBase64(f));
  };
  return (
    <div className="flex items-center gap-4">
      <div className={`h-20 w-20 shrink-0 border border-white/15 bg-[#181818] grid place-items-center overflow-hidden ${shape === "round" ? "rounded-full" : "rounded-sm"}`}>
        {value ? <img src={value} alt="" className="h-full w-full object-cover" /> : <Upload className="h-6 w-6 text-zinc-500" />}
      </div>
      <div className="flex gap-2">
        <button type="button" data-testid={testId} onClick={() => ref.current.click()} className="btn-outline text-xs">{t("upload_image")}</button>
        {value && <button type="button" data-testid={`${testId}-remove`} onClick={() => onChange(null)} className="btn-ghost text-xs"><X className="h-3.5 w-3.5" /></button>}
      </div>
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={handle} />
    </div>
  );
};
