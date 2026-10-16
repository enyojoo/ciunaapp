# FileDrop

## Purpose
Upload documents and images.

## Anatomy
Drop zone, camera/gallery on phones, progress, preview, remove.

## States
idle, dragging, uploading, error, done.

## Rules
Images crop to 4:3; documents allow PDF/JPG/PNG up to 10MB with clear errors.

## Upgrade
New shared.

## Code
`packages/ui-web/src/file-drop.tsx`
