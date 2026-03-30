import { useEffect, useRef, useState, useCallback } from "react";
import { Button, Pagination, message, Modal, Tabs, Spin } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import styles from "./index.module.css";
import HeaderBar from "./components/HeaderBar";
import MediaGrid from "./components/MediaGrid";
import AllMediaGrid from "./components/AllMediaGrid";
import PreviewModal from "./components/PreviewModal";
import SettingsDrawer from "./components/SettingsDrawer";
import UploadMedia from "./components/UploadMedia";
import { useLoginCheck } from "./hooks/useLoginCheck";
import { useLocalConfig } from "./hooks/useLocalConfig";
import { useTableData } from "./hooks/useTableData";
import { useSnapMedia } from "./hooks/useSnapMedia";
import { useAllMedia } from "./hooks/useAllMedia";
import { useCustomerMedia } from "./hooks/useCustomerMedia";
import { useTableWrite } from "./hooks/useTableWrite";

interface PreviewContent {
  type: "video" | "image";
  url: string;
  name: string;
}

function LoadApp() {
  const [selectedValue, setSelectedValue] = useState<string | undefined>();
  const [keyword, setKeyword] = useState("");
  const [activeTab, setActiveTab] = useState<"snap" | "all">("snap");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewContent, setPreviewContent] = useState<PreviewContent | null>(null);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [uploadVisible, setUploadVisible] = useState(false);

  // 初始设置检测：fieldMetaList 首次加载后只触发一次
  const initialSettingsChecked = useRef(false);

  // 本地配置
  const {
    savedSelectFieldId,
    selectedRecordId,
    targetFieldId,
    operationMode,
    platform,
    saveConfig,
  } = useLocalConfig();

  // bitable 初始化
  const { fieldMetaList, fieldValues, recordList, selectFieldId, setSelectFieldId, fetchRecordsByField } =
    useTableData();

  // 登录
  const onLoggedIn = useCallback(
    (newSsid: string) => {
      if (selectedValue && selectFieldId) {
        fetchSnap(1, 10, selectedValue, newSsid, keyword);
      }
    },
    [selectedValue, selectFieldId, keyword]
  );
  const {
    ssid,
    userInfo,
    modalVisible: loginModalVisible,
    checking: loginChecking,
    refresh: handleCheckLogin,
  } = useLoginCheck({ onLoggedIn });

  // 媒体数据
  const { apiDataList, page, pageSize, total, loading, fetchSnap } = useSnapMedia(selectedValue, ssid);
  const { apiDataListAll, pageAll, pageSizeAll, totalAll, loadingAll, fetchAll } = useAllMedia(ssid);
  const { customerList, fetchCustomerMedia } = useCustomerMedia(userInfo);

  // 写入表格
  const { writeToTable } = useTableWrite({
    selectFieldId,
    selectedValue,
    targetFieldId,
    operationMode,
    selectedIds,
  });

  // 列切换后自动选第一个值（请求由关键字 effect 统一触发）
  useEffect(() => {
    if (fieldValues.length > 0 && selectFieldId) {
      setSelectedValue(fieldValues[0].value);
    } else {
      setSelectedValue(undefined);
    }
  }, [fieldValues]);

  // fieldMetaList 首次就绪后：恢复 selectFieldId 并检测设置是否完整
  useEffect(() => {
    if (fieldMetaList.length === 0 || initialSettingsChecked.current) return;
    initialSettingsChecked.current = true;

    if (savedSelectFieldId && !selectFieldId) {
      setSelectFieldId(savedSelectFieldId);
    }

    const hasSelectField = savedSelectFieldId || selectFieldId;
    if (!hasSelectField || !targetFieldId) {
      setSettingsVisible(true);
    }
  }, [fieldMetaList]);

  // userInfo 就绪后获取客户素材列表
  useEffect(() => {
    if (userInfo?.agency_ids) {
      fetchCustomerMedia();
    }
  }, [userInfo]);

  // 关键字防抖搜索
  useEffect(() => {
    const timer = setTimeout(() => {
      if (selectedValue && selectFieldId) {
        fetchSnap(1, pageSize, selectedValue, undefined, keyword);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [keyword, selectedValue, selectFieldId, pageSize]);

  const handlePreview = (item: { name?: string; f_name?: string; f_path: string }) => {
    const name = item.name ?? item.f_name ?? "";
    const isVideo = /\.(mp4|mov|avi|mpeg|mpg|wmv|webm)(\?|$)/i.test(item.f_path ?? name);
    setPreviewContent({ type: isVideo ? "video" : "image", url: item.f_path, name });
    setPreviewVisible(true);
  };

  return (
    <div className={styles.container}>
      <HeaderBar
        selectFieldId={selectFieldId}
        fieldValues={fieldValues}
        selectedValue={selectedValue || ""}
        keyword={keyword}
        selectedCount={selectedIds.size}
        onAccountChange={(v: string) => setSelectedValue(v)}
        onKeywordChange={(v: string) => setKeyword(v)}
        onSettingsClick={() => setSettingsVisible(true)}
        onClearSelected={() => setSelectedIds(new Set())}
        onUploadClick={() => setUploadVisible(true)}
      />

      <div className={styles.tabsWrapper}>
        <Tabs
          activeKey={activeTab}
          onChange={(key) => {
            setActiveTab(key as "snap" | "all");
            if (key === "all" && apiDataListAll.length === 0) {
              fetchAll(1, pageSizeAll);
            }
          }}
          tabBarExtraContent={
            <ReloadOutlined
              style={{ cursor: "pointer", color: "#595959", marginRight: 8 }}
              onClick={() => {
                if (activeTab === "snap") {
                  fetchSnap(1, pageSize, selectedValue);
                } else {
                  fetchAll(1, pageSizeAll);
                }
              }}
            />
          }
          items={[
            {
              key: "snap",
              label: "媒体素材",
              children: (
                <div className={styles.tabContent}>
                <div className={styles.tabScrollArea}>
                    <Spin spinning={loading}>
                      <MediaGrid
                      dataList={apiDataList}
                      selectedIds={selectedIds}
                      onToggleSelect={(name: string, checked: boolean) =>
                        setSelectedIds((prev) => {
                          const s = new Set(prev);
                          checked ? s.add(name) : s.delete(name);
                          return s;
                        })
                      }
                      onPreview={(item: { name: string; f_path: string }) => handlePreview(item)}
                    />
                    </Spin>
                  </div>
                  {apiDataList.length > 0 && (
                    <div className={styles.footer}>
                      <Pagination
                        current={page}
                        pageSize={pageSize}
                        total={total}
                        showSizeChanger
                        onChange={(p, size) => fetchSnap(p, size)}
                      />
                      <Button
                        type="primary"
                        onClick={() => {
                          if (selectedIds.size === 0) return message.warning("请选择素材");
                          writeToTable(Array.from(selectedIds).map((name) => ({ f_name: name })));
                        }}
                      >
                        写入选中数据到表格
                      </Button>
                    </div>
                  )}
                </div>
              ),
            },
            {
              key: "all",
              label: "亿帆素材",
              children: (
                <div className={styles.tabContent}>
                  <div className={styles.tabScrollArea}>
                    <Spin spinning={loadingAll}>
                      <AllMediaGrid
                        dataList={apiDataListAll}
                        onPreview={(item: { f_name: string; f_path: string }) => handlePreview(item)}
                      />
                    </Spin>
                  </div>
                  {apiDataListAll.length > 0 && (
                    <div className={styles.footer}>
                      <Pagination
                        current={pageAll}
                        pageSize={pageSizeAll}
                        total={totalAll}
                        showSizeChanger
                        onChange={(p, size) => fetchAll(p, size)}
                      />
                    </div>
                  )}
                </div>
              ),
            },
          ]}
        />
      </div>

      <PreviewModal
        visible={previewVisible}
        content={previewContent}
        onClose={() => setPreviewVisible(false)}
      />
      <UploadMedia
        visible={uploadVisible}
        ssid={ssid}
        customerList={customerList}
        fallbackCustomerId={selectedValue}
        platform={platform}
        onClose={() => setUploadVisible(false)}
        onSuccess={() => {
          setUploadVisible(false);
          fetchSnap(1, pageSize, selectedValue);
        }}
      />
      <SettingsDrawer
        visible={settingsVisible}
        recordList={recordList}
        fieldMetaList={fieldMetaList}
        tempRecordId={selectedRecordId}
        tempTargetFieldId={targetFieldId}
        tempOperationMode={operationMode}
        tempSelectFieldId={selectFieldId ?? savedSelectFieldId}
        tempPlatform={platform}
        onSelectFieldChange={fetchRecordsByField}
        onConfirm={(recordId, fieldId, mode, newSelectFieldId, newPlatform) => {
          saveConfig(newSelectFieldId, recordId, fieldId, mode, newPlatform);
          if (newSelectFieldId !== selectFieldId) {
            setSelectFieldId(newSelectFieldId);
            setSelectedValue(undefined);
          }
          if (newPlatform !== platform) {
            fetchCustomerMedia(newPlatform);
          }
          setSettingsVisible(false);
        }}
      />

      <Modal
        open={loginModalVisible}
        closable={false}
        maskClosable={false} 
        footer={null}
        centered
        title="需要登录"
      >
        <p>
          请先前往{" "}
          <a href="https://bf.show/" target="_blank" rel="noreferrer">
            https://bf.show/
          </a>{" "}
          登录，登录成功后点击下方刷新按钮。
        </p>
        <Button type="primary" loading={loginChecking} onClick={handleCheckLogin}>
          已登录，点击刷新
        </Button>
      </Modal>
    </div>
  );
}

export default LoadApp;
