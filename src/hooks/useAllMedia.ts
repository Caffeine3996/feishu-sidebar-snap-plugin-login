import { useState, useCallback } from "react";
import { message } from "antd";

interface AllMediaResult {
  apiDataListAll: any[];
  pageAll: number;
  pageSizeAll: number;
  totalAll: number;
  fetchAll: (pageNum?: number, pageSizeNum?: number, ssidOverride?: string) => Promise<void>;
}

export function useAllMedia(ssid: string): AllMediaResult {
  const [apiDataListAll, setApiDataListAll] = useState<any[]>([]);
  const [pageAll, setPageAll] = useState(1);
  const [pageSizeAll, setPageSizeAll] = useState(10);
  const [totalAll, setTotalAll] = useState(0);

  const fetchAll = useCallback(
    async (
      pageNum: number = pageAll,
      pageSizeNum: number = pageSizeAll,
      ssidOverride?: string
    ) => {
      const currentSsid = ssidOverride ?? ssid;
      if (!currentSsid) return;
      try {
        const res = await fetch(`/api/controller/disk/get_media_files.php`, {
          method: "POST",
          body: new URLSearchParams({
            current: String(pageNum),
            rowCount: String(pageSizeNum),
            ssid: currentSsid,
          }),
        });
        const data = await res.json();
        if (!data.rows?.length) {
          setApiDataListAll([]);
          setTotalAll(0);
          return;
        }
        setApiDataListAll(data.rows);
        setTotalAll(data.total);
        setPageAll(pageNum);
        setPageSizeAll(pageSizeNum);
      } catch {
        message.error("接口调用失败");
      }
    },
    [pageAll, pageSizeAll, ssid]
  );

  return { apiDataListAll, pageAll, pageSizeAll, totalAll, fetchAll };
}
