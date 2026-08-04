Drop your catalog media here (the bare filenames stored in the DB).

Examples expected by the current data:
  tttt1.webp, wrsfsfs.webp, 8.webp        (ngendev_images.image_path)
  16.mp4, *.mp4                            (ngendev_videos.video_path)
  image (30).png, *.jpg                    (ngendev_videos.video_thumbnail)
  unnamed.webp, Ellipse-12.webp            (ngendev_categories.category_image)

Any file present here is served as-is at /api/media/<filename>.
Missing image files fall back to a generated placeholder; missing videos 404
(the card then shows its thumbnail). No restart needed after dropping files.
