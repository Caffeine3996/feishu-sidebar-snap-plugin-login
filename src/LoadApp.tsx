import React, { useEffect, useState } from "react";
import { bitable } from "@lark-base-open/js-sdk";
import { Select, Button, message, Modal } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import styles from "./index.module.css";

interface TableOption {
  id: string;
  name: string;
}

function LoadApp() {
  const [tableList, setTableList] = useState<TableOption[]>([]);
  const [selectedTableId, setSelectedTableId] = useState<string>();
  const [loading, setLoading] = useState(false);

  /** 初始化获取所有 table 列表 **/
  useEffect(() => {
    const init = async () => {
      try {
        const tableMetaList = await bitable.base.getTableMetaList();
        const tables: TableOption[] = tableMetaList.map((t) => ({ id: t.id, name: t.name }));
        setTableList(tables);

        if (tables.length > 0) {
          setSelectedTableId(tables[0].id);
        }
      } catch (e) {
        console.error(e);
        message.error("获取表格列表失败");
      }
    };
    init();
  }, []);

  /** 清空选中的 table **/
  const handleClearTable = async () => {
    if (!selectedTableId) {
      message.error("请先选择一个表格");
      return;
    }

    try {
      setLoading(true);
      const table = await bitable.base.getTable(selectedTableId);
      const recordIds = await table.getRecordIdList();

      if (recordIds.length === 0) {
        message.info("该表格已经是空的");
        setLoading(false);
        return;
      }

      const tableName = tableList.find((t) => t.id === selectedTableId)?.name || "所选表格";

      Modal.confirm({
        title: "确认清空表格",
        content: `确定要清空表格"${tableName}"吗？这将删除 ${recordIds.length} 条记录，此操作不可恢复！`,
        okText: "确认清空",
        okType: "danger",
        cancelText: "取消",
        onOk: async () => {
          try {
            await table.deleteRecords(recordIds);
            message.success(`已清空 ${recordIds.length} 条记录`);
          } catch (err) {
            console.error(err);
            message.error("清空表格失败");
          } finally {
            setLoading(false);
          }
        },
        onCancel: () => {
          setLoading(false);
        },
      });
    } catch (err) {
      console.error(err);
      message.error("清空表格失败");
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div style={{ padding: "20px" }}>
        <h2 style={{ marginBottom: 20 }}>飞书表格清空工具</h2>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <span style={{ fontWeight: 500 }}>选择表格：</span>
          <Select
            style={{ width: 300 }}
            options={tableList}
            value={selectedTableId}
            placeholder="请选择要清空的表格"
            onChange={(value) => setSelectedTableId(value)}
            fieldNames={{ label: "name", value: "id" }}
          />
        </div>

        <Button
          danger
          type="primary"
          size="large"
          icon={<DeleteOutlined />}
          onClick={handleClearTable}
          loading={loading}
          disabled={!selectedTableId}
        >
          清空选中的表格
        </Button>

        <div style={{ marginTop: 20, color: "#999", fontSize: 12 }}>
          <p>⚠️ 注意：清空操作将删除表格中的所有记录，且不可恢复，请谨慎操作！</p>
        </div>
      </div>
    </div>
  );
}

export default LoadApp;
