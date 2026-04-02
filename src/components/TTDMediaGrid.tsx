import React from "react";
import { Checkbox, Tooltip } from "antd";
import { PlayCircleOutlined, PictureOutlined } from "@ant-design/icons";
import styles from "../index.module.css";

const VIDEO_EXTS = /\.(mp4|mov|avi|mpeg|mpg|wmv|webm)(\?|$)/i;

function isVideoPath(path: string) {
  return VIDEO_EXTS.test(path ?? "");
}

export default function TTDMediaGrid({ dataList, selectedIds, onToggleSelect, onPreview }: any) {
  if (!dataList.length) return null;
  return (
    <div className={styles.scrollArea}>
      <div className={styles.gridContainer}>
        {dataList.map((item: any, idx: number) => {
      
          const thumb = item.f_thumbnail;
          const name = item.file_name ?? item.name ?? item.creative_name ?? item.f_name ?? "";
          const isVideo = isVideoPath(name);
          const mediaId = item.media_id ?? item.id ?? String(idx);
          return (
            <div key={mediaId} className={`${styles.card} ${selectedIds?.has(mediaId) ? styles.cardSelected : ""}`}>
              <Checkbox
                className={styles.checkbox}
                checked={selectedIds?.has(mediaId)}
                onChange={(e) => onToggleSelect?.(mediaId, e.target.checked)}
              />
              {isVideo ? (
                <>
                  <img
                    src={thumb}
                    alt={name}
                    className={styles.img}
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      const fallback = e.currentTarget.nextElementSibling as HTMLElement | null;
                      if (fallback) fallback.style.display = "flex";
                    }}
                  />
                  <div className={styles.imgFallback} style={{ display: thumb ? "none" : undefined }}>
                    <PictureOutlined />
                  </div>
                </>
              ) : (
                <>
                  <img
                    src={thumb}
                    alt={name}
                    className={styles.img}
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      (e.currentTarget.nextElementSibling as HTMLElement | null)?.style.removeProperty("display");
                    }}
                  />
                  <div className={styles.imgFallback} style={{ display: "none" }}>
                    <PictureOutlined />
                  </div>
                </>
              )}
              <PlayCircleOutlined
                className={styles.playIcon}
                onClick={() => onPreview({ f_path: thumb, f_name: name })}
              />
              <div className={styles.nameInfo}>
                <Tooltip title={name}>
                  <div className={styles.name}>{name}</div>
                </Tooltip>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
