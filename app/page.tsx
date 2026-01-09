import { redirect } from "next/navigation";

/**
 * 首页组件
 * 自动重定向到日程管理页面
 */
export default function Home() {
  // 将用户重定向到 /schedule 页面
  redirect("/schedule");
}
