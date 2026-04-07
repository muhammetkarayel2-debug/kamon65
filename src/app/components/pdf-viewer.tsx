import { useState, useEffect, useRef, useCallback } from "react";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download, Maximize2 } from "lucide-react";

// pdfjs-dist dynamic import to avoid SSR issues
let pdfjsLib: any = null;

async function getPdfjs() {
  if (pdfjsLib) return pdfjsLib;
  pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();
  return pdfjsLib;
}

interface PdfViewerProps {
  url: string;
  fileName?: string;
  onClose: () => void;
}

export function PdfViewer({ url, fileName, onClose }: PdfViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [pageNum, setPageNum] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.2);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load PDF
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const pdfjs = await getPdfjs();
        // Try direct URL first, fallback to fetch + ArrayBuffer for CORS
        let doc;
        try {
          doc = await pdfjs.getDocument(url).promise;
        } catch {
          const resp = await fetch(url);
          const data = await resp.arrayBuffer();
          doc = await pdfjs.getDocument({ data }).promise;
        }
        if (!cancelled) {
          setPdfDoc(doc);
          setNumPages(doc.numPages);
          setPageNum(1);
          setLoading(false);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError("PDF yüklenemedi: " + (err.message || "Bilinmeyen hata"));
          setLoading(false);
        }
      }
    })();

    return () => { cancelled = true; };
  }, [url]);

  // Render page
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;
    let cancelled = false;

    (async () => {
      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale });
      const canvas = canvasRef.current;
      if (!canvas || cancelled) return;
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      const ctx = canvas.getContext("2d")!;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvasContext: ctx, viewport }).promise;
    })();

    return () => { cancelled = true; };
  }, [pdfDoc, pageNum, scale]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" && pageNum < numPages) setPageNum(p => p + 1);
      if (e.key === "ArrowLeft" && pageNum > 1) setPageNum(p => p - 1);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, pageNum, numPages]);

  const fitWidth = useCallback(() => {
    if (!containerRef.current || !pdfDoc) return;
    pdfDoc.getPage(pageNum).then((page: any) => {
      const vp = page.getViewport({ scale: 1 });
      const containerW = containerRef.current!.clientWidth - 48;
      setScale(containerW / vp.width);
    });
  }, [pdfDoc, pageNum]);

  // Fit on first load
  useEffect(() => { if (pdfDoc) fitWidth(); }, [pdfDoc, fitWidth]);

  return (
    <div className="fixed inset-0 bg-black/70 z-[60] flex flex-col" onClick={onClose}>
      <div className="flex flex-col h-full max-w-5xl w-full mx-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 bg-[#0B1D3A] rounded-b-none">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-white text-sm font-medium truncate">{fileName || "PDF Görüntüleyici"}</span>
            {numPages > 0 && <span className="text-white/50 text-xs shrink-0">{pageNum} / {numPages}</span>}
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setScale(s => Math.max(0.5, s - 0.2))} className="p-1.5 text-white/60 hover:text-white" title="Küçült"><ZoomOut className="w-4 h-4" /></button>
            <button onClick={() => setScale(s => Math.min(3, s + 0.2))} className="p-1.5 text-white/60 hover:text-white" title="Büyüt"><ZoomIn className="w-4 h-4" /></button>
            <button onClick={fitWidth} className="p-1.5 text-white/60 hover:text-white" title="Sığdır"><Maximize2 className="w-4 h-4" /></button>
            <a href={url} target="_blank" rel="noreferrer" className="p-1.5 text-white/60 hover:text-white" title="İndir"><Download className="w-4 h-4" /></a>
            <button onClick={onClose} className="p-1.5 text-white/60 hover:text-white ml-2" title="Kapat"><X className="w-5 h-5" /></button>
          </div>
        </div>

        {/* Content */}
        <div ref={containerRef} className="flex-1 overflow-auto bg-[#525659] flex items-start justify-center p-6">
          {loading && (
            <div className="flex flex-col items-center justify-center h-full text-white/60">
              <div className="w-8 h-8 border-2 border-white/20 border-t-white/80 rounded-full animate-spin mb-3" />
              <p className="text-sm">PDF yükleniyor...</p>
            </div>
          )}
          {error && (
            <div className="flex flex-col items-center justify-center h-full text-white/60">
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}
          {!loading && !error && <canvas ref={canvasRef} className="shadow-2xl" />}
        </div>

        {/* Footer - page navigation */}
        {numPages > 1 && (
          <div className="flex items-center justify-center gap-3 py-2 bg-[#0B1D3A]">
            <button onClick={() => setPageNum(p => Math.max(1, p - 1))} disabled={pageNum <= 1} className="p-1.5 text-white/60 hover:text-white disabled:opacity-30"><ChevronLeft className="w-5 h-5" /></button>
            <span className="text-white text-sm">{pageNum} / {numPages}</span>
            <button onClick={() => setPageNum(p => Math.min(numPages, p + 1))} disabled={pageNum >= numPages} className="p-1.5 text-white/60 hover:text-white disabled:opacity-30"><ChevronRight className="w-5 h-5" /></button>
          </div>
        )}
      </div>
    </div>
  );
}
