import { useState, useCallback } from "react";
import { message } from "antd";
import { UserInfo } from "./useLoginCheck";

interface CustomerItem {
  customer_id: string;
  customer_name: string;
}

interface CustomerMediaResult {
  customerList: CustomerItem[];
  fetchCustomerMedia: (platform?: string, searchKeyword?: string) => Promise<void>;
}

export function useCustomerMedia(userInfo: UserInfo | null): CustomerMediaResult {
  const [customerList, setCustomerList] = useState<CustomerItem[]>([]);

  const fetchCustomerMedia = useCallback(
    async (platform: string = "Snapchat", searchKeyword: string = "") => {
      const agencyId = userInfo?.agency_ids;
      if (!agencyId) return;
      try {
        const params = new URLSearchParams({
          type: "customer",
          agency_id: agencyId,
          f_platform: platform,
          search: searchKeyword,
        });
        const res = await fetch(`/api/controller/disk/manage_media_file.php?${params}`);
        const data = await res.json();
        if (!data.results?.length) {
          setCustomerList([]);
          return;
        }
        setCustomerList(data.results);
      } catch {
        message.error("获取素材列表失败");
      }
    },
    [userInfo?.agency_ids]
  );

  return { customerList, fetchCustomerMedia };
}
