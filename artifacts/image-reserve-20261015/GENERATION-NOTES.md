# Generation and resume notes

Built-in image_gen was used, one call per distinct asset. Original files remain in C:/Users/ljour/.codex/generated_images/01a13fd3-7a08-70d1-83de-ed980b75a573/. Project masters are copies, not destructive replacements. Dimensions and framing requested in prompts are intentions; file-validation.json records actual results.

Early tower images have usable RGBA transparency. Some have alpha values below 16 scattered near canvas edges. Raw alpha bounds remain reported and their edge warnings remain visible; alphaBoundsAt16 is additional diagnostic information, not a pixel modification or a suppressed warning. The solid silhouettes inspected so far were inside the canvas. Integration must inspect the actual master and measure appropriate grounding rather than using raw alpha bounds blindly. No image pixels were edited by verification scripts.

The generator often fills more of the canvas than requested. Do not assume the requested 78% occupancy or 90% grounding was achieved. Derive scale/anchor from measured silhouettes. Full high-resolution masters are intentionally preserved so another model can make delivery textures after reviewing them.

The manifest and generation queue have been reconciled to all 44 selected masters. Four portrait v2 repairs replace the selected framing-defective versions, which remain under drafts/. Inspect actual files before any future regeneration.

Generation handles are terminal: cell 16 completed the evolution loop; cell 39 completed the remaining masters; cell 73 completed four portrait repair candidates, which were individually inspected and promoted. No image generation is pending. Cell 14's earlier manifest patch error did not lose Volley, which was retained and recorded.

The 2026-10-16 02:40 Asia/Manila follow-up resumed final packaging and disabled its one-time automation. The repository moved to main through unrelated work during this session; this asset reserve changes no game source and must be committed separately from unrelated changes. Runtime acceptance remains explicitly unclaimed.
