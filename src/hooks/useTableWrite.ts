import { useCallback } from "react";
import { bitable, IRecordValue, ITextField } from "@lark-base-open/js-sdk";
import { message } from "antd";

type OperationMode = "add" | "overwrite" | "fillEmpty";

interface TableWriteOptions {
  selectFieldId: string | undefined;
  selectedValue: string | undefined;
  targetFieldId: string | undefined;
  operationMode: OperationMode;
  selectedIds: Set<string>;
  multiRecord: boolean;
}

export function useTableWrite({
  selectFieldId,
  selectedValue,
  targetFieldId,
  operationMode,
  selectedIds,
  multiRecord,
}: TableWriteOptions) {
  const findSourceRecordId = async (table: any, field: ITextField, value: string) => {
    const recordIds = await table.getRecordIdList();
    for (const id of recordIds) {
      const val = await field.getValue(id);
      if (Array.isArray(val) && val[0]?.text === value) return id;
    }
    return undefined;
  };

  const READONLY_FIELD_TYPES = new Set<number>([
    19,    // Lookup
    20,    // Formula
    1001,  // CreatedTime
    1002,  // ModifiedTime
    1003,  // CreatedUser
    1004,  // ModifiedUser
    1005,  // AutoNumber
  ]);

  const handleAddMode = async (table: any, items: { f_name: string }[]) => {
    if (!targetFieldId) return message.error("请选择写入列");
    if (!selectFieldId) return message.error("字段未初始化");
    if (!selectedValue) return message.error("请先选择一个源值");

    const field = await table.getField(selectFieldId);
    const sourceRecordId = await findSourceRecordId(table, field, selectedValue);
    if (!sourceRecordId) return message.warning("未找到源记录");

    const sourceRecord = await table.getRecordById(sourceRecordId);
    const fieldData = sourceRecord.fields || {};

    const fieldMetaList = await table.getFieldMetaList();
    const writableIds = new Set<string>(
      fieldMetaList
        .filter((f: any) => !READONLY_FIELD_TYPES.has(f.type))
        .map((f: any) => f.id)
    );

    const buildBaseFields = () => {
      const fields: Record<string, any> = {};
      for (const key in fieldData) {
        if (!writableIds.has(key)) continue;
        const value = fieldData[key];
        if (value == null) continue;
        fields[key] = typeof value === "string" ? { type: "text", text: value } : value;
      }
      return fields;
    };

    if (multiRecord) {
      const newRecords: IRecordValue[] = items.map((i) => {
        const fields = buildBaseFields();
        fields[targetFieldId!] = { type: "text", text: i.f_name };
        return { fields };
      });
      await table.addRecords(newRecords);
      message.success(`已创建 ${newRecords.length} 条记录`);
    } else {
      const fields = buildBaseFields();
      fields[targetFieldId!] = { type: "text", text: items.map((i) => i.f_name).join(",") };
      await table.addRecords([{ fields }]);
      message.success(`已创建 1 条记录（包含 ${items.length} 个素材）`);
    }
  };

  const handleOverwriteMode = async (table: any) => {
    const selection = await bitable.base.getSelection();
    if (!selection?.fieldId || !selection?.recordId) {
      return message.error("请先在表格中选中一个单元格");
    }
    const textField = await table.getField(selection.fieldId);
    const selectedArray = Array.from(selectedIds);
    if (selectedArray.length === 0) return message.warning("请选择素材");

    if (multiRecord) {
      await textField.setValue(selection.recordId, selectedArray[0]);
      message.success("已覆盖选中素材");
    } else {
      await textField.setValue(selection.recordId, selectedArray.join(","));
      message.success(`已覆盖（包含 ${selectedArray.length} 个素材）`);
    }
  };

  const handleFillEmptyMode = async (table: any) => {
    const selection = await bitable.base.getSelection();
    if (!selection?.fieldId) return message.error("请先选中一个单元格所在列");

    const textField = await table.getField(selection.fieldId);
    const recordIds = await table.getRecordIdList();
    const selectedArray = Array.from(selectedIds);
    if (selectedArray.length === 0) return message.warning("请选择至少一个素材");

    let filledCount = 0;
    let index = 0;
    for (const recordId of recordIds) {
      const currentValue = await textField.getValue(recordId);
      const isEmpty =
        !currentValue ||
        (Array.isArray(currentValue) && (!currentValue.length || !currentValue[0]?.text));
      if (isEmpty) {
        await textField.setValue(recordId, selectedArray[index % selectedArray.length]);
        filledCount++;
        index++;
      }
    }
    message.success(`已依次填充 ${filledCount} 条空白记录`);
  };

  const writeToTable = useCallback(
    async (items: { f_name: string }[]) => {
      try {
        const table = await bitable.base.getActiveTable();
        switch (operationMode) {
          case "add":
            await handleAddMode(table, items);
            break;
          case "overwrite":
            await handleOverwriteMode(table);
            break;
          case "fillEmpty":
            await handleFillEmptyMode(table);
            break;
          default:
            message.error("未知的操作模式");
        }
      } catch (err: any) {
        console.error(err);
        message.error(`写入失败：${err?.message || err}`);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectFieldId, selectedValue, targetFieldId, operationMode, selectedIds, multiRecord]
  );

  return { writeToTable };
}
