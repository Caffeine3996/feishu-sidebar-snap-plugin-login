import { useState, useEffect } from "react";
import { bitable, ITextField } from "@lark-base-open/js-sdk";

interface FieldOption {
  label: string;
  value: string;
}

interface RecordOption {
  id: string;
  name: string;
}

interface TableDataResult {
  fieldMetaList: any[];
  fieldValues: FieldOption[];
  recordList: RecordOption[];
  selectFieldId: string | undefined;
  setSelectFieldId: (id: string) => void;
}

const getCellText = (cell: any): string => {
  if (Array.isArray(cell)) {
    const first = cell[0];
    if (typeof first === "object" && first !== null && "text" in first) {
      return first.text;
    }
    return String(first);
  }
  return String(cell ?? "");
};

export function useTableData(): TableDataResult {
  const [fieldMetaList, setFieldMetaList] = useState<any[]>([]);
  const [fieldValues, setFieldValues] = useState<FieldOption[]>([]);
  const [recordList, setRecordList] = useState<RecordOption[]>([]);
  const [selectFieldId, setSelectFieldId] = useState<string | undefined>();
  const [table, setTable] = useState<any>(null);

  // 初始化：加载表格和字段列表
  useEffect(() => {
    const init = async () => {
      try {
        await bitable.bridge.getUserId();
        const t = await bitable.base.getActiveTable();
        setTable(t);
        const fields = await t.getFieldMetaList();
        setFieldMetaList(fields);
      } catch (e) {
        console.error("获取表格信息失败", e);
      }
    };
    init();
  }, []);

  // 当用户选择列后，从该列读取所有值
  useEffect(() => {
    if (!table || !selectFieldId) return;
    const fetchValues = async () => {
      try {
        const field = (await table.getField(selectFieldId)) as ITextField;
        const recordIds = await table.getRecordIdList();

        const [cellValues, records] = await Promise.all([
          Promise.all(recordIds.map((id: string) => field.getValue(id))),
          Promise.all(recordIds.map((id: string) => table.getRecordById(id))),
        ]);

        const values: string[] = [];
        for (const val of cellValues) {
          if (Array.isArray(val) && val[0]?.text) values.push(val[0].text.trim());
        }
        const options = Array.from(new Set(values)).sort().map((v) => ({ label: v, value: v }));
        setFieldValues(options);

        const recordOptions: RecordOption[] = records.map((record: any, i: number) => {
          const value = record.fields[selectFieldId];
          const name = getCellText(value) || `记录 ${recordIds[i]}`;
          return { id: recordIds[i], name };
        });
        setRecordList(recordOptions);
      } catch (e) {
        console.error("获取字段值失败", e);
      }
    };
    fetchValues();
  }, [table, selectFieldId]);

  return { fieldMetaList, fieldValues, recordList, selectFieldId, setSelectFieldId };
}
