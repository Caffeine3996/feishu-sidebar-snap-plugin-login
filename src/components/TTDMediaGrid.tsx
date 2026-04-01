import React from "react";
import { Tooltip } from "antd";
import { PlayCircleOutlined, PictureOutlined } from "@ant-design/icons";
import styles from "../index.module.css";

const VIDEO_EXTS = /\.(mp4|mov|avi|mpeg|mpg|wmv|webm)(\?|$)/i;

function isVideoPath(path: string) {
  return VIDEO_EXTS.test(path ?? "");
}

export default function TTDMediaGrid({ dataList, onPreview }: any) {
  if (!dataList.length) return null;
  return (
    <div className={styles.scrollArea}>
      <div className={styles.gridContainer}>
        {dataList.map((item: any, idx: number) => {
          const path = item.url ?? item.f_path ?? "";
          const thumb = item.thumbnail_url ?? item.f_thumbnail ?? path;
          const name = item.name ?? item.creative_name ?? item.f_name ?? "";
          const isVideo = isVideoPath(path) || isVideoPath(name);
          return (
            <div key={item.id ?? item.creative_id ?? idx} className={styles.card}>
              {isVideo ? (
                <img
                  src={thumb}
                  alt={name}
                  className={styles.img}
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    (e.currentTarget.nextElementSibling as HTMLElement | null)?.style.removeProperty("display");
                  }}
                />
              ) : (
                <>
                  <img
                    src={path}
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
                onClick={() => onPreview({ f_path: path, f_name: name })}
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
