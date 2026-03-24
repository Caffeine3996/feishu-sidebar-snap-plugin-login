import React from "react";
import { Checkbox, Tooltip } from "antd";
import { PlayCircleOutlined, PictureOutlined } from "@ant-design/icons";
import styles from "../index.module.css";

const VIDEO_EXTS = /\.(mp4|mov|avi|mpeg|mpg|wmv|webm)(\?|$)/i;

function isVideoPath(path: string) {
  return VIDEO_EXTS.test(path ?? "");
}

export default function MediaGrid({ dataList, selectedIds, onToggleSelect, onPreview }: any) {
  if (!dataList.length) return null;
  return (
    <div className={styles.scrollArea}>
      <div className={styles.gridContainer}>
        {dataList.map((item: any) => {
          const isVideo = isVideoPath(item.f_path) || isVideoPath(item.file_name);
          return (
            <div key={item.media_id} className={`${styles.card} ${selectedIds.has(item.file_name) ? styles.cardSelected : ""}`}>
              <Checkbox
                className={styles.checkbox}
                checked={selectedIds.has(item.file_name)}
                onChange={(e) => onToggleSelect(item.file_name, e.target.checked)}
              />
              {isVideo ? (
                <>
                  <img
                    src={item.f_thumbnail}
                    alt={item.file_name}
                    className={styles.img}
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      (e.currentTarget.nextElementSibling as HTMLElement | null)?.style.removeProperty("display");
                    }}
                  />
                  <div className={styles.imgFallback} style={{ display: "none" }}>
                    <PlayCircleOutlined />
                  </div>
                </>
              ) : (
                <>
                  <img
                    src={item.f_path}
                    alt={item.file_name}
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
              <PlayCircleOutlined className={styles.playIcon} onClick={() => onPreview(item)} />
              <div className={styles.nameInfo}>
                <Tooltip title={item.file_name}>
                  <div className={styles.name}>{item.file_name}</div>
                </Tooltip>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
