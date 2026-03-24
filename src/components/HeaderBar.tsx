// HeaderBar.tsx
import React from "react";
import { Select, Input, Button } from "antd";
import { SettingOutlined, CloseOutlined, UploadOutlined, SearchOutlined } from "@ant-design/icons";
import styles from "../index.module.css";

export default function HeaderBar({
  fieldValues,
  selectedValue,
  keyword,
  selectedCount,
  onAccountChange,
  onKeywordChange,
  onSettingsClick,
  onClearSelected,
  onUploadClick,
}: any) {
  return (
    <div className={styles.selectWrapper}>
      <Select
        style={{ width: 180 }}
        options={fieldValues}
        value={selectedValue}
        placeholder="请选择账户"
        onChange={onAccountChange}
      />
      <Input
        style={{ width: 150 }}
        placeholder="搜索关键字"
        value={keyword}
        prefix={<SearchOutlined style={{ color: "#bbb" }} />}
        allowClear
        onChange={(e) => onKeywordChange(e.target.value)}
      />

      <div style={{ flex: 1 }} />

      {selectedCount > 0 && (
        <Button
          type="primary"
          size="small"
          style={{ display: "flex", alignItems: "center", gap: 4, borderRadius: 12, paddingInline: 10 }}
        >
          已选 {selectedCount}
          <CloseOutlined style={{ fontSize: 10 }} onClick={onClearSelected} />
        </Button>
      )}

      <UploadOutlined
        style={{ fontSize: 16, cursor: "pointer", color: "#595959" }}
        onClick={onUploadClick}
      />
      <SettingOutlined
        style={{ fontSize: 16, cursor: "pointer", color: "#595959" }}
        onClick={onSettingsClick}
      />
    </div>
  );
}
