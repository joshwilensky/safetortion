import { useEffect, useRef, useState } from "react";
import Modal from "./ui/Modal.jsx";

export default function ImageRedactor({ open, item, onCancel, onSave }) {
  const imgRef = useRef(null);
  const canvasRef = useRef(null);
  const overlayRef = useRef(null);
  const [imgUrl, setImgUrl] = useState(null);
  const [rects, setRects] = useState([]); // {x,y,w,h}
  const [drag, setDrag] = useState(null); // {x,y,w,h} while drawing
  const [blurPx, setBlurPx] = useState(12);

  // Load source image from metadata
  useEffect(() => {
    if (!open || !item) return;
    const u =
      item?.metadata?.blobUrl ||
      item?.metadata?.dataUrl ||
      item?.metadata?.thumbUrl ||
      null;
    setImgUrl(u);
    setRects([]);
    setDrag(null);
  }, [open, item]);

  const onPointerDown = (e) => {
    const box = overlayRef.current.getBoundingClientRect();
    const x = Math.max(0, e.clientX - box.left);
    const y = Math.max(0, e.clientY - box.top);
    setDrag({ x, y, w: 0, h: 0 });
  };
  const onPointerMove = (e) => {
    if (!drag) return;
    const box = overlayRef.current.getBoundingClientRect();
    const x2 = Math.max(0, e.clientX - box.left);
    const y2 = Math.max(0, e.clientY - box.top);
    setDrag((d) => (d ? { ...d, w: x2 - d.x, h: y2 - d.y } : null));
  };
  const onPointerUp = () => {
    if (!drag) return;
    let { x, y, w, h } = drag;
    if (w < 0) {
      x += w;
      w = -w;
    }
    if (h < 0) {
      y += h;
      h = -h;
    }
    if (w > 8 && h > 8) setRects((r) => [...r, { x, y, w, h }]);
    setDrag(null);
  };

  const removeRect = (i) => setRects((r) => r.filter((_, idx) => idx !== i));
  const clearRects = () => setRects([]);

  // Draw preview (image + boxes)
  useEffect(() => {
    if (!imgUrl) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imgRef.current = img;
      const cvs = canvasRef.current;
      const scale = calcFit(img.width, img.height, 720, 520); // fit in modal
      cvs.width = Math.round(img.width * scale);
      cvs.height = Math.round(img.height * scale);
      paintPreview(cvs, img, scale, rects, drag);
    };
    img.src = imgUrl;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imgUrl]);

  useEffect(() => {
    if (!imgRef.current) return;
    const cvs = canvasRef.current;
    const scale = cvs.width / imgRef.current.width;
    paintPreview(cvs, imgRef.current, scale, rects, drag);
  }, [rects, drag]);

  const doSave = async (mode) => {
    if (!imgRef.current) return;
    // Export at original resolution with blur applied to rects
    const out = document.createElement("canvas");
    out.width = imgRef.current.width;
    out.height = imgRef.current.height;
    const ctx = out.getContext("2d");
    ctx.drawImage(imgRef.current, 0, 0);

    // For each rect (defined in display space), map back to original px
    const disp = canvasRef.current;
    const scale = imgRef.current.width / disp.width;
    for (const r of rects) {
      const sx = Math.round(r.x * scale);
      const sy = Math.round(r.y * scale);
      const sw = Math.round(r.w * scale);
      const sh = Math.round(r.h * scale);

      // Draw blurred sub-rect on top
      ctx.save();
      ctx.filter = `blur(${blurPx}px)`;
      ctx.drawImage(imgRef.current, sx, sy, sw, sh, sx, sy, sw, sh);
      ctx.restore();
    }

    const blob = await new Promise((res) =>
      out.toBlob(res, "image/jpeg", 0.95)
    );
    const dataUrl = await new Promise((res) => {
      const r = new FileReader();
      r.onload = () => res(r.result);
      r.readAsDataURL(blob);
    });

    onSave?.({ blob, dataUrl, mode }); // mode: "copy" | "replace"
  };

  return (
    <Modal open={open} onClose={onCancel} size='lg' labelledBy='redactor-title'>
      <div className='modal-head'>
        <h3 id='redactor-title' className='modal-title'>
          Redact image
        </h3>
        <button className='btn modal-close' onClick={onCancel}>
          Close
        </button>
      </div>

      {!imgUrl ? (
        <p className='muted'>No image source on this item.</p>
      ) : (
        <>
          <div className='redactor-wrap'>
            <canvas ref={canvasRef} className='redactor-canvas' />
            <div
              ref={overlayRef}
              className='redactor-overlay'
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}>
              {rects.map((r, i) => (
                <div
                  key={i}
                  className='redactor-box'
                  style={{ left: r.x, top: r.y, width: r.w, height: r.h }}>
                  <button
                    className='mini-del'
                    onClick={(e) => {
                      e.stopPropagation();
                      removeRect(i);
                    }}
                    aria-label='Remove box'>
                    ×
                  </button>
                </div>
              ))}
              {drag && (
                <div
                  className='redactor-box ghost'
                  style={{
                    left: Math.min(drag.x, drag.x + drag.w),
                    top: Math.min(drag.y, drag.y + drag.h),
                    width: Math.abs(drag.w),
                    height: Math.abs(drag.h),
                  }}
                />
              )}
            </div>
          </div>

          <div
            className='row'
            style={{
              alignItems: "center",
              gap: 12,
              marginTop: 10,
              flexWrap: "wrap",
            }}>
            <label className='row' style={{ gap: 8 }}>
              <span className='badge'>Blur</span>
              <input
                type='range'
                min='4'
                max='36'
                step='1'
                value={blurPx}
                onChange={(e) => setBlurPx(+e.target.value)}
              />
              <span>{blurPx}px</span>
            </label>
            <button
              className='btn ghost'
              onClick={clearRects}
              disabled={!rects.length}>
              Clear boxes
            </button>
            <div style={{ flex: 1 }} />
            <button
              className='btn'
              onClick={() => doSave("copy")}
              disabled={!rects.length}>
              Save as Copy
            </button>
            <button
              className='btn'
              style={{ background: "var(--danger)" }}
              onClick={() => doSave("replace")}
              disabled={!rects.length}>
              Replace Original
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}

/* helpers */
function calcFit(w, h, maxW, maxH) {
  const s = Math.min(maxW / w, maxH / h);
  return Math.max(0.1, Math.min(1, s));
}
function paintPreview(cvs, img, scale, rects, drag) {
  const ctx = cvs.getContext("2d");
  ctx.clearRect(0, 0, cvs.width, cvs.height);
  ctx.drawImage(img, 0, 0, img.width * scale, img.height * scale);
  // draw semi-transparent boxes
  ctx.save();
  ctx.fillStyle = "rgba(255,77,109,0.25)";
  ctx.strokeStyle = "rgba(255,77,109,0.9)";
  ctx.lineWidth = 2;
  rects.forEach((r) => {
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.strokeRect(r.x, r.y, r.w, r.h);
  });
  if (drag) {
    const x = Math.min(drag.x, drag.x + drag.w);
    const y = Math.min(drag.y, drag.y + drag.h);
    const w = Math.abs(drag.w),
      h = Math.abs(drag.h);
    ctx.fillRect(x, y, w, h);
    ctx.strokeRect(x, y, w, h);
  }
  ctx.restore();
}
