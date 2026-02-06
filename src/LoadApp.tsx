import React, { useEffect, useState } from "react";
import { bitable } from "@lark-base-open/js-sdk";
import { Select, Button, message, Modal, Space, Card } from "antd";
import { DeleteOutlined, SendOutlined } from "@ant-design/icons";
import styles from "./index.module.css";

interface TableOption {
  id: string;
  name: string;
}

function LoadApp() {
  const [tableList, setTableList] = useState<TableOption[]>([]);
  const [selectedTableId, setSelectedTableId] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [tableData, setTableData] = useState<any[]>([]);

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

  /** 获取选中表格的所有数据 **/
  const handleGetTableData = async () => {
    if (!selectedTableId) {
      message.error("请先选择一个表格");
      return;
    }

    try {
      setSending(true);
      const table = await bitable.base.getTable(selectedTableId);
      const recordIds = await table.getRecordIdList();

      if (recordIds.length === 0) {
        message.info("该表格没有数据");
        setSending(false);
        return;
      }

      // 获取所有字段信息
      const fields = await table.getFieldMetaList();

      // 获取所有记录数据
      const records = [];
      for (const recordId of recordIds) {
        const record = await table.getRecordById(recordId);
        const recordData: any = { _recordId: recordId };

        // 遍历所有字段，获取每个字段的值
        for (const field of fields) {
          recordData[field.name] = record.fields[field.id];
        }

        records.push(recordData);
      }

      setTableData(records);

      // 发送数据到后端
      await sendDataToBackend(records);

    } catch (err) {
      console.error(err);
      message.error("获取表格数据失败");
      setSending(false);
    }
  };

  /** 发送数据到后端 **/
  const sendDataToBackend = async (data: any[]) => {
    try {
      // TODO: 替换为实际的后端API地址
      const apiUrl = "https://your-backend-api.com/api/table-data";

      const tableName = tableList.find((t) => t.id === selectedTableId)?.name || "未知表格";

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tableName,
          tableId: selectedTableId,
          recordCount: data.length,
          data,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      message.success(`成功发送 ${data.length} 条记录到后端`);
      console.log("后端返回结果：", result);

    } catch (err) {
      console.error("发送失败：", err);
      message.error("发送数据到后端失败，请检查网络或API地址");
    } finally {
      setSending(false);
    }
  };

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
        <h2 style={{ marginBottom: 20 }}>飞书表格工具</h2>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <span style={{ fontWeight: 500 }}>选择表格：</span>
          <Select
            style={{ width: 300 }}
            options={tableList}
            value={selectedTableId}
            placeholder="请选择表格"
            onChange={(value) => setSelectedTableId(value)}
            fieldNames={{ label: "name", value: "id" }}
          />
        </div>

        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          <Card title="功能一：发送表格数据到后端" size="small">
            <Space>
              <Button
                type="primary"
                size="large"
                icon={<SendOutlined />}
                onClick={handleGetTableData}
                loading={sending}
                disabled={!selectedTableId}
              >
                获取并发送数据
              </Button>
              {tableData.length > 0 && (
                <span style={{ color: "#52c41a" }}>
                  已获取 {tableData.length} 条记录
                </span>
              )}
            </Space>
            <div style={{ marginTop: 10, color: "#999", fontSize: 12 }}>
              <p>📤 获取选中表格的所有数据并发送到后端API</p>
            </div>
          </Card>

          <Card title="功能二：清空表格" size="small">
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
            <div style={{ marginTop: 10, color: "#ff4d4f", fontSize: 12 }}>
              <p>⚠️ 注意：清空操作将删除表格中的所有记录，且不可恢复，请谨慎操作！</p>
            </div>
          </Card>
        </Space>
      </div>
    </div>
  );
}

export default LoadApp;
