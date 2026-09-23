import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

function collectCSS(): string {
  let css = "";
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      const rules = sheet.cssRules;
      if (!rules) continue;
      for (const r of Array.from(rules)) css += r.cssText + "\n";
    } catch {
      /* skip cross-origin sheets */
    }
  }
  return css;
}

const DIMS: Record<string, { width: number; height: number }> = {
  mobile: { width: 390, height: 844 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1280, height: 860 },
};

export function PreviewFrame({ device, children }: { device: string; children: ReactNode }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const ref = useRef<HTMLIFrameElement>(null);
  const [node, setNode] = useState<HTMLElement | null>(null);
  const [stageW, setStageW] = useState(0);
  const dim = DIMS[device] ?? DIMS.desktop;

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const update = () => setStageW(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const f = ref.current;
    if (!f) return;
    const doc = f.contentDocument;
    if (!doc) return;
    doc.open();
    doc.write(
      "<!doctype html><html lang='fr'><head><meta charset='utf-8'><meta name='viewport' content='width=device-width, initial-scale=1'></head><body></body></html>",
    );
    doc.close();
    const style = doc.createElement("style");
    style.textContent = collectCSS();
    doc.head.appendChild(style);
    doc.body.style.margin = "0";
    doc.body.style.minHeight = "100%";
    const root = doc.createElement("div");
    root.id = "preview-root";
    root.style.minHeight = "100%";
    doc.body.appendChild(root);
    setNode(root);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [device]);

  const pad = 32;
  const avail = Math.max(120, stageW - pad);
  const scale = dim.width > 0 ? Math.min(avail / dim.width, 1.6) : 1;
  const scaledW = dim.width * scale;
  const scaledH = dim.height * scale;

  return (
    <div ref={stageRef} className="preview-stage relative flex-1 overflow-auto bg-[var(--page-soft)] p-4">
      <div className="flex min-h-full w-full items-start justify-center">
        <div style={{ width: scaledW, height: scaledH }}>
          <iframe
            ref={ref}
            title="Aperçu"
            style={{
              width: dim.width,
              height: dim.height,
              border: 0,
              borderRadius: 12,
              background: "#fff",
              boxShadow: "0 10px 40px rgba(0,0,0,.18)",
              transform: `scale(${scale})`,
              transformOrigin: "top left",
            }}
          />
        </div>
      </div>
      {node ? createPortal(children, node) : null}
    </div>
  );
}
