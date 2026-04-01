import { useState, useEffect } from "react";

type OperationMode = "add" | "overwrite" | "fillEmpty";

interface LocalConfig {
  savedSelectFieldId: string | undefined;
  selectedRecordId: string | undefined;
  targetFieldId: string | undefined;
  operationMode: OperationMode;
  platform: string;
  saveConfig: (selectFieldId: string, recordId: string, fieldId: string, mode: OperationMode, platform: string) => void;
}

export function useLocalConfig(): LocalConfig {
  const [savedSelectFieldId, setSavedSelectFieldId] = useState<string | undefined>();
  const [selectedRecordId, setSelectedRecordId] = useState<string | undefined>();
  const [targetFieldId, setTargetFieldId] = useState<string | undefined>();
  const [operationMode, setOperationMode] = useState<OperationMode>("add");
  const [platform, setPlatform] = useState<string>("");

  useEffect(() => {
    const saved = localStorage.getItem("mediaWriterConfig");
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved);
      setSavedSelectFieldId(parsed.selectFieldId);
      setSelectedRecordId(parsed.recordId);
      setTargetFieldId(parsed.fieldId);
      setOperationMode(parsed.operationMode || "add");
      setPlatform(parsed.platform || "");
    } catch (err) {
      console.warn("读取本地配置失败：", err);
    }
  }, []);

  const saveConfig = (selectFieldId: string, recordId: string, fieldId: string, mode: OperationMode, plat: string) => {
    setSavedSelectFieldId(selectFieldId);
    setSelectedRecordId(recordId);
    setTargetFieldId(fieldId);
    setOperationMode(mode);
    setPlatform(plat);
    localStorage.setItem(
      "mediaWriterConfig",
      JSON.stringify({ selectFieldId, recordId, fieldId, operationMode: mode, platform: plat })
    );
  };

  return { savedSelectFieldId, selectedRecordId, targetFieldId, operationMode, platform, saveConfig };
}
