import { useState, useEffect } from "react";

type OperationMode = "add" | "overwrite" | "fillEmpty";

interface LocalConfig {
  savedSelectFieldId: string | undefined;
  selectedRecordId: string | undefined;
  targetFieldId: string | undefined;
  operationMode: OperationMode;
  saveConfig: (selectFieldId: string, recordId: string, fieldId: string, mode: OperationMode) => void;
}

export function useLocalConfig(): LocalConfig {
  const [savedSelectFieldId, setSavedSelectFieldId] = useState<string | undefined>();
  const [selectedRecordId, setSelectedRecordId] = useState<string | undefined>();
  const [targetFieldId, setTargetFieldId] = useState<string | undefined>();
  const [operationMode, setOperationMode] = useState<OperationMode>("add");

  useEffect(() => {
    const saved = localStorage.getItem("mediaWriterConfig");
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved);
      setSavedSelectFieldId(parsed.selectFieldId);
      setSelectedRecordId(parsed.recordId);
      setTargetFieldId(parsed.fieldId);
      setOperationMode(parsed.operationMode || "add");
    } catch (err) {
      console.warn("读取本地配置失败：", err);
    }
  }, []);

  const saveConfig = (selectFieldId: string, recordId: string, fieldId: string, mode: OperationMode) => {
    setSavedSelectFieldId(selectFieldId);
    setSelectedRecordId(recordId);
    setTargetFieldId(fieldId);
    setOperationMode(mode);
    localStorage.setItem(
      "mediaWriterConfig",
      JSON.stringify({ selectFieldId, recordId, fieldId, operationMode: mode })
    );
  };

  return { savedSelectFieldId, selectedRecordId, targetFieldId, operationMode, saveConfig };
}
