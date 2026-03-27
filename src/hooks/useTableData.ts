import { useState, useEffect } from "react";
import { bitable, FieldType, ITextField } from "@lark-base-open/js-sdk";

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
  defaultSelectedValue: string | undefined;
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
  const [defaultSelectedValue, setDefaultSelectedValue] = useState<string | undefined>();

  useEffect(() => {
    const init = async () => {
      try {
        await bitable.bridge.getUserId();
        const table = await bitable.base.getActiveTable();
        const fields = await table.getFieldMetaList();
        setFieldMetaList(fields);

        const defaultField = fields.find((f) => f.type === FieldType.Text && f.name === "广告账户");
        if (!defaultField) return;

        setSelectFieldId(defaultField.id);
        const field = await table.getField<ITextField>(defaultField.id);
        const recordIds = await table.getRecordIdList();

        // 并发获取所有记录值和记录详情
        const [cellValues, records] = await Promise.all([
          Promise.all(recordIds.map((id) => field.getValue(id))),
          Promise.all(recordIds.map((id) => table.getRecordById(id))),
        ]);

        const values: string[] = [];
        for (const val of cellValues) {
          if (Array.isArray(val) && val[0]?.text) values.push(val[0].text.trim());
        }
        const options = Array.from(new Set(values)).sort().map((v) => ({ label: v, value: v }));
        setFieldValues(options);

        const recordOptions: RecordOption[] = records.map((record, i) => {
          const value = record.fields[defaultField.id];
          const name = getCellText(value) || `记录 ${recordIds[i]}`;
          return { id: recordIds[i], name };
        });
        setRecordList(recordOptions);

        if (options.length > 0) {
          setDefaultSelectedValue(options[0].value);
        }
      } catch (e) {
        console.error("获取表格信息失败", e);
      }
    };
    init();
  }, []);

  return { fieldMetaList, fieldValues, recordList, selectFieldId, defaultSelectedValue };
}
