import React from "react";
import { Checkbox, Tooltip } from "antd";
import { PlayCircleOutlined } from "@ant-design/icons";
import styles from "../index.module.css";

export default function MediaGrid({ dataList, selectedIds, onToggleSelect, onPreview }: any) {
  if (!dataList.length) return null;
  return (
    <div className={styles.scrollArea}>
      <div className={styles.gridContainer}>
        {dataList.map((item: any) => (
          <div key={item.media_id} className={`${styles.card} ${selectedIds.has(item.file_name) ? styles.cardSelected : ""}`}>
            <Checkbox
              className={styles.checkbox}
              checked={selectedIds.has(item.file_name)}
              onChange={(e) => onToggleSelect(item.file_name, e.target.checked)}
            />
            <img src={item.f_path} alt={item.file_name} className={styles.img} />
            <PlayCircleOutlined className={styles.playIcon} onClick={() => onPreview(item)} />
            <div className={styles.nameInfo}>
              <Tooltip title={item.file_name}>
                <div className={styles.name}>{item.file_name}</div>
              </Tooltip>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
