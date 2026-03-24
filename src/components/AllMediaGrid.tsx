import React from "react";
import { Tooltip } from "antd";
import { PlayCircleOutlined, PictureOutlined } from "@ant-design/icons";
import styles from "../index.module.css";

const VIDEO_EXTS = /\.(mp4|mov|avi|mpeg|mpg|wmv|webm)(\?|$)/i;

function isVideoPath(path: string) {
  return VIDEO_EXTS.test(path ?? "");
}

export default function AllMediaGrid({ dataList, onPreview }: any) {
  if (!dataList.length) return null;
  return (
    <div className={styles.scrollArea}>
      <div className={styles.gridContainer}>
        {dataList.map((item: any) => {
          const isVideo = isVideoPath(item.f_path) || isVideoPath(item.f_name);
          return (
            <div key={item.media_id} className={styles.card}>
              {isVideo ? (
                <div className={styles.videoPlaceholder}>
                  <PlayCircleOutlined className={styles.videoPlaceholderIcon} />
                </div>
              ) : (
                <>
                  <img
                    src={item.f_path}
                    alt={item.f_name}
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
                <Tooltip title={item.f_name}>
                  <div className={styles.name}>{item.f_name}</div>
                </Tooltip>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
