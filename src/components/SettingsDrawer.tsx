import React, { useState, useEffect } from "react";
import { Modal, Form, Select, Button, message, Radio } from "antd";

interface Props {
  visible: boolean;
  recordList: { id: string; name: string }[];
  fieldMetaList: { id: string; name: string }[];
  tempRecordId?: string;
  tempTargetFieldId?: string;
  tempOperationMode?: "add" | "overwrite" | "fillEmpty";
  tempSelectFieldId?: string;
  tempPlatform?: string;
  onSelectFieldChange?: (fieldId: string) => void;
  onConfirm: (recordId: string, fieldId: string, mode: "add" | "overwrite" | "fillEmpty", selectFieldId: string, platform: string) => void;
}

const PLATFORM_OPTIONS = [
  { label: "Snapchat", value: "Snapchat" },
  { label: "TikTok", value: "TikTok" },
  { label: "TTD", value: "TTD" },
];

export default function SettingsDrawer({
  visible,
  recordList,
  fieldMetaList,
  tempRecordId,
  tempTargetFieldId,
  tempOperationMode = "add",
  tempSelectFieldId,
  tempPlatform = "",
  onSelectFieldChange,
  onConfirm,
}: Props) {
  const [recordId, setRecordId] = useState<string | undefined>(tempRecordId);
  const [targetFieldId, setTargetFieldId] = useState<string | undefined>(tempTargetFieldId);
  const [operationMode, setOperationMode] = useState<"add" | "overwrite" | "fillEmpty">(tempOperationMode);
  const [selectFieldId, setSelectFieldId] = useState<string | undefined>(tempSelectFieldId);
  const [platform, setPlatform] = useState<string>(tempPlatform);

  // 当外部重新打开时同步初始值
  useEffect(() => {
    if (visible) {
      setRecordId(tempRecordId);
      setTargetFieldId(tempTargetFieldId);
      setOperationMode(tempOperationMode);
      setSelectFieldId(tempSelectFieldId);
      setPlatform(tempPlatform);
    }
  }, [visible, tempRecordId, tempTargetFieldId, tempOperationMode, tempSelectFieldId, tempPlatform]);

  const handleConfirm = () => {
    if (!platform) {
      return message.error("请选择媒体平台");
    }
    if (operationMode === "add" && (!recordId || !targetFieldId)) {
      return message.error("请选择源记录或写入列");
    }
    onConfirm(recordId || "", targetFieldId || "", operationMode, selectFieldId || "", platform);
  };

  return (
    <Modal
      title="设置"
      width={480}
      closable={false}
      maskClosable={false}
      open={visible}
      footer={
        <div style={{ textAlign: "right" }}>
          <Button type="primary" onClick={handleConfirm}>
            确定
          </Button>
        </div>
      }
    >
      <Form layout="horizontal" colon={false}>
        <Form.Item label="媒体平台">
          <Select
            value={platform}
            options={PLATFORM_OPTIONS}
            onChange={(v) => {
              setPlatform(v);
              setSelectFieldId(undefined);
              setRecordId(undefined);
            }}
          />
        </Form.Item>
        <Form.Item label="账户列">
          <Select
            showSearch
            placeholder="选择账户列"
            value={selectFieldId}
            options={fieldMetaList.map((f) => ({ label: f.name, value: f.id }))}
            onChange={(id) => {
              setSelectFieldId(id);
              setRecordId(undefined);
              onSelectFieldChange?.(id);
            }}
          />
        </Form.Item>
        <Form.Item label="操作模式">
          <Radio.Group
            value={operationMode}
            onChange={(e) => setOperationMode(e.target.value)}
          >
            <Radio value="add">新增</Radio>
            <Radio value="overwrite">聚焦覆盖</Radio>
            <Radio value="fillEmpty">空白补全</Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item label="源记录">
          <Select
            showSearch
            placeholder="请选择源记录"
            value={recordId}
            options={recordList.map((r) => ({ label: r.name, value: r.id }))}
            onChange={setRecordId}
          />
        </Form.Item>
        <Form.Item label="写入列">
          <Select
            showSearch
            placeholder="请选择写入列"
            value={targetFieldId}
            options={fieldMetaList.map((f) => ({ label: f.name, value: f.id }))}
            onChange={setTargetFieldId}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
