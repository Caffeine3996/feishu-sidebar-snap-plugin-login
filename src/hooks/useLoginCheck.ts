import { useEffect, useState } from "react";
import { message } from "antd";

// iframe 单例，模块级创建避免重复挂载
const iframe = document.createElement("iframe");
iframe.src = "https://bf.show/feishu/plugin/snap_login/bridge.html";
iframe.style.display = "none";
document.body.appendChild(iframe);

const requestUserInfo = () => {
  iframe.contentWindow?.postMessage(
    { type: "GET_COOKIE", key: "inmad_user_info" },
    "https://bf.show"
  );
};

iframe.onload = () => {
  requestUserInfo();
};

export interface UserInfo {
  f_id: string;
  f_login: string;
  f_name: string;
  f_logo: string;
  f_role_ids: string;
  f_menus: string;
  f_uids: string;
  f_status: string;
  user_name: string;
  f_phone: string;
  secure_email: string;
  f_openid: string;
  user_type: string;
  agency_ids: string;
  is_prepaid: string;
  is_admin: number;
  is_pay: number;
  is_open: number;
  is_recharge: number;
  f_source: string;
  login_type: string;
  seller: {
    name: string;
    f_email: string;
    f_phone: string | null;
    f_headimgurl: string | null;
  };
  [key: string]: any; // 允许访问其他字段
}

interface LoginResult {
  loggedIn: boolean;
  userInfo: UserInfo | null;
}

async function checkIsLogin(ssid: string): Promise<LoginResult> {
  if (!ssid) return { loggedIn: false, userInfo: null };
  try {
    const res = await fetch(
      `/inc/is_login.php?ssid=${encodeURIComponent(ssid)}`
    );
    const data = await res.json();
    if (data.code === 200) {
      return { loggedIn: true, userInfo: data.userinfo ?? null };
    }
    return { loggedIn: false, userInfo: null };
  } catch {
    return { loggedIn: false, userInfo: null };
  }
}

interface UseLoginCheckOptions {
  /** 登录成功后的回调，ssid 和 userInfo 作为参数传入 */
  onLoggedIn?: (ssid: string, userInfo: UserInfo) => void;
}

export function useLoginCheck({ onLoggedIn }: UseLoginCheckOptions = {}) {
  const [ssid, setSsid] = useState("");
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.origin !== "https://bf.show") return;
      const { type, data } = event.data;
      if (type !== "COOKIE_RESULT") return;

      const newSsid = data || "";

      checkIsLogin(newSsid).then(({ loggedIn, userInfo: info }) => {
        setChecking(false);
        if (loggedIn && info) {
          setSsid(newSsid);
          setUserInfo(info);
          setModalVisible(false);
          onLoggedIn?.(newSsid, info);
        } else {
          setSsid("");
          setUserInfo(null);
          setModalVisible(true);
          if (newSsid) message.warning("还未检测到登录信息，请先前往登录");
        }
      });
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [onLoggedIn]);

  /** 刷新按钮：重新从 iframe 获取 cookie，message handler 处理后续 */
  const refresh = () => {
    setChecking(true);
    requestUserInfo();
  };

  return { ssid, userInfo, modalVisible, checking, refresh };
}
