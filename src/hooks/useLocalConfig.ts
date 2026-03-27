import { useState, useEffect } from "react";

type OperationMode = "add" | "overwrite" | "fillEmpty";

interface LocalConfig {
  selectedRecordId: string | undefined;
  targetFieldId: string | undefined;
  operationMode: OperationMode;
  saveConfig: (recordId: string, fieldId: string, mode: OperationMode) => void;
}

export function useLocalConfig(): LocalConfig {
  const [selectedRecordId, setSelectedRecordId] = useState<string | undefined>();
  const [targetFieldId, setTargetFieldId] = useState<string | undefined>();
  const [operationMode, setOperationMode] = useState<OperationMode>("add");

  useEffect(() => {
    const saved = localStorage.getItem("mediaWriterConfig");
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved);
      setTargetFieldId(parsed.fieldId);
      setOperationMode(parsed.operationMode || "add");
    } catch (err) {
      console.warn("读取本地配置失败：", err);
    }
  }, []);

  const saveConfig = (recordId: string, fieldId: string, mode: OperationMode) => {
    setSelectedRecordId(recordId);
    setTargetFieldId(fieldId);
    setOperationMode(mode);
    localStorage.setItem("mediaWriterConfig", JSON.stringify({ fieldId, operationMode: mode }));
  };

  return { selectedRecordId, targetFieldId, operationMode, saveConfig };
}
